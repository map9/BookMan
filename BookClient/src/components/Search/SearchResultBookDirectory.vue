<template>
  <div v-if="isShowSearchResults && searchResults && searchResults.length > 0" class="container">

    <div class="book-title">
      <span v-if="subShowType == ShowType.library">所有书籍</span>
      <div v-if="subShowType == ShowType.library">
        <span class="book-title-detail">共{{currentBookCount}}本，{{currentHitsCount}}个Hits。</span>
      </div>
      <div class="book-title-inner">
        <span v-if="subShowType == ShowType.book && currentBook">{{ currentBook.title }}</span>
        <div v-if="subShowType == ShowType.book && currentBook" class="book-title-icon" @click="OnBookLibraryClick()" >
          <span>
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M315.63 118.583H95.098c-17.6 0-32 14.4-32 32v746.918c0 17.6 14.4 32 32 32H315.63c17.6 0 32-14.4 32-32V150.583c0-17.6-14.4-32-32-32z m-39.133 245.399H134.231c-17.673 0-32-14.327-32-32s14.327-32 32-32h142.266c17.673 0 32 14.327 32 32s-14.327 32-32 32z m0-113.813H134.231c-17.673 0-32-14.327-32-32s14.327-32 32-32h142.266c17.673 0 32 14.327 32 32s-14.327 32-32 32zM571.71 118.583h-149.4c-17.6 0-32 14.4-32 32v746.918c0 17.6 14.4 32 32 32h149.4c17.6 0 32-14.4 32-32V150.583c0-17.6-14.4-32-32-32z m-10.68 245.399H432.99c-17.673 0-32-14.327-32-32s14.327-32 32-32h128.04c17.673 0 32 14.327 32 32s-14.327 32-32 32z m0-113.813H432.99c-17.673 0-32-14.327-32-32s14.327-32 32-32h128.04c17.673 0 32 14.327 32 32s-14.327 32-32 32zM955.119 872.454L819.663 152.356c-3.254-17.297-20.068-28.786-37.364-25.533l-135.388 25.468c-17.297 3.254-28.786 20.067-25.533 37.364l135.456 720.098c3.254 17.297 20.068 28.786 37.364 25.533l135.388-25.468c17.297-3.254 28.787-20.067 25.533-37.364z m-308.92-627.011a32.044 32.044 0 0 1-1.002-7.949c0.005-14.272 9.629-27.279 24.094-30.971l102.455-26.15c17.122-4.372 34.548 5.967 38.92 23.092a32.044 32.044 0 0 1 1.002 7.949c-0.005 14.272-9.629 27.279-24.094 30.971l-102.455 26.15a32.046 32.046 0 0 1-7.938 1.002c-14.276 0-27.288-9.624-30.982-24.094z m169.523 107.219l-102.455 26.151a32.046 32.046 0 0 1-7.938 1.002c-14.276 0-27.289-9.625-30.982-24.094a32.044 32.044 0 0 1-1.002-7.949c0.005-14.272 9.629-27.279 24.094-30.971l102.455-26.151c17.122-4.372 34.548 5.967 38.92 23.092a32.044 32.044 0 0 1 1.002 7.949c-0.005 14.272-9.629 27.279-24.094 30.971z" />
            </svg>
          </span>
        </div>
      </div>
    </div>

    <div v-if="subShowType == ShowType.library" class="book-directory">
      <div v-for="(book, index) in searchResults" :key="index" class="book-chapter">
        <div class="book-chapter-checkbox">
          <input type="checkbox" v-model="book._checkStatus">
        </div>
        <div class="book-chapter-body" @click="OnBookClick(book)">
          <div class="book-chapter-icon">
            <span>
              <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M960 672V96c0-53.02-43-96-96-96H256C149.96 0 64 85.96 64 192v640c0 106.04 85.96 192 192 192h640c35.34 0 64-28.66 64-62.2 0-23.44-13.214-43.04-32-54.2v-162.72c19.6-19.28 32-44.48 32-72.88zM350.2 256h384c19.4 0 33.8 14.4 33.8 32s-14.4 32-32 32H350.2c-15.8 0-30.2-14.4-30.2-32s14.4-32 30.2-32z m0 128h384c19.4 0 33.8 14.4 33.8 32s-14.4 32-32 32H350.2c-15.8 0-30.2-14.4-30.2-32s14.4-32 30.2-32zM832 896H256c-35.34 0-64-28.66-64-64s28.66-64 64-64h576v128z" /></svg>
            </span>
          </div>
          <div class="book-chapter-title-wraper">
            <div class="book-chapter-title">{{ book.title }}</div>
            <div class="book-chapter-detail"><span>{{ calculateBookSummy(book) }}</span></div>
          </div>
          <div class="book-chapter-arrow-wraper">
            <span class="book-chapter-arrow">
              <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="subShowType == ShowType.book && currentBook" class="book-directory">
      <div v-for="(volume, index) in currentBook.volumes" :key="index">
        <div v-if="volume.title.length > 0" class="book-volume">
          <span>{{ volume.title }}</span>
        </div>
        <div v-for="(chapter, index) in volume.chapters" :key="index" class="book-chapter" @click="OnChapterClick(currentBook.title, volume.title, chapter.title)">
          <div class="book-chapter-body">
            <div class="book-chapter-icon">
              <span>
                <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                  <path
                    d="M768 85.333333l-512 0c-47.146667 0-85.333333 38.186667-85.333333 85.333333l0 682.666667c0 47.146667 38.186667 85.333333 85.333333 85.333333l512 0c47.146667 0 85.333333-38.186667 85.333333-85.333333l0-682.666667c0-47.146667-38.186667-85.333333-85.333333-85.333333zM256 170.666667l213.333333 0 0 341.333333-106.666667-64-106.666667 64 0-341.333333z" />
                </svg>
              </span>
            </div>
            <div class="book-chapter-title-wraper">
              <div class="book-chapter-title">{{ chapter.title }}</div>
              <div class="book-chapter-detail"><span>共{{ chapter._hitCount }}个Hits。</span></div>
            </div>
            <!--
            <div class="book-chapter-arrow-wraper">
              <span class="book-chapter-arrow">
                <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
                </svg>
              </span>
            </div>
            -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import LoadingStatus from "../ts/LoadingStatus";
