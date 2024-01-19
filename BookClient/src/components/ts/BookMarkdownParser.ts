enum MarkType {
  None,
  Blank,
  Note, // 内部注释行，编译时忽略
  /*
    # 书名
    # 前缀|书名
    # 前缀|书名|副标题
    
    # 毛诗正义
    <h1>毛诗正义</h1>
  */
  Header1, // 书

  /*
    ## 卷名
    ## 前缀|卷名
    ## 前缀|卷名|副标题
    
    ## 国风·邶风
    <h2>国风·邶风</h2>
  */
  Header2, // 卷

  /*
    ### 章名 
    ### 前缀|章名 
    ### 前缀|章名|副标题

    ### 二子乘舟 
    <h3>二子乘舟</h3>
  */
  Header3, // 章

  /*
    #### 节名 
    
    #### 序言
    <h4>序言</h3>
  */
  Header4, // 节

  /*
    [author] 著作者
    [author] 著作者,著作类型
    [author] 朝代,著作者,著作类型
    [author] 朝代,官职,著作者,著作类型

    [author] 西汉,太史令司,马迁,撰
    <p class="author"><span class="dynasty">[西汉]</span><span class="position">太史令</span><span class="name">司马迁</span><span class="type">撰</span></p>
  */
  Author, // 著作者

  /*
    [date]春秋战国
    [category]主类,子类
    [source](来源1)
    [source](来源2)
  */

  /*
    正文句子，正文句子，正文句子。...，正文句子。

    二子乘舟，汎汎其景。
    <div class="paragraph-div">
      <p><span class="id">1</span></p>
      <p class="paragraph">二子乘舟，汎汎其景。</p>
    </div>
  */
  Paragraph, // 正文

  /*
    !!! 注释者1,注释方式1
    ::: 注释段落1。
        !!! 注释者3,注释方式3
        ::: 注释内容3。    

    !!! 毛亨,传
    ::: 《二子乘舟》，思伋、寿也。卫宣公之二子争相为死，国人伤而思之，作是诗也。
        !!! 陆德明,音义
        ::: ○为，于伪反。

    <div class="annotation style03">
      <p class=""><span class="annotator">毛亨</span>&nbsp;<span class="type">传</span></p>
      <p class="">《二子乘舟》，思伋、寿也。卫宣公之二子争相为死，国人伤而思之，作是诗也。
        <annotation class="annotation inner style04"><span class="type">音义</span>&nbsp;<span class="">○为，于伪反。</span>
        </annotation>
      </p>
    </div>
  */

  /*
    !!! 注释方式1
    !!! 注释者1,注释方式1

    !!! 毛亨,传
    <div class="annotation style03">
      <p class=""><span class="annotator">毛亨</span>&nbsp;<span class="type">传</span></p>
  */
  /* 文内注释头
      !!! 注释者3,注释方式3
  
        !!! 陆德明,音义
    <annotation class="annotation inner style04"><span class="type">音义</span>
    </annotation>
  */
  AnnotationHeader, // 注释头

  /*
    ::: 注释段落1。

    ::: 《二子乘舟》，思伋、寿也。卫宣公之二子争相为死，国人伤而思之，作是诗也。
    <p class="">《二子乘舟》，思伋、寿也。卫宣公之二子争相为死，国人伤而思之，作是诗也。</p>
  */
  /* 文内注释内容
        !!! 注释者3,注释方式3

        ::: ○为，于伪反。
    <annotation class="annotation inner style04"><span class="">○为，于伪反。</span>
    </annotation>
  */
  Annotation, // 注释内容

  /*
    ---

    <hr></hr>
  */
  Break, // 分隔栏
}

interface ClosingTagStack {
  mark: MarkType;
  closingTag: string;
  level: number;
}

interface IHtmlParseDocument {
  isHeader(mark: MarkType): boolean;
  isHeader3(mark: MarkType): boolean;
  isAnnotation(mark: MarkType): boolean;

