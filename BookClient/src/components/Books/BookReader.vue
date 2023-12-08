<template>
  <div ref="bookReaderDiv" class="book-reader">
    <div v-for="(chapter, index) in currentBookChapters" class="chapter" :key="index">
      <p class="chapter-title">{{ chapter.volumeTitle.length? `${chapter.volumeTitle}&nbsp·&nbsp${chapter.chapter.title}` : chapter.chapter.title }}</p>
      <p class="chapter-content" v-for="paragraph in chapter?.chapter.paragraphs">&#8195&#8195{{ paragraph.content }}</p>
    </div>

    <div v-if="props.inIsPageMode" class="navbar">
      <button class="nav-item" :disabled="currentChapterIndex <= 0" @click="OnPrevChapter">上一章</button>
      <button class="nav-item" @click="OnCatalogue">目录</button>
      <button class="nav-item" :disabled="currentChapterIndex >= bookChapters.length - 1" @click="OnNextChapter">下一章</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, onMounted, nextTick, computed, watch, defineEmits } from 'vue';
import { useRoute } from 'vue-router';
import axios from "axios";
import { useToast } from "vue-toastification";

import LoadingStatus from "../ts/LoadingStatus";
import { Book, Chapter } from "../ts/Book";
import { getStringParam } from "../ts/Helper"

const bookReaderDiv = ref<HTMLElement | null>(null);

const route = useRoute();
const toast = useToast();

// 定义外部输入的属性
interface Props {
  inBook?: Book;
  inBookString?: string;
  inVolumeString?: string;
  inChapterString?: string;
  inIsPageMode?: boolean,
}
var props = withDefaults(defineProps<Props>(), {
  inBook: undefined,
  inBookString: '',
  inVolumeString: '',
  inChapterString: '',
  inIsPageMode: true,
});

const bookObject = ref<Book>();
const bookString = ref<string>(props.inBookString);
const volumeString = ref<string>(props.inVolumeString);
const chapterString = ref<string>(props.inChapterString);

const loadingStatus = ref(LoadingStatus.idle);

watch(() => props.inBook, (newValue) => {
  if (newValue !== undefined) {
    bookObject.value = newValue as Book;
    resetBookChapters();
  }
});

// 初始化时，导入路由跳转传递的参数
// 由于路由跳转时，组件可能未被渲染，因此，采用异步方式来接收参数
onMounted(async () => {
  await nextTick();

  bookObject.value = props.inBook;
  resetBookChapters();

  bookString.value = getStringParam(route, 'q') as string;
  volumeString.value = getStringParam(route, 'v')  as string;
  chapterString.value = getStringParam(route, 'c')  as string;
  //getBookContent(bookString.value, volumeString.value, chapterString.value);
});

interface BookChapters {
  order: number;
  volumeTitle: string;
  chapter: Chapter;
  showed: boolean;
}
const bookChapters = ref<BookChapters[]>([]);
// 默认为书的第一个章节
const currentChapterIndex = ref(0);
const currentBookChapters = ref<BookChapters[]>([]);

const loadChapter = (index:number) => {
  if(props.inIsPageMode){
    var chapter = bookChapters.value.find((item)=>item.order==index);
    if(chapter){
      currentBookChapters.value = [];
      currentBookChapters.value.push(chapter);
    }
  }else{
    var chapterIndexFrom = currentBookChapters.value[0].order;
    var chapterIndexTo = currentBookChapters.value[currentBookChapters.value.length-1].order;

    if(index == chapterIndexTo + 1){
      var chapter = bookChapters.value.find((item)=>item.order==index);
      if(chapter){
        currentBookChapters.value.push(chapter);
      }
    }else if(index == chapterIndexFrom - 1){
      var chapter = bookChapters.value.find((item)=>item.order==index);
      if(chapter){
        currentBookChapters.value.unshift(chapter);
      }
    }else if(index > chapterIndexTo + 1 || index < chapterIndexFrom - 1){
      var chapter = bookChapters.value.find((item)=>item.order==index);
      if(chapter){
        currentBookChapters.value = [];
        currentBookChapters.value.push(chapter);
      }
    }
  }
}

const resetBookChapters = () => {
  var order:number = 0;
  bookChapters.value = [];
  if(bookObject && bookObject.value){
    if (bookObject.value) {
      for (var volume of bookObject.value.volumes) {
        for(var chapter of volume.chapters){
          bookChapters.value.push({
            order: order,
            volumeTitle: volume.title,
            chapter: chapter,
            showed: false
          });
          order ++;
        }
      }
    }
  }
  loadChapter(currentChapterIndex.value);
}

const getBookContent = async (q: string | undefined, v: string | undefined, c: string | undefined): Promise<void> => {
  if (q === undefined) {
    bookString.value = '';
  } else {
    bookString.value = q;
  }
  console.log(`Search, q: ${bookString.value}.`);
  if (bookString.value.length > 0) {
    document.title = bookString.value + ' - 开卷 阅读';
  }

  loadingStatus.value = LoadingStatus.loading;
  try {
    var queryString: string = `/api/book/content?q=${encodeURIComponent(bookString.value)}`;
    if(v !== undefined){
      queryString += `&v=${encodeURIComponent(v)}`;
    }
    if(c !== undefined){
      queryString += `&c=${encodeURIComponent(c)}`;
    }

    const response = await axios.get(queryString);
    bookString.value = response.data;
    if (!bookString.value) {
      toast.error(`找不到书名为:${bookString.value}的书籍。`);
    }
    resetBookChapters();

    loadingStatus.value = LoadingStatus.done;
  } catch (error) {
    loadingStatus.value = LoadingStatus.error;
    toast.error(`搜索书籍出现错误:${error}。`);
  }
};

const gotoChapter = (isNext:boolean = true) => {
  if(isNext){
    if (currentChapterIndex.value < bookChapters.value.length - 1) {
      currentChapterIndex.value++;
    }
  }else{
    if (currentChapterIndex.value > 0) {
      currentChapterIndex.value--;
    }
  }
  loadChapter(currentChapterIndex.value);
  emit('notify:chapter', currentChapterIndex.value);
}

defineExpose({ gotoChapter });

const emit = defineEmits([
  'notify:chapter',
  'notify:catalogue',
]);

const OnNextChapter = () => {
  gotoChapter(true);
  if(props.inIsPageMode){
    bookReaderDiv.value?.scrollIntoView({ behavior: 'smooth' });
  }
};

const OnPrevChapter = () => {
  gotoChapter(true);
  if(props.inIsPageMode){
    bookReaderDiv.value?.scrollIntoView({ behavior: 'smooth' });
  }
};

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
