import { Book } from "./Book"

// 定义接口来描述searchResult中的对象
export interface SearchResultObject {
  query_target_count: number;
  result_pieces_count: number;
  result_pieces?: Book[];
};

export interface BookChapterItem {
  book_title: string;
  volume_title: string;
  chapter_title: string;
};

// 定义接口来描述searchRangeOptions中的对象
export interface SearchRangeOption {
  value: string;
  label: string;
}

export enum SearchRange {
  book = 'Book',
  content = 'Content',
}