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

  /* 主要是注释 */
  DownLevel, // 下一级

  /*
    ---

    <hr></hr>
  */
  HorizontalRule, // 分隔栏
}

interface MarktoParseContent {
  mark: MarkType;
  openingTag: string;
  content: string;
  closingTag: string;
  level: number;
}

interface IHtmlParseDocument {
  getStyle(author: string): string;
  Add(mark: MarkType, openingTag: string, content: string, closingTag: string, level?: number): void;
  Get(): string;
}

interface IMarkElementParse {
  Parse(currentLine: string, parseContent?: (content: string) => string): boolean;
}

class HtmlParseNoteHandler implements IMarkElementParse {
  constructor(protected readonly type: MarkType, protected readonly mark: string) {}

  Parse(currentLine: string): boolean {
    let split = currentLine.startsWith(`${this.mark}`);
    if (split == false) {
      return false;
    }

    return true;
  }
}

class HtmlParseHeaderHandler implements IMarkElementParse {
  constructor(
    protected readonly type: MarkType,
    protected readonly mark: string,
    protected readonly tag: string,
    protected readonly document: IHtmlParseDocument,
    protected readonly parseContent?: (content: string) => string
  ) {}

  Parse(currentLine: string): boolean {
    let split = currentLine.startsWith(`${this.mark}`);
    if (split == false) {
      return false;
    }

    let content = currentLine.substr(this.mark.length);
    this.document.Add(this.type, `<${this.tag}>`, this.parseContent ? this.parseContent(content) : content, `</${this.tag}>\n`);
    return true;
  }
}

function parseTitleContent(content: string): string {
  let title: string[] = content.split(`|`);
  if (title.length == 2) {
    return `<span class='prefix'>${title[0]}</span><span class='separator'>·</span>${title[1]}`;
  } else if (title.length == 3) {
    return `<span class='prefix'>${title[0]}</span><span class='separator'>·</span>${title[1]}<span class='subtitle'><span class='separator'> </span>${title[2]}</span>`;
  } else {
    return content;
  }
}

function parseBookTitleContent(content: string): string {
  return parseTitleContent(content);
}

function parseVolumeTitleContent(content: string): string {
  return parseTitleContent(content);
}

function parseChapterTitleContent(content: string): string {
  return parseTitleContent(content);
}

class htmlParseAuthorHandler implements IMarkElementParse {
  constructor(
    protected readonly type: MarkType,
    protected readonly mark: string,
    protected readonly tag: string,
    protected readonly document: IHtmlParseDocument,
    protected readonly parseContent?: (content: string) => string
  ) {}

  Parse(currentLine: string): boolean {
    let split = currentLine.startsWith(`${this.mark}`);
    if (split == false) {
      return false;
    }

    let content = currentLine.substr(this.mark.length);
    this.document.Add(this.type, `<${this.tag} class="author">`, this.parseContent ? this.parseContent(content) : content, `</${this.tag}>\n`);
    return true;
  }
}