import { Book, BookChapterItem } from "../ts/BookDefine"

// 通过父组件从外部传入的属性数据
interface Props {
  loadingStatus: LoadingStatus;
  searchResults: Book[];
  isShowSearchResults: boolean;
}

var props = withDefaults(defineProps<Props>(), {
  loadingStatus: LoadingStatus.idle,
  searchResults: undefined,
  isShowSearchResults: true
});

enum ShowType {
  library,
  book,
}

const subShowType = ref<ShowType>(ShowType.library);
const currentBook = ref<Book>();
// 计算被选择上的hit数量
const currentHitsCount = computed<number>(()=>{
  var count = 0;
  for(var book of props.searchResults){
    count += (book._hitCount && book._checkStatus && book._checkStatus===true)? book._hitCount : 0;
  }
  return count;
});
// 计算被选择上的book数量
const currentBookCount = computed<number>(()=>{
  var count = 0;
  for(var book of props.searchResults){
    count += (book._checkStatus && book._checkStatus===true)? 1 : 0;
  }
  return count;
});

const calculateBookSummy = (book: Book) => {
  if (!book) return "";

  var volumeCount: number = book.volumes.length;
  var chapterCount: number = 0;

  for( var volume of book.volumes){
    chapterCount += volume.chapters.length;
  }
  if (volumeCount > 1)
    return `共${volumeCount}卷${chapterCount}章，${book._hitCount}个Hits。`;
  else
    return `共${chapterCount}章，${book._hitCount}个Hits。`;
}

const OnBookLibraryClick = () => {
  currentBook.value = undefined;
  subShowType.value = ShowType.library;  
}

const OnBookClick = (book: Book) =>{
  if (!book) return "";

  currentBook.value = book;
  subShowType.value = ShowType.book;
}

// 定义发出的事件及其可能的参数类型
const emit = defineEmits<{
  (event: 'update', data: BookChapterItem): void;
}>();

const OnChapterClick = (book_title: string, volume_title: string, chapter_title: string) => {
  var item: BookChapterItem = {
    book_title: book_title,
    volume_title: volume_title,
    chapter_title: chapter_title
  };

  // 触发名为 'update' 的事件，并传递字符串数据
  emit('update', item);
}

</script>

<style scoped>
.container {
  position: relative;
  margin: 0 auto;
  height: auto;
  width: 320px;
  min-width: 280px;
  overflow: hidden;
  background: var(--background);
  line-height: 1.58em;
  text-align: left;
  font-size: 14px;
  border-radius: 8px;
  border: 1px solid var(--border-black-8);
}

.container:hover{
  box-shadow: 0 4px 24px var(--shadow-16);
}

.book-title {
  padding: 14px 16px;
  font-size: 20px;
  color: var(--surface-gray-900);
}
.book-title-detail {
  font-size: 14px;
  color: var(--surface-gray-500);
  overflow: hidden;
}

.book-title-inner {
  display: flex;
  align-items: center;
}
.book-chapter-checkbox {
  margin: 0 4px;
}
.book-title-icon {
  width: 38px;
  height: 38px;
  margin-left: auto;
  fill: currentColor;
  cursor: pointer;
}

.book-directory {
  max-height: 400px;
  overflow-y: auto;
}

.book-volume {
  padding: 4px 16px;
  font-size: 16px;
  color: var(--surface-gray-500);
  background-color: var(--surface-gray-50);
  border-top: 1px solid var(--border-black-8);
}

.book-chapter {
  display: flex;
  align-items: center;
  padding-left: 16px;
  font-size: 18px;
  color: var(--surface-gray-900);
  border-top: 1px solid var(--border-black-8);
  overflow: hidden;
}

.book-chapter:hover {
  color: var(--primary-red-500);
  background-color: var(--primary-red-50);
}

.book-chapter-body {
  display: flex;
  align-items: center;
  padding: 8px 16px 8px 0px;
  width: 100%;
}

.book-chapter-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  padding: 8px 8px;
  fill: currentColor;
}

.book-chapter-title-wraper {
  padding: 0 10px 0 0;
  min-height: 40px;
  font-size: 14px;
  overflow: hidden;
}

.book-chapter-title {
  font-size: 14px;
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-chapter-detail {
  font-size: 14px;
  color: var(--surface-gray-500);
  overflow: hidden;
}

.book-chapter-arrow-wraper {
  margin-left: auto;
  padding-top: 8px;
  color: var(--surface-gray-500);
}

.book-chapter-arrow {
  display: inline-block;
  position: relative;
  width: 24px;
  height: 24px;
  fill: currentColor;
}
</style>