  getAuthorStyle(author: string): string;

  getLineCount(): number;
  ResetLineCount(): void;

  getClosingTagStack(): ClosingTagStack[];
  RollbackClosingTags(reservedCount?: number): void;
  PopClosingTagStack(): void;
  AddClosingTagStack(mark: MarkType, closingTag: string, level: number): void;

  AddContent(mark: MarkType, openingTag: string, content: string, closingTag: string, level?: number): void;
  GetContent(): string;
}

interface IBookMarkParse {
  Parse(currentLine: string, parseContent?: (content: string) => string): boolean;
}

class BookMarkParseHandler implements IBookMarkParse {
  constructor(protected readonly type: MarkType, protected readonly mark: string, protected readonly tag: string, protected readonly document: IHtmlParseDocument) {}

  protected CanHandle(currentLine: string, downlevelMark?: string): [boolean, string, number] {
    if (downlevelMark) {
      let split = false;
      let mark = this.mark;
      let length = this.mark.length;
      let level = 0;
      let count = currentLine.length / downlevelMark.length;
      let _downlevelMark = downlevelMark;

      for (let i = 0; i < count; i++) {
        split = currentLine.startsWith(`${mark}`);
        if (split == true) {
          length = mark.length;
          level += i;
          break;
        } else {
          split = currentLine.startsWith(`${_downlevelMark}`);
          if (split == true) {
            mark = downlevelMark + mark;
            _downlevelMark = downlevelMark + _downlevelMark;
            continue;
          } else {
            return [false, "", 0];
          }
        }
      }
      if (split == false) {
        return [false, "", 0];
      }

      return [true, currentLine.substr(length), level];
    } else {
      let split = currentLine.startsWith(`${this.mark}`);
      if (split == false) {
        return [false, "", 0];
      }

      return [true, currentLine.substr(this.mark.length), 0];
    }
  }

  protected parseTitleContent(content: string): string[] {
    let title: string[] = content.split(`|`);
    if (title.length <= 3) return title;
    else return [content];
  }

  protected parseAuthorContent(content: string): string[] {
    let attributes: string[] = content.split(`,`);
    if (attributes.length <= 4) return attributes;
    else return [content];
  }

  Parse(currentLine: string): boolean {
    return false;
  }
}

// 内部注释行，编译时忽略
class HtmlParseNoteHandler extends BookMarkParseHandler {
  constructor(type: MarkType, mark: string, tag: string, document: IHtmlParseDocument) {
    super(type, mark, tag, document);
  }

  Parse(currentLine: string): boolean {
    const [canHandle] = this.CanHandle(currentLine);
    if (canHandle == false) return false;

    return true;
  }
}

class HtmlParseBreakHandler extends BookMarkParseHandler {
  constructor(type: MarkType, mark: string, tag: string, document: IHtmlParseDocument) {
    super(type, mark, tag, document);
  }

  Parse(currentLine: string): boolean {
    const [canHandle] = this.CanHandle(currentLine);
    if (canHandle == false) return false;

    this.document.RollbackClosingTags();
    this.document.AddContent(this.type, `<${this.tag}>`, ``, `\n`);

    return true;
  }
}

// 书名、卷名、章节名
class HtmlParseHeaderHandler extends BookMarkParseHandler {
  constructor(type: MarkType, mark: string, tag: string, document: IHtmlParseDocument) {
    super(type, mark, tag, document);
  }

  private parseContent(content: string): string {
    let title: string[] = this.parseTitleContent(content);
    if (title.length == 2) {
      return `<span class='prefix'>${title[0]}</span><span class='separator'>·</span>${title[1]}`;
    } else if (title.length == 3) {
      return `<span class='prefix'>${title[0]}</span><span class='separator'>·</span>${title[1]}<span class='separator'>&nbsp;</span><span class='subtitle'>${title[2]}</span>`;
    } else {
      return content;
    }
  }

