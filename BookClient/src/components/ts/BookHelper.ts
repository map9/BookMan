import axios from "axios";
import { useToast } from "vue-toastification";

import { Book, Chapter, SearchResultObject } from "./BookDefine";

const toast = useToast();

export async function getBookList(q: string | undefined, f: Function | undefined = undefined): Promise<void> {
  var queryString: string = '/api/book/list?';

  if (q && q.length) {
    queryString += `q=${q}`;
  }
  try {
    const response = await axios.get(queryString);
    if(f) f(response.data);
    if (!response.data.result_pieces || response.data.result_pieces && response.data.result_pieces.length == 0) {
      toast.error(`找不到书名为:${q}的书籍。`);
    }
  } catch (error) {
    toast.error(`搜索书籍出现错误:${error}。`);
  }
}

export async function getBookCatalogue(q: string, f: Function | undefined = undefined): Promise<void> {
  if (q && q.length) {
    try {
      var queryString = `/api/book/catalogue?q=${encodeURIComponent(q)}`;
      
      const response = await axios.get(queryString);
      if(f) f(response.data);
    } catch (error) {
      toast.error(`获取书籍目录出现错误: ${error}`);
    }
  } else {
    toast.error(`请提供正确的书籍名称。`);
  }
}

export async function getBookChapter(q: string, vno: number | undefined = undefined, cno: number| undefined = undefined, f: Function | undefined = undefined): Promise<void> {
  if (q && q.length) {
    try {
      let queryString = `/api/book/chapter?q=${encodeURIComponent(q)}`;
      if (vno !== undefined) {
        queryString += `&vno=${vno}`;
      }
      if (cno !== undefined) {
        queryString += `&cno=${cno}`;
      }else{
        queryString += `&cno=0`;
      }

      const response = await axios.get(queryString);
      if(f) f(response.data);
    } catch (error) {
      toast.error(`获取书籍章节内容出现错误: ${error}`);
    }
  } else {
    toast.error(`请提供正确的书籍名称。`);
  }
}