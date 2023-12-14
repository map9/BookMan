<template>
  <div ref="bookReaderDiv" class="book-reader">
    <div v-for="(chapter, index) in currentBookChapters" class="chapter" :key="index">
      <transition-group name="fade" tag="div" class="chapter-content-container">
        <p class="chapter-title" :key="chapter.vno">{{ chapter.volumeTitle.length? `${chapter.volumeTitle}&nbsp·&nbsp${chapter.chapter.title}` : chapter.chapter.title }}</p>
        <p class="chapter-content" v-for="(paragraph, indexp) in chapter?.chapter.paragraphs"  :key="indexp">&#8195&#8195{{ paragraph.content }}</p>
      </transition-group>
    </div>

    <div v-if="props.inIsPageMode" class="navbar">
      <button class="nav-item" :disabled="currentChapterIndex <= 0" @click="OnPrevChapter">上一章</button>
      <button class="nav-item" @click="OnCatalogue">目录</button>
      <button class="nav-item" :disabled="currentChapterIndex >= bookChapters.length - 1" @click="OnNextChapter">下一章</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, onMounted, onUnmounted, nextTick, computed, watch, defineEmits } from 'vue';
import { useToast } from "vue-toastification";

import { debounce } from 'lodash-es';

import LoadingStatus from "../ts/LoadingStatus";
import { Book, Chapter } from "../ts/BookDefine";
import { getBookCatalogue, getBookChapter } from '../ts/BookHelper';

const toast = useToast();

const bookReaderDiv = ref<HTMLElement | null>(null);

// 定义外部输入的属性
interface Props {
  inBook?: Book | null;
  inBookString?: string;
  inVolumeIndex?: number;
  inChapterIndex?: number;
  inIsPageMode?: boolean,
}
var props = withDefaults(defineProps<Props>(), {
  inBook: undefined,
  inBookString: undefined,
  inVolumeIndex: 0,
  inChapterIndex: 0,
  inIsPageMode: true,
});

const bookObject = ref<Book>();
const currentChapterIndex = ref<number>(0);

const loadingStatus = ref(LoadingStatus.idle);

// 父组件传入参数属于异步调用，因此，需要采用watch来监视传入参数的变化，
// 以便执行操作。
watch(() => props.inBook, (newValue) => {
  if (newValue !== undefined && newValue !== null) {
    bookObject.value = newValue;
    resetBookChapters();
  }
});

watch(() => props.inVolumeIndex, (newValue) => {
  if (newValue !== undefined) {
    var index = no2Order(newValue, props.inChapterIndex);
    loadChapter(index);
  }
});

watch(() => props.inChapterIndex, (newValue) => {
  if (newValue !== undefined) {
    var index = no2Order(props.inVolumeIndex, newValue);
    loadChapter(index);
  }
});

watch(() => props.inIsPageMode, (newValue) => {
  if (newValue !== undefined) {
    if(newValue == false){
      //checkScroll(undefined);
      // 如果用户已经滚动到页面底部（或非常接近底部）
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - (32+15)) {
        if(currentBookChapters.value)
          loadChapter(currentBookChapters.value[currentBookChapters.value.length-1].order + 1);
      }
    }
  }
});

// 初始化时，导入路由跳转传递的参数
// 由于路由跳转时，组件可能未被渲染，因此，采用异步方式来接收参数
onMounted(async () => {
  //window.addEventListener('scroll', checkScroll); // 监听窗口滚动栏变化
  window.addEventListener('scroll', debouncedCheckScroll);

  await nextTick();

  // 参数未传入
  if(props.inBook === undefined){
    if(props.inBookString){
      getBookCatalogue(props.inBookString, (d)=>{
        bookObject.value = d;
        resetBookChapters();
      });
    }
  }else{
    if(props.inBook !== null){
      bookObject.value = props.inBook;
      resetBookChapters();
    }
  }
});

onUnmounted(()=>{
  //window.removeEventListener('scroll', checkScroll); // 清理监听器
  window.removeEventListener('scroll', debouncedCheckScroll);

});