  Parse(currentLine: string): boolean {
    const [canHandle, content] = this.CanHandle(currentLine);
    if (canHandle == false) return false;

    // 遇到书名、卷名、章名，重置行计数值
    this.document.ResetLineCount();

    // 回滚之前 Mark 的 HTML 尾部标签（ClosingTag）
    // 遇到书名、卷名、章名、节名全部回滚之前的尾部标签
    this.document.RollbackClosingTags();
    this.document.AddContent(this.type, `<${this.tag}>`, this.parseContent(content), `</${this.tag}>\n`);

    return true;
  }
}

// 著作者
class htmlParseAuthorHandler extends BookMarkParseHandler {
  constructor(type: MarkType, mark: string, tag: string, document: IHtmlParseDocument) {
    super(type, mark, tag, document);
  }

  private parseContent(content: string): string {
    let attributes: string[] = this.parseAuthorContent(content);
    if (attributes.length == 1) {
      return `<span class="name">${attributes[0]}</span>`;
    } else if (attributes.length == 2) {
      return `<span class="name">${attributes[0]}</span>&nbsp;<span class="type">${attributes[1]}</span>`;
    } else if (attributes.length == 3) {
      return `<span class="dynasty">[${attributes[0]}]</span>&nbsp;<span class="name">${attributes[1]}</span>&nbsp;<span class="type">${attributes[2]}</span>`;
    } else if (attributes.length == 4) {
      return `<span class="dynasty">[${attributes[0]}]</span>&nbsp;<span class="position">${attributes[1]}</span>&nbsp;<span class="name">${attributes[2]}</span>&nbsp;<span class="type">${attributes[3]}</span>`;
    } else {
      return content;
    }
  }

  Parse(currentLine: string): boolean {
    const [canHandle, content] = this.CanHandle(currentLine);
    if (canHandle == false) return false;

    this.document.RollbackClosingTags();
    this.document.AddContent(this.type, `<${this.tag} class="author">`, this.parseContent(content), `</${this.tag}>\n`);

    return true;
  }
}

// 注释头
class htmlParseAnnotationHeaderHandler extends BookMarkParseHandler {
  constructor(type: MarkType, mark: string, tag: string, protected readonly downlevelMark: string, protected readonly downlevelTag: string, document: IHtmlParseDocument) {
    super(type, mark, tag, document);
  }

  private parseContent(content: string, level: number): [string, string] {
    let parsedContent = "";
    let style = "";
    let attributes: string[] = this.parseAuthorContent(content);

    if (attributes.length == 1) {
      parsedContent = 
        level == 0
          ? (attributes[0].length
            ? `  <p><span class="type">${attributes[0]}</span></p>\n`
            : "")
          : (attributes[0].length
            ? `<span class="type">${attributes[0]}</span>`
            : "");
      style = this.document.getAuthorStyle(attributes[0]);
    } else if (attributes.length == 2) {
      parsedContent =
        level == 0
          ? `  <p><span class="annotator">${attributes[0]}</span>&nbsp;<span class="type">${attributes[1]}</span></p>\n`
          : `<span class="annotator">${attributes[0]}</span>&nbsp;<span class="type">${attributes[1]}</span>`;
      style = this.document.getAuthorStyle(attributes[0]);
    } else {
      parsedContent = ``;
    }

    return [parsedContent, style];
  }

