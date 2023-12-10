<template>
  <head-bar :inHeadType="HeadType.reader" :in-search-string="searchString" :in-search-range="searchRange" />

  <div id="center" ref="centerDiv">
    <book-brief v-if="chapterIndex==undefined" :in-book="bookCatalogue" />
    <book-catalogue v-if="chapterIndex==undefined" :in-book="bookCatalogue" />
    <book-reader v-if="chapterIndex!==undefined"  @notify:chapter="OnReaderChapter" @notify:catalogue="OnReaderCatalogue"
    :in-book="bookCatalogue" :in-book-string="searchString" :in-volume-index="volumeIndex" :in-chapter-index="chapterIndex"
    :inIsPageMode="currentThemeParameters.isPageMode"/>
  </div>
  <div id="toolbar" v-if="chapterIndex!==undefined" :style="{top: position.top+'px', left: position.left+position.width+'px'}">
    <toolbar @notify="OnToolbar" :is-night-mode="isNightMode"/>
  </div>
  <div id="settingpanel" v-if="showSetting" :style="{top: position.top+'px', right: position.right+'px'}">
    <SettingsPanel @close="OnSettingPanelClose" @update="OnSettingPanelUpdate"
    :in-theme-parameters="currentThemeParameters" :isClosed="!showSetting"/>
  </div>
  <div id="catalogue" v-if="showCatalogue" :style="{left: position.left+'px', top: position.top+'px', right: position.right+'px', height: position.height+'px'}">
    <book-catalogue @close="OnCatalogueClose" :in-book="bookCatalogue" :isDialog="true"/>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { themeParameters, ThemeHelper} from './ts/ThemeHelper';

import HeadBar from "./HeadBar.vue";
import BookBrief from './Books/BookBrief.vue';
import BookCatalogue from './Books/BookCatalogue.vue';
import BookReader from './Books/BookReader.vue';
import Toolbar from './Helper/Toolbar.vue';
import SettingsPanel from './Helper/SettingsPanel.vue';

import LoadingStatus from "./ts/LoadingStatus";
import { Book, SearchRange } from "./ts/BookDefine";
import { getStringParam } from "./ts/Helper"
import HeadType from './ts/HeadType';
import { getBookCatalogue } from './ts/BookHelper';

const route = useRoute();
const router = useRouter();

const centerDiv = ref<HTMLElement | null>(null);

// 定义外部输入的属性
interface Props {
  inSearchString?: string;
  inVolumeIndex?: number;
  inChapterIndex?: number;
}
var props = withDefaults(defineProps<Props>(), {
  inSearchString: undefined,
  inVolumeIndex: undefined,
  inChapterIndex: undefined,
});

// 使用 ref 创建本地响应式状态
const searchString = ref<string | undefined>(props.inSearchString);
const searchRange = ref<SearchRange>(SearchRange.book);
const volumeIndex = ref<number | undefined>(props.inVolumeIndex);
const chapterIndex = ref<number | undefined>(props.inChapterIndex);

const bookCatalogue = ref<Book | null>(null);

const loadingStatus = ref(LoadingStatus.idle);

// This section for Theme operator.
const themeHelper = new ThemeHelper();
const currentThemeParameters = ref<themeParameters>({
  currentTheme: 0,
  currentSurfaceFont: 0,
  currentFontSize: 18,
  currentPageSize: 1,
  isPageMode: true,
});
var lastDayId = 0;
const isNightMode = computed<boolean>(() => {
  return themeHelper.isNightTheme(currentThemeParameters.value.currentTheme)
});
const showSetting = ref<boolean>(false);
const showCatalogue = ref<boolean>(false);

// This section for get component position for change settingpanel and toolbar component position. 
const position = ref<{ left: number, top:number, width:number, height:number, right:number }>({top: 0, left: 0, width: 0, height: 0, right: 0});
const updateSize = () => {
  if (centerDiv.value) {
    const computedStyle = window.getComputedStyle(centerDiv.value);
    position.value.top = centerDiv.value.offsetTop;
    position.value.left = centerDiv.value.offsetLeft;
    position.value.width = centerDiv.value.offsetWidth + parseFloat(computedStyle.marginRight);
    position.value.height = window.innerHeight - position.value.top;
    position.value.right = window.innerWidth - (centerDiv.value.offsetLeft + centerDiv.value.offsetWidth);
    //console.debug(`${positionXY.value.left}, ${computedStyle.marginRight}`);
  }
};

const DoSearch = (q: string) => {
  getBookCatalogue(q, (d) => {
    bookCatalogue.value = d;
    searchString.value = q;
    if (searchString.value.length > 0) {
      document.title = searchString.value + ' - 开卷 阅读';
    }else{
      document.title = '开卷 阅读';
    }
  });
}

// watch监听路由变化，当router采用createWebHistory模式时，即使URL已经发生变化，watch函数不会被调用。
watch(() => route.query.q, (newValue) => {
  if (newValue !== undefined) {
    var q = newValue as string;
    DoSearch(q);
  }
});

watch(() => route.query.vno, (newValue) => {
  if (newValue !== undefined) {
    volumeIndex.value = parseInt(newValue as string);
  }else{
    volumeIndex.value = undefined;
  }
});

watch(() => route.query.cno, async (newValue) => {
  if (newValue !== undefined) {
    chapterIndex.value = parseInt(newValue as string);
  }else{
    chapterIndex.value = undefined;
    await nextTick();
    //centerDiv.value?.scrollIntoView({ behavior: 'smooth' });
    document.documentElement.scrollIntoView({ behavior: 'smooth' });
  }
});

// 初始化时，导入路由跳转传递的参数
// 由于路由跳转时，组件可能未被渲染，因此，采用异步方式来接收参数
onMounted(async () => {
  updateSize(); // 初始尺寸设置
  window.addEventListener('resize', updateSize); // 监听窗口尺寸变化

  await nextTick();
  var q = getStringParam(route, 'q');
  if(q){
    DoSearch(q);
  }
  q = getStringParam(route, 'vno');
  if(q){
    volumeIndex.value = parseInt(q as string);
  }
  q = getStringParam(route, 'cno');
  if(q){
    chapterIndex.value = parseInt(q as string);
  }
});

onUnmounted(()=>{
  window.removeEventListener('resize', updateSize); // 清理监听器
});

// ReadChapter component chapter change message
const OnReaderChapter = (chapterNum: number) => {

}

// ReadChapter catalogue message
const OnReaderCatalogue = () => {
  showCatalogue.value = true;
}

const OnToolbar = (event:string) => {
  if(event === 'brief'){
    console.debug(`searchString: ${searchString.value}.`);
    const params: Record<string, string> = { q: searchString.value };
    router.push({ path: '/Reader', query: params });
  }else if(event === 'catalogue'){
    showCatalogue.value = !showCatalogue.value;
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
    
  }else{
  }
}

const OnCatalogueClose = () => {
  showCatalogue.value = false;
}

</script>

<style scoped>
#center {
  position: relative;
  flex-grow: 1;
  justify-content: center;
  margin: auto 10px;
  z-index: 3;
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

#catalogue {
  position: fixed;
  top: 0px;
  left: 0px;
  z-index: 3;
}
</style>