interface BookChapters {
  order: number;
  vno: number;
  cno: number;
  volumeTitle: string;
  chapter: Chapter;
}
const bookChapters = ref<BookChapters[]>([]);
const currentBookChapters = ref<BookChapters[]>([]);

const no2Order = (vno:number, cno:number) => {
  var chapter = bookChapters.value.find((item)=>(item.vno==vno) && (item.cno==cno));
  if(chapter){
    return chapter.order;
  }else{
    //console.debug(`can't find vno=${vno} and cno=${cno} chapter.`);
    return undefined;
  }
}

const resetBookChapters = () => {
  var order:number = 0;
  bookChapters.value = [];
  if(bookObject && bookObject.value){
    if (bookObject.value) {
      for (var [vno, volume] of bookObject.value.volumes.entries()) {
        for(var [cno, chapter] of volume.chapters.entries()){
          bookChapters.value.push({
            order: order,
            vno: vno,
            cno: cno,
            volumeTitle: volume.title,
            chapter: chapter,
          });
          order ++;
        }
      }
    }
  }
  
  var index = no2Order(props.inVolumeIndex, props.inChapterIndex);
  loadChapter(index);
}

const getChapter = (index:number) => {
  var chapter = bookChapters.value.find((item)=>item.order==index);
  if(chapter && (chapter.chapter.paragraphs === undefined || chapter.chapter.paragraphs === null)){
    if(props.inBookString){
        getBookChapter(props.inBookString, undefined, index, (c: Chapter)=>{
        if(chapter) chapter.chapter = c;
      });
    }
  }
  return chapter;
}

const emit = defineEmits([
  'notify:chapter',
  'notify:catalogue',
]);

const loadChapter = (index: number | undefined) => {
  //console.debug(`loadChapter, index: ${index}, props.inIsPageMode: ${props.inIsPageMode}.`);

  if(index === undefined) return;
  if(index < 0){
    toast.info(`前面没有章节了！已经到头了。`);
  }else if(index > bookChapters.value.length - 1){
    toast.info(`后面没有章节了！已经到底了。`);
  }

  if(props.inIsPageMode){
    var chapter = getChapter(index);
    if(chapter){
      currentBookChapters.value = [];
      currentBookChapters.value.push(chapter);

      currentChapterIndex.value = index;
      emit('notify:chapter', index);
      bookReaderDiv.value?.scrollIntoView({ behavior: 'smooth' });
    }
  }else{
    //console.debug(`loadChapter, start: ${currentBookChapters.value[0].order}, end: ${currentBookChapters.value[currentBookChapters.value.length-1].order}.`);

    var chapterIndexFrom = currentBookChapters.value[0].order;
    var chapterIndexTo = currentBookChapters.value[currentBookChapters.value.length-1].order;
    if(index >= chapterIndexFrom && index <= chapterIndexTo) return;

    var chapter = getChapter(index);
    if(chapter){
      if(index == chapterIndexTo + 1){
        currentBookChapters.value.push(chapter);
      }else if(index == chapterIndexFrom - 1){
        currentBookChapters.value.unshift(chapter);
      }else if(index > chapterIndexTo + 1 || index < chapterIndexFrom - 1){
        currentBookChapters.value = [];
        currentBookChapters.value.push(chapter);
      }

      currentChapterIndex.value = index;
      emit('notify:chapter', index);
    }
  }
}

const OnNextChapter = () => {
  loadChapter(currentChapterIndex.value + 1);
};

const OnPrevChapter = () => {
  loadChapter(currentChapterIndex.value - 1);
};

defineExpose({ loadChapter, OnNextChapter, OnPrevChapter });

const checkScroll = (event) => {
  if(props.inIsPageMode == false){
    // 如果用户已经滚动到页面底部（或非常接近底部）
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - (32+15)) {
      if(currentBookChapters.value)
        loadChapter(currentBookChapters.value[currentBookChapters.value.length-1].order + 1);
    }
    // 如果用户已经滚动到页面顶部（或非常接近顶部）
    else if(window.scrollY < 5){
      if(currentBookChapters.value)
        loadChapter(currentBookChapters.value[0].order - 1);
    }
    // console.debug(`window.scrollY: ${window.scrollY}.`);
  }
}