  _Parse(content: string, level: number): boolean {
    let closingTagStack = this.document.getClosingTagStack();
    if (closingTagStack.length == 0 && level > 0){
      // add warning statement
      return false;
    }

    // 回滚
    let lastMarkType = closingTagStack.length > 0 ? closingTagStack[closingTagStack.length - 1].mark : MarkType.None;
    let lastMarkLevel = closingTagStack.length > 0 ? closingTagStack[closingTagStack.length - 1].level : 0;

    // 如果level > lastMarkLevel，当前是文内注释头，不需要回滚
    // 如果level = lastMarkLevel是一致的，需要回滚到同级别注释的上一个注释头。
    // 如果level < lastMarkLevel是下降的，也需要回滚到同级别注释上一个注释头。
    if (level <= lastMarkLevel) {
      if (lastMarkType == MarkType.AnnotationHeader || lastMarkType == MarkType.Annotation) {
        let count: number = closingTagStack.length;
        for (let i = count - 1; i >= 0; i--) {
          let lastMarkType = closingTagStack[closingTagStack.length - 1].mark;
          let lastMarkLevel = closingTagStack[closingTagStack.length - 1].level;

          if (level == lastMarkLevel && lastMarkType == MarkType.AnnotationHeader) {
            this.document.PopClosingTagStack();
            break;
          } else {
            this.document.PopClosingTagStack();
          }
        }
      } else {
        this.document.RollbackClosingTags();
      }
    }

    let [parsedContent, style] = this.parseContent(content, level);
    this.document.AddContent(this.type, level == 0 ? `<${this.tag} class="annotation ${style}">\n` : `  <${this.downlevelTag} class="annotation inner ${style}">`, parsedContent, "", level);
    this.document.AddClosingTagStack(this.type, level == 0 ? `</${this.tag}>\n` : `</${this.downlevelTag}>\n`, level);

    return true;
  }

  Parse(currentLine: string): boolean {
    const [canHandle, content, level] = this.CanHandle(currentLine, this.downlevelMark);
    if (canHandle == false) return false;

    return this._Parse(content, level);
  }

  InsertDefaultHeader(level: number): void {
    this._Parse("", level);
  }
}

// 注释内容
class htmlParseAnnotationHandler extends BookMarkParseHandler {
  constructor(type: MarkType, mark: string, tag: string, protected readonly downlevelMark: string, protected readonly downlevelTag: string, document: IHtmlParseDocument) {
    super(type, mark, tag, document);
  }

  Parse(currentLine: string): boolean {
    const [canHandle, content, level] = this.CanHandle(currentLine, this.downlevelMark);
    if (canHandle == false) return false;

    let closingTagStack = this.document.getClosingTagStack();
    if (closingTagStack.length == 0) {
      if (level > 0){
        // add warning statement
        return false;
      }
      let htmlParseHandle: htmlParseAnnotationHeaderHandler = new htmlParseAnnotationHeaderHandler(MarkType.AnnotationHeader, "!!! ", "div", "    ", "annotation", this.document);
      htmlParseHandle.InsertDefaultHeader(level);
    } else {
      for (let i = closingTagStack.length - 1; i >= 0; i--) {
        let lastMarkType = closingTagStack[i].mark;
        let lastMarkLevel = closingTagStack[i].level;

        if (lastMarkLevel <= level) {
          if (level == lastMarkLevel && (lastMarkType == MarkType.AnnotationHeader || lastMarkType == MarkType.Annotation)) {
            break;
          } else {
            let htmlParseHandle: htmlParseAnnotationHeaderHandler = new htmlParseAnnotationHeaderHandler(MarkType.AnnotationHeader, "!!! ", "div", "    ", "annotation", this.document);
            htmlParseHandle.InsertDefaultHeader(level);
            break;
          }
        } else {
          // add warning statement
          console.error(`mark: ${this.mark}, content: ${currentLine}.`);
        }
      }
    }

    // 回滚
    let lastMarkType = closingTagStack.length > 0 ? closingTagStack[closingTagStack.length - 1].mark : MarkType.None;
    let lastMarkLevel = closingTagStack.length > 0 ? closingTagStack[closingTagStack.length - 1].level : 0;

    // 如果level > lastMarkLevel，当前是文内注释，不需要回滚
    // 如果level = lastMarkLevel是一致的，需要回滚到同级别注释的上一个注释内容。
    // 如果level < lastMarkLevel是下降的，也需要回滚到同级别注释上一个注释内容。
    if (level <= lastMarkLevel) {
      if (lastMarkType == MarkType.AnnotationHeader || lastMarkType == MarkType.Annotation) {
        let count: number = closingTagStack.length;
        for (let i = count - 1; i >= 0; i--) {
          let lastMarkType = closingTagStack[closingTagStack.length - 1].mark;
          let lastMarkLevel = closingTagStack[closingTagStack.length - 1].level;

          if (level == lastMarkLevel && (lastMarkType == MarkType.Annotation || lastMarkType == MarkType.AnnotationHeader)) {
            break;
          } else {
            this.document.PopClosingTagStack();
          }
        }
      } else {
        this.document.RollbackClosingTags();
      }
    }

    this.document.AddContent(this.type, level == 0 ? `  <${this.tag}>` : `<${this.downlevelTag}>`, content, "", level);
    this.document.AddClosingTagStack(this.type, level == 0 ? `</${this.tag}>\n` : `</${this.downlevelTag}>\n`, level);

    return true;
  }
}

