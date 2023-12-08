<template>
  <head-bar :inHeadType="HeadType.search" :in-search-string="searchString" :in-search-range="searchRange"/>

  <div id="center">
      <search-result-hit :search-target-count="searchResults.query_target_count"
        :result-pieces-count="searchResults.result_pieces_count" />
      <div v-if="searchResults.result_pieces && searchResults.result_pieces.length > 0" class="search-results-container">
        <div class="search-results-content-container">
          <search-result :search-results="searchResults.result_pieces" :loading-status="loadingStatus"/>
          <el-row justify="end" class="inline-row">
            <el-link :underline="false" type="info">
              View more<el-icon class="el-icon--right"><arrow-right /></el-icon>
            </el-link>
          </el-row>
        </div>
        <div class="search-results-book-directory">
          <book-directory :search-results="searchResults.result_pieces" :loading-status="loadingStatus"
            :isShowSearchResults="true" @update="OnBookDirectoryUpdate" />
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, onMounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from "axios";
import { useToast } from "vue-toastification";

import HeadBar from "./HeadBar.vue";
import SearchResult from "./Search/SearchResult.vue";
import SearchResultHit from './Search/SearchResultHit.vue';
import BookDirectory from "./Search/SearchResultBookDirectory.vue";

import LoadingStatus from "./ts/LoadingStatus";
import { SearchResultObject, SearchRange, BookChapterItem } from "./ts/SearchHelper"
import { getStringParam } from "./ts/Helper"
import HeadType from './ts/HeadType';

const route = useRoute();
const toast = useToast();

// 定义外部输入的属性
interface Props {
  inSearchString?: string;
}
var props = withDefaults(defineProps<Props>(), {
  inSearchString: '',
});
// 使用 ref 创建本地响应式状态
const searchString = ref<string>(props.inSearchString);
const searchRange = ref<SearchRange>(SearchRange.content);

const searchResults = ref<SearchResultObject>({
  query_target_count: 0,
  result_pieces_count: 0,
  result_pieces: undefined,
});
const loadingStatus = ref(LoadingStatus.idle);

// 初始化时，导入路由跳转传递的参数
// 由于路由跳转时，组件可能未被渲染，因此，采用异步方式来接收参数
onMounted(async () => {
  await nextTick();

  var q = getStringParam(route, 'q');
  search(q);
});

// watch监听路由变化，当router采用createWebHistory模式时，即使URL已经发生变化，watch函数不会被调用。
watch(() => route.query.q, (newValue) => {
  if (newValue !== undefined) {
    var q = newValue as string;
    search(q);
  }
});

const search = async (q: string|undefined): Promise<void> => {
  if(q === undefined){
    searchString.value = '';
  }else{
    searchString.value = q;
  }
  console.log(`Search, q: ${searchString.value}.`);
  document.title = searchString.value + ' - 开卷 搜索';

  var surround: number = 60;
  loadingStatus.value = LoadingStatus.loading;
  try {
    const response = await axios.get(`/api/book/search?q=${searchString.value}&&surround=${surround}`);
    searchResults.value = response.data;
    loadingStatus.value = LoadingStatus.done;
    if (searchResults.value.result_pieces) {
      for (var book of searchResults.value.result_pieces) {
        book.hitCount = 0;
        book.checkStatus = true;
        for (var volume of book.volumes) {
          for (var chapter of volume.chapters) {
            if (chapter.hits) {
              chapter.hitCount = chapter.hits.length;
              chapter.checkStatus = true;
              book.hitCount += chapter.hitCount;
            }
          }
        }
      }
    }
  } catch (error) {
    loadingStatus.value = LoadingStatus.error;
    toast.error(`搜索书籍内容出现错误:${error}`);
  }
};

const OnBookDirectoryUpdate = (item: BookChapterItem) => {
  console.log("Event received with, book_title: " + item.book_title + ", volume_title: " + item.volume_title + ", chapter_title: " + item.chapter_title + ".");
}

</script>

<style scoped>
#center {
  flex-grow: 1;
  justify-content: center;
  z-index: 3;
  /*display: flex;
  overflow-y: auto;*/
  margin: auto 10px;
}

.search-results-container {
  /*display: flex;
  flex-direction: row;
  width: auto;
  position: relative; */
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  position: relative;
  text-align: left;
  /* margin: 0 20px 0 0; */
}

.search-results-book-directory {
  margin-right: 30px;
  position: sticky;
  /* 固定div原地不动 */
  top: 0px;
  /* 当滚动到距离顶部0px时，不动 */
  height: 400px;
  /* 必须要设置高度，不然不会固定 */
}

.search-results-content-container {
  flex-grow: 1;
  height: auto;
  padding-right: 10px;
}

.inline-row {
  padding-bottom: 20px;
}</style>
