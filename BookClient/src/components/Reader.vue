<template>
  <head-bar :inHeadType="HeadType.reader" :in-search-string="searchString" :in-search-range="searchRange" />

  <div id="center">
    <book-brief v-if="currentChapterIndex==0" :in-book="searchResults" />
    <book-catalogue v-if="currentChapterIndex==0" :in-book="searchResults" />
    <book-reader ref="bookReader" @notify:chapter="OnReaderChapter" @notify:catalogue="OnReaderCatalogue"
    :in-book="searchResults" :in-book-string="props.inSearchString" :inIsPageMode="currentThemeParameters.isPageMode"/>
  </div>
  <div id="toolbar" :style="{top: positionXY.top+'px', left: positionXY.left+'px'}">
    <toolbar @notify="OnToolbar" :is-night-mode="isNightMode"/>
  </div>
  <div id="settingpanel" :style="{top: positionXY.top+'px', right: positionXY.right+'px'}">
    <SettingsPanel @close="OnSettingPanelClose" @update="OnSettingPanelUpdate"
    :in-theme-parameters="currentThemeParameters" :isClosed="!showSetting"/>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from "axios";
import { useToast } from "vue-toastification";
import { themeParameters, ThemeHelper} from './ts/ThemeHelper';

import HeadBar from "./HeadBar.vue";
import BookBrief from './Books/BookBrief.vue';
import BookCatalogue from './Books/BookCatalogue.vue';
import BookReader from './Books/BookReader.vue';
import Toolbar from './Helper/Toolbar.vue';
import SettingsPanel from './Helper/SettingsPanel.vue';

import LoadingStatus from "./ts/LoadingStatus";
import { SearchRange } from "./ts/SearchHelper"
import { Book } from "./ts/Book";
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
const searchRange = ref<SearchRange>(SearchRange.book);

const searchResults = ref<Book>();
const loadingStatus = ref(LoadingStatus.idle);

const positionXY = ref<{ top:number, left: number, right:number }>({top: 0, left: 0, right: 0});

const themeHelper = new ThemeHelper();
const currentThemeParameters = ref<themeParameters>({
  currentTheme: 0,
  currentSurfaceFont: 0,
  currentFontSize: 18,
  currentPageSize: 3,
  isPageMode: true,
});
var lastDayId = 0;
const currentChapterIndex = ref<number>(0);
const isNightMode = computed<boolean>(() => {
  return themeHelper.isNightTheme(currentThemeParameters.value.currentTheme)
});
const showSetting = ref<boolean>(false);
const bookReader = ref<any>(null);

const updateSize = () => {
  const centerDiv = document.getElementById('center') as HTMLElement;
  if (centerDiv) {
    const computedStyle = window.getComputedStyle(centerDiv);
    positionXY.value.top = 100;
    positionXY.value.left = centerDiv.offsetLeft + centerDiv.offsetWidth + parseFloat(computedStyle.marginRight);
    positionXY.value.right = window.innerWidth - (centerDiv.offsetLeft + centerDiv.offsetWidth);
    //console.debug(`${positionXY.value.left}, ${computedStyle.marginRight}`);
  }
};

// 初始化时，导入路由跳转传递的参数
// 由于路由跳转时，组件可能未被渲染，因此，采用异步方式来接收参数
onMounted(async () => {
  updateSize(); // 初始尺寸设置
  window.addEventListener('resize', updateSize); // 监听窗口尺寸变化
  window.addEventListener('scroll', checkScroll); // 监听窗口滚动栏变化

  await nextTick();
  var q = getStringParam(route, 'q');
  search(q);
});

onUnmounted(()=>{
  window.removeEventListener('resize', updateSize); // 清理监听器
  window.removeEventListener('scroll', updateSize); // 清理监听器
});

// watch监听路由变化，当router采用createWebHistory模式时，即使URL已经发生变化，watch函数不会被调用。
watch(() => route.query.q, (newValue) => {
  if (newValue !== undefined) {
    var q = newValue as string;
    search(q);
  }
});

const search = async (q: string | undefined): Promise<void> => {
  if (q === undefined) {
    searchString.value = '';
  } else {
    searchString.value = q;
  }
  console.log(`Search, q: ${searchString.value}.`);
  if (searchString.value.length > 0) {
    document.title = searchString.value + ' - 开卷 阅读';
  }

  loadingStatus.value = LoadingStatus.loading;
  try {
    const response = await axios.get(`/api/book/content?q=${searchString.value}`);
    searchResults.value = response.data;
    if (!searchResults.value) {
      toast.error(`找不到书名为:${searchString.value}的书籍。`);
    }
    loadingStatus.value = LoadingStatus.done;
  } catch (error) {
    loadingStatus.value = LoadingStatus.error;
    toast.error(`搜索书籍出现错误:${error}。`);
  }
};

const checkScroll = (event) => {
  if(currentThemeParameters.value.isPageMode == false)
  {
    // 文档的总高度
    const documentHeight = document.documentElement.scrollHeight;
    
    // 视口的高度
    const viewportHeight = window.innerHeight;
    
    // 已经滚动过的高度
    const scrolled = window.scrollY;
    
    // 如果用户已经滚动到页面底部（或非常接近底部）
    if (scrolled + viewportHeight >= documentHeight - 32+15) {
      // 这里可以执行加载更多数据或其他操作
      bookReader.value.gotoChapter();
    } else if(scrolled< 0){
      bookReader.value.gotoChapter(false);
    }
    console.log(`documentHeight: ${documentHeight}, scrolled: ${scrolled}。`);
  }
}

const OnReaderChapter = (chapterNum: number) => {
  currentChapterIndex.value = chapterNum;
}

const OnReaderCatalogue = () => {

}

const OnToolbar = (event:string) => {
  if(event === 'brief'){

  }else if(event === 'catalogue'){
    
  }else if(event === 'theme'){
    if(themeHelper.isNightTheme(currentThemeParameters.value.currentTheme)){
      var id = themeHelper.setTheme(lastDayId);
      if(typeof id === 'number'){
        currentThemeParameters.value.currentTheme = id;
      }
    }else{
      lastDayId = currentThemeParameters.value.currentTheme || 0;
      var id = themeHelper.setNightTheme();
      if(typeof id === 'number'){
        currentThemeParameters.value.currentTheme = id;
      }
    }  
  }else if(event === 'setting'){
    showSetting.value = !showSetting.value;
  }else if(event === 'top'){
    
  }
}

const OnSettingPanelClose = () => {
  showSetting.value = false;
}

const OnSettingPanelUpdate = (event:string, param:any) => {
  if(event === 'pagesize'){
    var pageSize = param as number;
    if(pageSize === 0){
      pageSize = window.innerWidth - 130;
      document.documentElement.style.setProperty('--page-size', `${pageSize}px`);
    }
    updateSize();
  }else if(event === 'readmode'){
    if(currentThemeParameters.value.isPageMode == false)
      checkScroll(null);
      // 当翻页模式发生变化时，应该检查一下是否到了页面的底部。
  }else{
  }
}

</script>

<style scoped>
#center {
  position: relative;
  flex-grow: 1;
  justify-content: center;
  z-index: 3;
  margin: auto 10px;
}

#toolbar {
  position: fixed;
  top: 0px;
  left: 0px;
  z-index: 4;
}

#settingpanel {
  position: fixed;
  top: 0px;
  right: 0px;
  z-index: 4;
}
</style>
