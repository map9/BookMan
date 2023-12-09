<template>
  <div ref="searchBarContainer" class="full-container"
    :style="(!(searchHistory && searchHistory.length > 0) && isInputFocused || (!isInputFocused && !isListFocused)) ? 'border-radius: 22px;' : 'border-radius: 22px 22px 0 0;'">
    <div class="searchbar-container">
      <el-icon class="listitem-icon">
        <Search />
      </el-icon>
      <div class="input-container">
        <input ref="searchInput" v-model="searchString" class="searchbar" type="text" title="Input search string"
          @keydown.enter="OnSearch" @focus="OnInputFocus" @blur="OnInputBlur">
        <span class="clear-icon" :style="clearIconStyle" @click="clear" title="Clear input string">&#x2715;</span>
      </div>
      <el-icon class="voice-icon">
        <Camera />
      </el-icon>
    </div>
  </div>
  <div :style="{ width: searchHistoryContainerWidth + 'px'}"
    v-if="(searchHistory && searchHistory.length > 0 && isInputFocused) || isListFocused" class="search-history-container"
    @mouseenter="OnListMouseEnter" @mouseleave="OnListMouseLeave">
    <div class="divider"></div>
    <ul class="list-container">
      <!-- 这个是一种做法
      <li v-for="(item, index) in searchHistory" :key="index" class="listitem-container">
        <el-icon class="listitem-icon">
          <Search />
        </el-icon>
        <a :href="`/Search?q=${encodeURIComponent(item.searchString)}&range=${encodeURIComponent('BOOK_CONTENT')}`" class="listitem-text">
          <span >{{ item.searchString }}</span>
        </a>
      </li>
      -->
      <li v-for="(item, index) in searchHistory" :key="index" class="listitem-container" @click="OnListClick(item)">
        <el-icon class="listitem-icon">
          <Search />
        </el-icon>
        <span class="listitem-text">{{ item.searchString }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from 'vue-router';
import { useToast } from "vue-toastification";

import { useSearchStore, SearchParamsItem } from "../../stores/SearchStore"
import { SearchRange } from "../ts/BookDefine";

const toast = useToast();

// 定义外部输入的属性
interface Props {
  inSearchString?: string;
  inSearchRange?: SearchRange;
}
var props = withDefaults(defineProps<Props>(), {
  inSearchString: '',
  inSearchRange: SearchRange.content,
});

// 定义时ref外部的属性值，只会在初始化时，copy一份属性值。
// 并不会因为外部属性值变化，而影响本地的变量。
const searchString = ref<string>(props.inSearchString);
const searchRange = ref<SearchRange>(props.inSearchRange);

// 外部属性值变化，需要通过watch，才能改变本地变量，否则，本地变量不会发生改变。
watch(() => props.inSearchString, (newValue) => {
  if (newValue !== undefined) {
    searchString.value = newValue as string;
    console.log("SearchBar, inSearchString: " + props.inSearchString + ".");
  }
});
watch(() => props.inSearchRange, (newValue) => {
  if (newValue !== undefined) {
    searchRange.value = newValue as SearchRange;
    console.log("SearchBar, inSearchRange: " + props.inSearchRange + ".");
  }
});

const clearIconStyle = computed(() => {
  if (searchString.value.length > 0)
    return { display: 'block' };
  else
    return { display: 'none' };
})
const searchInput = ref<any>(null);
const clear = () => {
  searchString.value = '';
  searchInput.value.focus();
}

// 保持searchHistoryContainer和searchBarContainer宽度一致
const searchBarContainer = ref();
const searchHistoryContainerWidth = ref<number>();
onMounted(() => {
  if (searchBarContainer && searchBarContainer.value) {
    searchHistoryContainerWidth.value = searchBarContainer.value.offsetWidth;
    //console.log(`${searchBarContainer.value.offsetWidth}`);
  }
  /* 通过searchString和searchRange定义时解决了。
  if(props.inSearchString)
    searchString.value = props.inSearchString;
  if(props.inSearchRange)
    searchRange.value = props.inSearchRange;
  */
  window.addEventListener('resize', onSize);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', onSize);
});
const onSize = () => {
  if (searchBarContainer && searchBarContainer.value) {
    searchHistoryContainerWidth.value = searchBarContainer.value.offsetWidth;
    //console.log(`${searchBarContainer.value.offsetWidth}`);
  }
};

const store = useSearchStore()
const searchHistory = ref<SearchParamsItem[]>(store.searchHistory);

const OnSearch = (e: KeyboardEvent) => {
  // 避免中文输入法的Enter作为Input回车输入。
  // 中文输入法转发的回车输入，键值为229，正常的输入回车，键值为13。
  if (e.keyCode == 229) {
    return;
  }
  DoSearch();
};

const DoSearch = () => {
  var ret = search(searchString.value, searchRange.value);
  if(ret === true){
    store.addSearchText(searchString.value, searchRange.value);
    searchInput.value.blur();
  }
};

// 如果子组件是使用Composition API（例如通过setup函数）定义的，那么它的方法不会自动暴露给外部。
// 在这种情况下，你需要使用defineExpose或者返回一个公开的方法对象。
// 如果不调用这个方法，父组件是无法访问到子组件的方法。
defineExpose({ DoSearch });

const OnListClick = (item: SearchParamsItem) => {
  search(item.searchString, item.searchRange);
  isListFocused.value = false;
  searchInput.value.blur();
};

const router = useRouter();
const search = (q: string, range: SearchRange) : boolean => {
  console.log("SearchBar, q: " + q + ", range: " + range);
  if(q.length === 0){
    toast.error(`请输入搜索关键字。`);
    return false;
  }
  searchString.value = q;
  searchRange.value = range;
  const params: Record<string, string> = { q: q };
  if (range === SearchRange.content){
    router.push({ path: '/Search', query: params });
  }
  else{
    router.push({ path: '/Library', query: params });
  }
  return true;
}

const isInputFocused = ref<boolean>(false)
const OnInputFocus = () => {
  isInputFocused.value = true;
  console.log("isInputFocused, true");
};

const OnInputBlur = () => {
  isInputFocused.value = false;
  console.log("isInputFocused, false");
};

const isListFocused = ref<boolean>(false)
const OnListMouseEnter = () => {
  isListFocused.value = true;
  console.log("isListFocused, true");
};

const OnListMouseLeave = () => {
  isListFocused.value = false;
  console.log("isListFocused, false");
};
</script>

<style scoped>
.full-container {
  margin: 0 auto;
  align-items: center;
  min-width: 200px;
  height: auto;
  min-height: 44px;
  background: var(--background);
  border: 1px solid var(--surface-gray-50);
  border-radius: 22px;
}

.full-container:hover {
  border: 1px solid transparent;
  box-shadow: 0 4px 24px var(--shadow-16);
  border-color: var(--border-black-8);
}

.full-container:focus-within {
  border: 1px solid transparent;
  box-shadow: 0 2px 8px 1px var(--shadow-16);
}

.searchbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 auto;
  width: auto;
  border: none;
}

