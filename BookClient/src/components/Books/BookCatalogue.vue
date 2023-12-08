
import { ArrowDownBold } from '@element-plus/icons-vue';

<template>
  <div v-if="props.inBook" class="book-catalogue">
    <div class="catalogue-header">
      <p class="catalogue-header-infos"><span class="catalogue-header-title">目录</span></p>
      <div class="catalogue-header-operate">
        <button class="catalogue-header-oi" @click="OnOrder">
          <i class="icon">
            <svg :style="order? { transform: 'rotate(0deg)' } : { transform: 'rotate(180deg)' }" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M365 663.5v210.7c0 18.6-23.4 26.8-35 12.3L131.2 637.9c-13.3-16.6-1.5-41.1 19.8-41.1h80.7v-400c0-36.8 29.8-66.7 66.7-66.7 36.8 0 66.7 29.8 66.7 66.7v466.7h-0.1z m200-466.7h266.7c36.8 0 66.7 29.8 66.7 66.7s-29.8 66.7-66.7 66.7H565c-36.8 0-66.7-29.8-66.7-66.7 0-36.8 29.9-66.7 66.7-66.7z m0 266.7h200c36.8 0 66.7 29.8 66.7 66.6s-29.8 66.7-66.6 66.7H565c-36.8 0-66.7-29.8-66.7-66.7 0.1-36.8 29.9-66.6 66.7-66.6z m0 266.7h133.3c36.8 0 66.7 29.8 66.7 66.7 0 36.8-29.8 66.7-66.7 66.7H565c-36.8 0-66.7-29.8-66.7-66.7 0.1-36.9 29.9-66.7 66.7-66.7z" /></svg>
          </i>
          <span style="padding-left: 5px">{{ order? '倒序': '正序' }}</span>
        </button>
      </div>
    </div>
    <div class="catalogue-all">
      <div class="catalogue-volume" v-for="(volume, index) in order? props.inBook.volumes : props.inBook.volumes.slice().reverse()" :key="index" @click="OnExpand(volume)">
        <label for="vol97698856">
          <div class="volume-header">
            <h3 class="volume-name">{{ volume.title }}<span v-if="volume.title.length>0" class="dot">·</span>共{{volume.chapters? volume.chapters.length : 0}}章</h3>
            <div class="volume-operate">
              <label class="volume-col" for="vol97698856">
                <i class="icon">
                  <svg :style="(volume._collapse === undefined || volume._collapse === false)? { transform: 'rotate(180deg)' } : { transform: 'rotate(0deg)' }" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M512 685.248L233.376 406.624l45.248-45.248L512 594.752l233.376-233.376 45.248 45.248z" /></svg>
                </i>
              </label>
            </div>
          </div>
        </label>
        <ul v-if="(volume._collapse === undefined || volume._collapse === false) && volume.chapters" class="volume-chapters">
          <li class="chapter-item" v-for="(chapter, indexc) in order? volume.chapters : volume.chapters.slice().reverse()" :key="indexc">
            <router-link :to="{ path: '/Reader', 'query':{q: props.inBook.title, v: volume.title, c: chapter.title}}" class="chapter-name">{{ chapter.title }}</router-link>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Book } from "../ts/Book";

// 定义外部输入的属性
interface Props {
  inBook: Book;
}
var props = withDefaults(defineProps<Props>(), {
  inBook: undefined,
});

const order = ref<boolean>(true);

const OnOrder = ()=>{
  order.value = order.value? false : true;
}

const OnExpand = (volume)=>{
  volume._collapse = (volume._collapse === undefined) || volume._collapse === false? true : false;
} 
</script>

<style scoped>
div {
  display: block;
  margin: 0;
  padding: 0;
}

button {
  border: none;
  outline: none;
}

label {
  cursor: pointer;
}

.book-catalogue {
  width: auto;
  margin: 20px 0;
  padding: 32px 32px 32px 32px;
  outline: 1px solid transparent;
  border-radius: 10px;
  background: var(--background);
  box-shadow: 0 4px 24px var(--shadow-16);
  box-sizing: border-box;
  text-align: left;
}

.book-catalogue .catalogue-header {
  position: sticky;
  /*top: 68px;*/
  padding: 0 32px;
  border-radius: 10px 10px 0 0;
  background-color: var(--background);
  z-index: 3;
}

.book-catalogue .catalogue-header-title {
  color: var(--surface-gray-900);
  font-size: 28px;
  line-height: 32px;
  margin-bottom: 8px;
  margin-top: 8px;
  pointer-events: none;
}

.book-catalogue .catalogue-header-title {
  display: inline-block;
  font-weight: 600;
  vertical-align: top;
}

.book-catalogue .catalogue-header-operate {
  position: absolute;
  right: 16px;
  top: 0;
  bottom: 0;
}

.book-catalogue .catalogue-header-oi {
  display: inline-block;
  color: var(--surface-gray-900);
  background-color: var(--background);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  padding: 10px 10px;
}

.book-catalogue .catalogue-header-oi:hover {
  border-radius: 8px;
  color: var(--primary-red-500);
  background: var(--primary-red-50);
}

.book-catalogue .catalogue-header-oi .icon {
  display: inline-block;
  position: relative;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  font-weight: 400;
  vertical-align: top;
  height: 1em;
  width: 1em;
  line-height: 1em;
  fill: currentColor;
}

.icon svg {
  height: 1em;
  width: 1em;
}

.book-catalogue .catalogue-all {
  padding: 0 16px;
}

.book-catalogue .volume-header {
  position: relative;
  padding: 0 16px;
  margin: 0 0 10px 0;
  border-radius: 8px;
  background: var(--surface-gray-50);
}

.book-catalogue .volume-name {
  padding: 11px 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
  color: var(--surface-gray-900);
}

.book-catalogue .volume-name .dot {
  margin: 0 3px;
}

.book-catalogue .volume-operate {
  position: absolute;
  right: 16px;
  top: 10px;
  font-size: 0;
  z-index: 2;
}

.book-catalogue .volume-col {
  display: inline-block;
  height: 28px;
  padding: 8px;
  margin-left: 8px;
  margin-right: -8px;
  box-sizing: border-box;
  color: var(--surface-gray-900);
}

.book-catalogue .volume-col .icon {
  display: inline-block;
  position: relative;
  justify-content: center;
  align-items: center;
  height: 1em;
  width: 1em;
  padding-left: 10px;
  margin-right: 10px;
  line-height: 1em;
  border-left: 1px solid var(--border-black-8);
  font-size: 14px;
  font-weight: 400;
  vertical-align: top;
  fill: currentColor;
}

.book-catalogue .volume-chapters {
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
  margin-bottom: 20px;
}

.book-catalogue .chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 33.33333%;
  padding: 0 16px;
  border-radius: 8px;
  box-sizing: border-box;
}
.book-catalogue .chapter-item:hover {
  color: var(--primary-red-500);
  background: var(--primary-red-50);
}

.book-catalogue .chapter-name {
  display: block;
  padding: 8px 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  line-height: 22px;
  overflow: hidden;
  color: var(--surface-gray-900);
}

.book-catalogue .chapter-item:hover .chapter-name {
  color: var(--primary-red-500);
}
</style>