import { UUID } from "crypto";

// 注释
export interface Annotation{
  // 注释者
  annotator: string;
  // 注释原始文件的起点
  start: number;
  // 注释原始文件的终点
  end: number;
  // 注释文字
  content?: string[];
}

// 段落
export interface Paragraph{
  // 原文
  content: string;
  // 注释集合
  annotations?: Annotation[];
}

// 章、节
export interface Chapter{
  uuid: UUID;
  // 顺序
  order: number;
  // 章节名
  title: string;
  // 类型
  type?: string;
  // 来源
  source?: string;
  // 段落集合
  paragraphs?: Paragraph[];
  // 搜索片段集合
  _hits?: string[];
  // 搜索片段数量
  _hitCount?: number;
  // 界面显示的状态
  _checkStatus?: boolean;
}

// 卷
export interface Volume {
  uuid: UUID;
  // 卷名
  title: string;
  // 章节集合
  chapters: Chapter[];
  // 章节显示是否收起
  _collapse?: boolean;
}

export interface Author {
  uuid: UUID;
  name: string;
  // 著、撰、编、辑、纂
  type?: string;
  // 所在朝代
  dynasty?: string;
  // 简介
  description?: string;
  // 生卒时间
  life?: string;
}

// 书
export interface Book {
  uuid: UUID;
  // 书名
  title: string;
  // 作者
  authors?: Author[];
  // 来源
  source?: string;
  // 描述
  description?: string;
  // 时间
  date?: Date;
  // 分类
  category?: string;
  // 子类
  subCategory?: string;
  // 卷集合
  volumes: Volume[];
  // 搜索片段数量
  _hitCount?: number;
  // 界面显示的状态
  _checkStatus?: boolean;
}

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