.searchbar {
  display: flex;
  flex-wrap: wrap;
  flex: 1;
  height: 40px;
  width: 100%;
  font-size: 16px;
  outline: none;
  border: none;
  color: var(--surface-gray-900);
  background-color: var(--background);
}

.input-container {
  position: relative;
  display: inline-block;
  flex-grow: 1;
}

.clear-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--surface-gray-500);
  cursor: pointer;
}

.clear-icon:hover {
  color: var(--primary-red-500);
}

.voice-icon {
  flex-shrink: 0;
  /* 防止图标在容器空间不足时缩小 */
  margin-right: 15px;
  width: 42px;
  height: 24px;
  font-size: 22px;
  color: var(--primary-red-500);
  cursor: pointer;
}

.search-history-container {
  position: absolute;
  margin: 0 auto;
  height: auto;
  min-width: 200px;
  min-height: 44px;
  align-items: center;
  overflow: hidden;
  background: var(--background);
  border-radius: 0 0 22px 22px;
  box-shadow: 0 9px 8px -3px var(--shadow-16), 8px 0 8px -7px var(--shadow-16), -8px 0 8px -7px var(--shadow-16);
  border: 0;
  z-index: 9999;
}

.divider {
  border-top: 1px solid var(--border-black-8);
  margin: 0 14px;
  padding-bottom: 4px;
}

ul {
  display: block;
  list-style-type: disc;
  margin-block-start: 0em;
  margin-block-end: 0em;
  padding-inline-start: 0px;
}

.list-container {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: auto;
  max-height: 600px;
  font-size: 14px;
  border: none;
  margin-bottom: 15px;
  cursor: default;
  z-index: 9998;
}

.listitem-container {
  display: flex;
  align-items: center;
  /* 这将确保所有子元素包括文本垂直居中 */
  justify-content: space-between;
  padding: 4px 0;
  color: var(--surface-gray-900);
}

.listitem-container:hover {
  color: var(--primary-red-500);
  background-color: var(--primary-red-50);
}

.listitem-icon {
  flex-shrink: 0;
  /* 防止图标在容器空间不足时缩小 */
  width: 42px;
  height: 24px;
  color: var(--surface-gray-500);
}

.listitem-text {
  display: flex;
  /* 使用flex布局 */
  align-items: center;
  /* 这将确保文本自身也垂直居中 */
  flex-grow: 1;
  margin: 0 0px;
  text-align: center;
  /* 文本和图标之间的间距 */
  color: currentColor;
}
</style>