function parseAuthorContent(content: string): string {
  let attributes: string[] = content.split(`,`);
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

// AnnotationHeader
class htmlParseAnnotationHeaderHandler implements IMarkElementParse {
  constructor(
    protected readonly type: MarkType,
    protected readonly mark: string,
    protected readonly tag: string,
    protected readonly downlevelMark: string,
    protected readonly downlevelTag: string,
    protected readonly document: IHtmlParseDocument,
    protected readonly parseContent?: (content: string) => string
  ) {}

  Parse(currentLine: string): boolean {
    let length = this.mark.length;
    let split = false;
    let mark = this.mark;
    let downlevelMark = this.downlevelMark;
    let level = 0;
    let count = currentLine.length / this.downlevelMark.length;
    for (let i = 0; i < count; i++) {
      split = currentLine.startsWith(`${mark}`);
      if (split == true) {
        length += this.downlevelMark.length * i;
        level += i;
        break;
      } else {
        split = currentLine.startsWith(`${downlevelMark}`);
        if (split == true) {
          mark = this.downlevelMark + mark;
          downlevelMark = this.downlevelMark + downlevelMark;
          continue;
        } else {
          return false;
        }
      }
    }
    if (split == false) {
      return false;
    }

    let content = currentLine.substr(length);

    if (level == 0) {
      let parsedContent = "";
      let style = "";

      let attributes: string[] = content.split(`,`);
      if (attributes.length == 1) {
        parsedContent = `  <p><span class="type">${attributes[0]}</span></p>\n`;
        style = this.document.getStyle(attributes[0]);
      } else if (attributes.length == 2) {
        parsedContent = `  <p><span class="annotator">${attributes[0]}</span>&nbsp;<span class="type">${attributes[1]}</span></p>\n`;
        style = this.document.getStyle(attributes[0]);
      } else {
        parsedContent = `  <p></p>\n`;
      }

      this.document.Add(this.type, `<${this.tag} class="annotation ${style}">\n`, parsedContent, `</${this.tag}>\n`, level);
    } else {
      let parsedContent = "";
      let style = "";

      let attributes: string[] = content.split(`,`);
      if (attributes.length == 1) {
        parsedContent = `<span class="type">${attributes[0]}</span>`;
        style = this.document.getStyle(attributes[0]);
      } else if (attributes.length == 2) {
        parsedContent = `<span class="annotator">${attributes[0]}</span>&nbsp;<span class="type">${attributes[1]}</span>`;
        style = this.document.getStyle(attributes[0]);
      } else {
        parsedContent = `<span></span>`;
      }

      this.document.Add(this.type, `  <${this.downlevelTag} class="annotation inner ${style}">`, parsedContent, `</${this.downlevelTag}>\n`, level);
    }

    return true;
  }

  InsertDefaultHeader(level: number): void {
    if (level == 0) {
      this.document.Add(this.type, `<${this.tag} class="annotation">\n`, "", `</${this.tag}>\n`, level);
    } else {
      this.document.Add(this.type, `  <${this.tag} class="annotation inner">`, "", `</${this.tag}>`, level);
    }
  }
}

// Annotation
class htmlParseAnnotationHandler implements IMarkElementParse {
  constructor(
    protected readonly type: MarkType,
    protected readonly mark: string,
    protected readonly tag: string,
    protected readonly downlevelMark: string,
    protected readonly downlevelTag: string,
    protected readonly document: IHtmlParseDocument,
    protected readonly parseContent?: (content: string) => string
  ) {}

  Parse(currentLine: string): boolean {
    let length = this.mark.length;
    let split = false;
    let mark = this.mark;
    let downlevelMark = this.downlevelMark;
    let level = 0;
    let count = currentLine.length / this.downlevelMark.length;
    for (let i = 0; i < count; i++) {
      split = currentLine.startsWith(`${mark}`);
      if (split == true) {
        length += this.downlevelMark.length * i;
        level += i;
        break;
      } else {
        split = currentLine.startsWith(`${downlevelMark}`);
        if (split == true) {
          mark = this.downlevelMark + mark;
          downlevelMark = this.downlevelMark + downlevelMark;
          continue;
        } else {
          return false;
        }
      }
    }
    if (split == false) {
      return false;
    }

    let content = currentLine.substr(length);
    if (level == 0) {
      this.document.Add(this.type, `  <${this.tag}>`, this.parseContent ? this.parseContent(content) : content, `</${this.tag}>\n`, level);
    } else {
      this.document.Add(this.type, `<${this.downlevelTag}>`, this.parseContent ? this.parseContent(content) : content, `</${this.downlevelTag}>`, level);
    }

    return true;
  }
}

class htmlParseParagraphHandler implements IMarkElementParse {
  constructor(protected readonly type: MarkType, protected readonly tag: string, protected readonly document: IHtmlParseDocument) {}

  Parse(currentLine: string): boolean {
    let content = currentLine;
    this.document.Add(this.type, `<${this.tag} class="paragraph-div">\n  <p><span class="id">#id#</span></p>\n  <p class="paragraph">`, content, `</p>\n</${this.tag}>\n`);
    return true;
  }
}

class HtmlParseDocument {
  private lineCount: number;
  private readonly authorClasses: Map<string, string> = new Map<string, string>();
  private readonly htmlParseHandles: IMarkElementParse[] = [];
  private readonly htmlParseParagraphHandler: IMarkElementParse = new htmlParseParagraphHandler(MarkType.Paragraph, "div", this);
  private content: MarktoParseContent[] = [];

  constructor(private readonly markContent: string) {
    this.lineCount = 0;
    // "// ", "# ", "## ", "### ", "#### ", "!!! ", "::: ", "    !!! ", "    ::: ", "---", "[author] ",
    this.htmlParseHandles.push(new HtmlParseNoteHandler(MarkType.Note, "// "));
    this.htmlParseHandles.push(new HtmlParseHeaderHandler(MarkType.Header1, "# ", "h1", this, parseBookTitleContent));
    this.htmlParseHandles.push(new HtmlParseHeaderHandler(MarkType.Header2, "## ", "h2", this, parseVolumeTitleContent));
    this.htmlParseHandles.push(new HtmlParseHeaderHandler(MarkType.Header3, "### ", "h3", this, parseChapterTitleContent));
    this.htmlParseHandles.push(new HtmlParseHeaderHandler(MarkType.Header4, "#### ", "h4", this));
    this.htmlParseHandles.push(new htmlParseAuthorHandler(MarkType.Author, "[author] ", "p", this, parseAuthorContent));
    this.htmlParseHandles.push(new htmlParseAnnotationHeaderHandler(MarkType.AnnotationHeader, "!!! ", "div", "    ", "annotation", this));
    this.htmlParseHandles.push(new htmlParseAnnotationHandler(MarkType.Annotation, "::: ", "p", "    ", "span", this));
  }

  public getLineCount(): number {
    this.lineCount++;
    return this.lineCount;
  }

  public getStyle(author: string): string {
    if (this.authorClasses.has(author) == true) {
      return this.authorClasses.get(author) || "";
    } else {
      let _class: string = `style0${(this.authorClasses.size % 4) + 1}`;
      this.authorClasses.set(author, _class);
      //console.debug(this.authorClasses);
      return _class;
    }
  }

  public Add(mark: MarkType, openingTag: string, content: string, closingTag: string, level?: number): void {
    if (mark == MarkType.Annotation) {
      let count = this.content.length;
      if (count == 0) {
        let htmlParseHandle: htmlParseAnnotationHeaderHandler = new htmlParseAnnotationHeaderHandler(MarkType.AnnotationHeader, "!!! ", "div", "    ", "annotation", this);
        htmlParseHandle.InsertDefaultHeader(level ? level : 0);
      } else {
        let currentMarkLevel = level ? level : 0;
        for (let i = count - 1; i >= 0; i++) {
          let lastMark = this.content[i].mark;
          let lastLevel = this.content[i].level;

          if (lastLevel > currentMarkLevel) {
            continue;
          } else if (lastLevel == currentMarkLevel) {
            if (lastMark == MarkType.AnnotationHeader || lastMark == MarkType.Annotation) {
              break;
            } else {
              let htmlParseHandle: htmlParseAnnotationHeaderHandler = new htmlParseAnnotationHeaderHandler(MarkType.AnnotationHeader, "!!! ", "div", "    ", "annotation", this);
              htmlParseHandle.InsertDefaultHeader(level ? level : 0);
            }
          } else {
            console.error(`mark: ${mark}, content: ${openingTag}, ${content}, ${closingTag}.`);
          }
        }
      }
    }

    this.content.push({
      mark: mark,
      openingTag: openingTag,
      content: content,
      closingTag: closingTag,
      level: level ? level : 0,
    });
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

  getContentMarkType(parseContent: MarktoParseContent | undefined): MarkType {
    if (parseContent) {
      if (MarkType.Paragraph == parseContent.mark && parseContent.content.length == 0) {
        return MarkType.Blank;
      }
      return parseContent.mark;
    }
    return MarkType.None;
  }

  public Get(): string {
    let combine: string = "";
    let lastMark: MarkType = MarkType.None;
    let lastParseContent: MarktoParseContent | undefined = undefined;
    let currentMark: MarkType = MarkType.None;
    let currentParseContent: MarktoParseContent | undefined = undefined;
    let stackClosingTags: MarktoParseContent[] = [];

    const rollbackStackClosingTags = (reservedCount?: number) => {
      let count: number = stackClosingTags.length;

      if (reservedCount) {
        count -= reservedCount;
      }

      for (let i = 0; i < count; i++) {
        combine += stackClosingTags.pop()?.closingTag;
      }
    };

    for (let index = 0; index < this.content.length; index++) {
      currentParseContent = this.content[index];
      currentMark = this.getContentMarkType(currentParseContent);

      //console.debug(`No: ${index}, mark: ${currentMark}, content: ${currentParseContent.content}`);

      // 书名、卷名、章节名
      if (this.isHeader(currentMark)) {
        // 遇到书名、卷名、章名，重置行计数值
        this.lineCount = 0;

        // 回滚之前 Mark 的 HTML 尾部标签（ClosingTag）
        // 遇到书名、卷名、章名、空白行全部回滚之前的尾部标签
        rollbackStackClosingTags();

        combine += currentParseContent.openingTag + currentParseContent.content + currentParseContent.closingTag;
      }

      // 空白行
      else if (currentMark == MarkType.Blank) {
        // 遇到空白行全部回滚之前的尾部标签
        rollbackStackClosingTags();

        // 吃掉空白
        let nextMark: MarkType = this.getContentMarkType(index < this.content.length - 1 ? this.content[index + 1] : undefined);
        if (this.isHeader(lastMark) || this.isHeader(nextMark) || this.isAnnotation(lastMark) || lastMark == MarkType.Paragraph) {
          lastParseContent = currentParseContent;
          lastMark = this.getContentMarkType(lastParseContent);
          continue;
        }

        combine += currentParseContent.openingTag.replace(/#id#/g, `WS`) + currentParseContent.content + currentParseContent.closingTag;
      }

      // 遇到段落，需要考虑是否是新段落，还是延续之前的段落。
      // 判断的标准是，上一个 Mark 是否是注释，以及第一个 Mark 是否是段落。
      else if (currentMark == MarkType.Paragraph) {
        // 回滚
        let lastMarkType = this.getContentMarkType(stackClosingTags.length > 0 ? stackClosingTags[stackClosingTags.length - 1] : undefined);
        let lastMarkLevel = stackClosingTags.length > 0 ? stackClosingTags[stackClosingTags.length - 1].level : 0;
        let firstMarkType = this.getContentMarkType(stackClosingTags[0]);
        // 延续之前的段落
        if ((lastMarkType == MarkType.AnnotationHeader || lastMarkType == MarkType.Annotation) && lastMarkLevel > 0 && firstMarkType == MarkType.Paragraph) {
          rollbackStackClosingTags(1);

          combine += currentParseContent.content;
        }
        // 新段落
        else {
          rollbackStackClosingTags();

          combine += currentParseContent.openingTag.replace(/#id#/g, `${this.getLineCount()}`) + currentParseContent.content;
          stackClosingTags.push(currentParseContent);
        }
      }

      // 注释头
      // 遇到文内注释头，需要考虑多重文内注释嵌套的问题，需要回滚到和当前文内注释level一致的最近的一个文内注释内容的尾部标签
      // 正文句子。
      //     !!! 注释者1,注释方式1 （rollback point）
      //     ::: 注释内容1
      //         !!! 注释者,注释方式
      //         ::: 注释内容
      //     !!! 注释者2,注释方式2 （current）
      //     ::: 注释内容2
      else if (currentMark == MarkType.AnnotationHeader) {
        // 回滚
        let lastMarkType = this.getContentMarkType(stackClosingTags.length > 0 ? stackClosingTags[stackClosingTags.length - 1] : undefined);
        let lastMarkLevel = stackClosingTags.length > 0 ? stackClosingTags[stackClosingTags.length - 1].level : 0;

        // 如果level是增加的，文内注释
        if (currentParseContent.level > lastMarkLevel) {
          //pass;
        }
        // 如果level是一致的，同级别注释，但是分开的注释内容，
        // 需要回滚到同级别注释上一个注释头。
        // 如果level是下降的，也需要回滚到同级别注释上一个注释头。
        else if (currentParseContent.level <= lastMarkLevel) {
          if (lastMarkType == MarkType.AnnotationHeader || lastMarkType == MarkType.Annotation) {
            let count: number = stackClosingTags.length;
            for (let i = count - 1; i >= 0; i--) {
              let lastMarkType = stackClosingTags[stackClosingTags.length - 1].mark;
              let lastMarkLevel = stackClosingTags[stackClosingTags.length - 1].level;

              if (lastMarkLevel == currentParseContent.level && lastMarkType == MarkType.AnnotationHeader) {
                combine += stackClosingTags.pop()?.closingTag;
                break;
              } else {
                combine += stackClosingTags.pop()?.closingTag;
              }
            }
          } else {
            console.debug(`line: ${index}, current: ${currentMark},${currentParseContent.level}, last: ${lastMarkType},${lastMarkLevel}.`);
            rollbackStackClosingTags();
          }
        }

        combine += currentParseContent.openingTag + currentParseContent.content;
        stackClosingTags.push(currentParseContent);
      } else if (currentMark == MarkType.Annotation) {
        // 回滚
        let lastMarkType = this.getContentMarkType(stackClosingTags.length > 0 ? stackClosingTags[stackClosingTags.length - 1] : undefined);
        let lastMarkLevel = stackClosingTags.length > 0 ? stackClosingTags[stackClosingTags.length - 1].level : 0;

        // 如果level是增加的，文内注释
        if (currentParseContent.level > lastMarkLevel) {
          //pass;
        }
        // 如果level是一致的，同级别注释，但是分开的注释内容，
        // 需要回滚到同级别注释上一个注释头。
        // 如果level是下降的，也需要回滚到同级别注释上一个注释头。
        else if (currentParseContent.level <= lastMarkLevel) {
          if (lastMarkType == MarkType.AnnotationHeader || lastMarkType == MarkType.Annotation) {
            let count: number = stackClosingTags.length;
            for (let i = count - 1; i >= 0; i--) {
              let lastMarkType = stackClosingTags[stackClosingTags.length - 1].mark;
              let lastMarkLevel = stackClosingTags[stackClosingTags.length - 1].level;

              if (lastMarkLevel == currentParseContent.level && (lastMarkType == MarkType.Annotation || lastMarkType == MarkType.AnnotationHeader)) {
                break;
              } else {
                combine += stackClosingTags.pop()?.closingTag;
              }
            }
          } else {
            console.debug(`line: ${index}, current: ${currentMark},${currentParseContent.level}, last: ${lastMarkType},${lastMarkLevel}.`);
            rollbackStackClosingTags();
          }
        }

        combine += currentParseContent.openingTag + currentParseContent.content;
      } else {
        rollbackStackClosingTags();
        combine += currentParseContent.openingTag + currentParseContent.content + currentParseContent.closingTag;
      }

      lastParseContent = currentParseContent;
      lastMark = this.getContentMarkType(lastParseContent);
      //console.debug(`No: ${index}, result: ${combine}`);
    }

    rollbackStackClosingTags();
    return combine;
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
    let htmlParse: HtmlParseDocument = new HtmlParseDocument(content);
    htmlParse.Parse();
    return htmlParse.Get();
  }
}