class htmlParseParagraphHandler extends BookMarkParseHandler {
  constructor(type: MarkType, mark: string, tag: string, document: IHtmlParseDocument) {
    super(type, mark, tag, document);
  }

  Parse(currentLine: string): boolean {
    let content = currentLine;

    let closingTagStack = this.document.getClosingTagStack();
    let lastMarkType = closingTagStack.length > 0 ? closingTagStack[closingTagStack.length - 1].mark : MarkType.None;
    let lastMarkLevel = closingTagStack.length > 0 ? closingTagStack[closingTagStack.length - 1].level : 0;

    // 空白行，吃掉空白
    if (content.length == 0) {
      // 遇到空白行全部回滚之前的尾部标签
      this.document.RollbackClosingTags();
      return true;
    }
    // 遇到段落，需要考虑是否是新段落，还是延续之前的段落。
    // 判断的标准是，上一个 Mark 是否是注释，以及第一个 Mark 是否是段落。
    else {
      // 回滚
      let firstMarkType = closingTagStack.length ? closingTagStack[0].mark : MarkType.None;
      // 延续之前的段落
      if ((lastMarkType == MarkType.AnnotationHeader || lastMarkType == MarkType.Annotation) && lastMarkLevel > 0 && firstMarkType == MarkType.Paragraph) {
        this.document.RollbackClosingTags(1);
        this.document.AddContent(this.type, "", content, "");
      }
      // 新段落
      else {
        this.document.RollbackClosingTags();

        this.document.AddContent(this.type, `<${this.tag} class="paragraph-div">\n  <p><span class="id">${this.document.getLineCount()}</span></p>\n  <p class="paragraph">`, content, "");

        this.document.AddClosingTagStack(this.type, `</p>\n</${this.tag}>\n`, 0);
      }
    }

    return true;
  }
}

class HtmlParseDocument {
  private lineCount: number;
  private readonly authorClasses: Map<string, string> = new Map<string, string>();
  private readonly htmlParseHandles: BookMarkParseHandler[] = [];
  private readonly htmlParseParagraphHandler: BookMarkParseHandler = new htmlParseParagraphHandler(MarkType.Paragraph, "", "div", this);
  private htmlContent: string = "";
  private closingTagStack: ClosingTagStack[] = [];

