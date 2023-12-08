<template>
  <div v-if="loadingStatus !== LoadingStatus.idle">
    <div v-if="searchResults && searchResults.length > 0" class="results-content-wrapper">
      <div v-for="(result, index) in result_pieces" :key="index" class="result-content-wrapper">
        <div class="result-before"><span>{{ index + 1 }}</span></div>
        <div class="result-wrapper">
          <div>
            <a href="" class="book-content">
              <p v-html="result.content"></p>
            </a>
          </div>
          <div class="book-path">
            <a href="" class="book-title">
              {{ result.book_title }}
            </a>
            <a v-if="result['volume_title'].length > 0" href="" class="book-volume-chapter">
              {{ result.volume_title }}
            </a>
            <span v-if="result['volume_title'].length > 0">&nbsp·&nbsp</span>
            <a href="" class="book-volume-chapter">
              {{ result.chapter_title }}
            </a>
            <div class="book-hit-copy" @click="OnHitCopy(result)">
              <span>
                <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M742.4 76.8H460.8c-84.48 0-153.6 69.12-153.6 153.6h-25.6c-84.48 0-153.6 69.12-153.6 153.6v384c0 84.48 69.12 153.6 153.6 153.6h281.6c84.48 0 153.6-69.12 153.6-153.6h25.6c84.48 0 153.6-69.12 153.6-153.6V230.4c0-84.48-69.12-153.6-153.6-153.6z m-128 691.2c0 28.16-23.04 51.2-51.2 51.2H281.6c-28.16 0-51.2-23.04-51.2-51.2V384c0-28.16 23.04-51.2 51.2-51.2h281.6c28.16 0 51.2 23.04 51.2 51.2v384z m179.2-153.6c0 28.16-23.04 51.2-51.2 51.2h-25.6V384c0-84.48-69.12-153.6-153.6-153.6h-153.6c0-28.16 23.04-51.2 51.2-51.2h281.6c28.16 0 51.2 23.04 51.2 51.2v384z"  /><path d="M512 665.6h-179.2c-28.16 0-51.2 23.04-51.2 51.2s23.04 51.2 51.2 51.2h179.2c28.16 0 51.2-23.04 51.2-51.2s-23.04-51.2-51.2-51.2zM512 512h-179.2c-28.16 0-51.2 23.04-51.2 51.2s23.04 51.2 51.2 51.2h179.2c28.16 0 51.2-23.04 51.2-51.2s-23.04-51.2-51.2-51.2z"  /></svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';
import { useToast } from "vue-toastification";

import LoadingStatus from "../ts/LoadingStatus";
import { Book } from "../ts/Book";

const toast = useToast();

interface Props {
  loadingStatus: LoadingStatus;
  searchResults: Book[];
}
var props = defineProps<Props>();

interface searchResultsPiece {
  book_title: string,
  volume_title: string,
  chapter_title: string,
  content: string
}

const result_pieces = computed<searchResultsPiece[]>(() => {
  var pieces: searchResultsPiece[] = [];

  for (let book of props.searchResults) {
    if (book.checkStatus === undefined || book.checkStatus === false)
      continue;
    for (let volume of book.volumes) {
      for (let chapter of volume.chapters) {
        if (!chapter.hits) continue;

        for (let hit of chapter.hits) {
          pieces.push({
            book_title: book.title,
            volume_title: volume.title,
            chapter_title: chapter.title,
            content: hit
          });
        }
      }
    }
  }

  return pieces;
})

const OnHitCopy = async (result: searchResultsPiece) => {
  try {
    await navigator.clipboard.writeText(result.content);
    toast.success("内容已复制到剪贴板。");
  } catch (err) {
    toast.error(`复制失败！${err}`);
  }
}
</script>

<style scoped>
a {
  text-decoration: none;
}

a:hover {
  color: green;
}

p {
  display: block;
  margin-block-start: 0.5em;
  margin-block-end: 0em;
  margin-inline-start: 0px;
  margin-inline-end: 0px;
  text-align: justify;
}

/* 
v-html指令会导致定义了scoped的css因作用域的问题无法使用，
采用v-deep可以实现css穿透。 
*/
::v-deep mark {
  background: transparent;
  color: blue;
  font-weight: 500;
}

.results-content-wrapper {
  display: flex;
  flex-direction: column;
  min-width: 300px;
  min-height: 200px;
}

.result-content-wrapper {
  display: flex;
  flex: 1 1 auto;
  flex-direction: row;
  margin: 0px 0px 8px 0px;
  font-size: 18px;
  border-radius: 8px;
  background-color: #fefefe;
  border: 1px solid transparent;
  transition: box-shadow 0.3s ease-in-out;
}

.result-content-wrapper:hover {
  border: 1px solid #efefef;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.result-before {
  display: flex;
  justify-content: center;
  align-items: center;
  color: #888888;
  width: 20px;
  padding: 0 3px;
}

.result-wrapper {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  line-height: 22px;
  margin: 8px 20px 0px 8px;
  width: 100%;
}

.book-path {
  align-items: center;
  display: flex;
  margin: 8px 0px;
}

.book-content {
  color: #333333;
  font-size: 18px;
}

.book-title {
  color: #666666;
  font-weight: 500;
  font-size: 13px;
  padding: 0px 4px 0px 0px;
}

.book-volume-chapter {
  color: #888888;
  font-weight: 400;
  font-size: 13px;
}
.book-hit-copy {
  width: 22px;
  height: 22px;
  margin-left: auto;
  fill: #aaa;
  cursor: pointer;
}
.book-hit-copy:hover {
  fill: red;
}
</style>