const debouncedCheckScroll = debounce(checkScroll, 200);

const OnCatalogue = () => {
  emit('notify:catalogue');
}
</script>

<style scoped>
button {
  border-radius: 0px;
  outline: none;
  border: none;
  color: inherit;
  background-color: inherit;
}
.book-reader {
  margin: 20px 0;
  padding: 32px;
  min-width: 600px;
  border-radius: 8px;
  border: 1px solid transparent;
  box-shadow: 0 4px 24px var(--shadow-16);
  color: var(--surface-gray-900);
  background-color: var(--background);
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAQAAABLCVATAAAAAXNSR0IArs4c6QAAAWlJREFUeNqlloFtwzAMBFU0PxF34k5eoUtktBZVnBysixEEUWBD+idpUnrTGXNkhPvt18awXZjKyE5BE5ix8sw6IEQHfKA1kZoMF5ZNnndqy1k2vae+wTAjMBPIp+sY3QJP1JADaXtvFjv4LR1TFKA5GD4suFSQcGEhjPWRn2+zKpRLT0hBwSo3lRerdpScpbMQCgZS2cH4tHQwerJVPIQjUVBH9wFTPOMgxnRwObhWLLkKlpaJA8TnpDxBwEv1r8Uo+ImegDVX4DBXKKWt3mQnZRRMlxZ7vfxDra6j0vD8vKUtKvJ79Pt1X9W6XxZNTvphhYxcGEjneWncGVH3pM2kAs6Qlq4XDIus4x2qDKieYEsz0nTAYd96MelYZEEgElZxnJtEa4mefZpr7hHGsLLmS2uDVgPGEUadgBxwrn3zwRwGhkU2NVqy6fUEbRs1CruoCM5zlPaIIL6/biLs0edft/d7IfjhT9gfL6wnSxDYPyIAAAAASUVORK5CYII=);
}
.book-reader .chapter{
  padding: 32px;
}
.book-reader .chapter:not(:first-child){
  padding: 32px 0;
  border-top: 1px solid var(--border-black-8);
}

.chapter .chapter-title {
  text-align: justify;
  line-height: 45px;
  font-size: 28px;
  font-weight: 700;
  font-family: var(--reader-font-family);
  text-shadow: var(--shadow-16) 0 0 1px;
  color: var(--surface-gray-900);
  border: none;
  box-sizing: border-box;
}

.chapter .chapter-content {
  text-align: justify;
  line-height: 1.5;
  font-size: var(--reader-font-size);
  font-family: var(--reader-font-family);
  text-shadow: var(--shadow-16) 0 0 1px;
  color: var(--surface-gray-900);
  border: none;
  box-sizing: border-box;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.navbar {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 28px;

  margin: 30px auto;
  min-width: 300px;

  font-size: 18px;
  line-height: 26px;
  font-weight: 500;

  overflow: hidden;
}

button {
  min-width: 100px;

  border-radius: 8px;
  text-align: center;
  font-size: 16px;
  color: var(--surface-gray-900);
  background-color: var(--surface-gray-50);
}

.navbar .nav-item {
  position: relative;
  flex: 1;

  padding-top: 15px;
  padding-bottom: 15px;
  border-radius: 0px;
}

.navbar .nav-item:hover {
  color: var(--primary-red-500);
  background-color: var(--primary-red-50);
}

.navbar .nav-item:disabled {
  color: var(--surface-gray-500);
  background-color: var(--surface-gray-50);
}

.navbar .nav-item:not(:last-child)::after {
  position: absolute;
  right: 0;
  top: 25%;
  bottom: 25%;
  width: 1px;
  content: '';
  box-sizing: border-box;
  border-right: 1px solid var(--border-black-8);
}

</style>