  constructor(private readonly markContent: string, private readonly authorStyles?: string[]) {
    this.lineCount = 0;
    // "// ", "# ", "## ", "### ", "#### ", "!!! ", "::: ", "    !!! ", "    ::: ", "---", "[author] ",
    this.htmlParseHandles.push(new HtmlParseHeaderHandler(MarkType.Header1, "# ", "h1", this));
    this.htmlParseHandles.push(new HtmlParseHeaderHandler(MarkType.Header2, "## ", "h2", this));
    this.htmlParseHandles.push(new HtmlParseHeaderHandler(MarkType.Header3, "### ", "h3", this));
    this.htmlParseHandles.push(new HtmlParseHeaderHandler(MarkType.Header4, "#### ", "h4", this));
    this.htmlParseHandles.push(new htmlParseAuthorHandler(MarkType.Author, "[author] ", "p", this));
    this.htmlParseHandles.push(new htmlParseAnnotationHeaderHandler(MarkType.AnnotationHeader, "!!! ", "div", "    ", "annotation", this));
    this.htmlParseHandles.push(new htmlParseAnnotationHandler(MarkType.Annotation, "::: ", "p", "    ", "span", this));
    this.htmlParseHandles.push(new HtmlParseNoteHandler(MarkType.Note, "// ", "", this));
    this.htmlParseHandles.push(new HtmlParseBreakHandler(MarkType.Break, "---", "hr", this));
  }

  isHeader(mark: MarkType): boolean {
    if (mark == MarkType.Header1 || mark == MarkType.Header2 || mark == MarkType.Header3 || mark == MarkType.Header4) {
      return true;
    } else {
      return false;
    }
  }

  isHeader3(mark: MarkType): boolean {
    if (mark == MarkType.Header1 || mark == MarkType.Header2 || mark == MarkType.Header3) {
      return true;
    } else {
      return false;
    }
  }

  isAnnotation(mark: MarkType): boolean {
    if (mark == MarkType.AnnotationHeader || mark == MarkType.Annotation) {
      return true;
    } else {
      return false;
    }
  }

  public getAuthorStyle(author: string): string {
    let _class: string = "";
    if (this.authorStyles && this.authorStyles.length != 0) {
      if (this.authorClasses.has(author) == true) {
        return this.authorClasses.get(author) || "";
      } else {
        _class = this.authorStyles[this.authorClasses.size % this.authorStyles.length];
        this.authorClasses.set(author, _class);
        return _class;
      }
    }
    return _class;
  }

  public getLineCount(): number {
    this.lineCount++;
    return this.lineCount;
  }

  public ResetLineCount() {
    this.lineCount = 0;
  }

  public getClosingTagStack(): ClosingTagStack[] {
    return this.closingTagStack;
  }

  public RollbackClosingTags(reservedCount?: number): void {
    let count: number = this.closingTagStack.length;

    if (reservedCount) {
      count -= reservedCount;
    }

    for (let i = 0; i < count; i++) {
      this.htmlContent += this.closingTagStack.pop()?.closingTag;
    }
  }

  public AddClosingTagStack(mark: MarkType, closingTag: string, level: number): void {
    this.closingTagStack.push({
      mark: mark,
      closingTag: closingTag,
      level: level,
    });
  }

  public PopClosingTagStack(): void {
    this.htmlContent += this.closingTagStack.pop()?.closingTag;
  }

  public AddContent(mark: MarkType, openingTag: string, content: string, closingTag: string, level?: number): void {
    this.htmlContent += openingTag + content + closingTag;
  }

  public GetContent(): string {
    this.RollbackClosingTags();
    return this.htmlContent;
  }

  public Parse() {
    let lines: string[] = this.markContent.split(`\n`);
    for (let index = 0; index < lines.length; index++) {
      let parsed = false;
      for (let mark = 0; mark < this.htmlParseHandles.length; mark++) {
        parsed = this.htmlParseHandles[mark].Parse(lines[index]);
        if (parsed == true) {
          break;
        }
      }

      if (parsed == false) {
        this.htmlParseParagraphHandler.Parse(lines[index]);
      }
    }
  }
}

export class BookMarkdownDocument {
  constructor() {}

  public ToHtml(content: string): string {
    let htmlParse: HtmlParseDocument = new HtmlParseDocument(content, ["style01", "style02", "style03", "style04"]);
    htmlParse.Parse();
    return htmlParse.GetContent();
  }
}
