<template>
  <div class="container">
    <div class="row-container">
      <div class="markdown-container">
        <textarea class="markdown" v-model="markdownText" @input="OnTextChange"></textarea>
      </div>
      <div class="html-container">
        <div class="control">
          <a href="#" >html</a>
          <a href="#" >text</a>
          <a href="#" >debug</a>
        </div>
        <div class="html" v-html="htmlText"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";

import { BookMarkdownDocument } from '../ts/BookMarkdownParser'

const markdownText = ref<string>('');
const htmlText = ref<string>('');

/* var markdownChange: Markdown = new Markdown; */
var markdownChange: BookMarkdownDocument = new BookMarkdownDocument();

const RenderHtmlContent = () => {
  if (markdownText.value.length) {
    htmlText.value = markdownChange.ToHtml(markdownText.value);
    //console.debug(htmlText.value);
  } else {
    htmlText.value = "<p></p>";
  }
}

const OnTextChange = () => {
  RenderHtmlContent();
}

onMounted(async () => {
  await nextTick();

});
</script>

<style>
@import '../css/Book.css';
</style>

<style scoped>

.container{
  display: block;
  width: 100%;
  height: 100%;
  padding: 25px 15px 25px 15px;
  margin-right: auto;
  margin-left: auto;
  font-size: 14px;/*var(--reader-font-size);*/
  font-family: var(--annotation-font-family);
  text-align: justify;
  box-sizing: border-box;
}
.row-container{
  display: block;
  height: 100%;
  box-sizing: border-box;
}

.markdown-container{
  float: left;
  position: relative;
  width: 50%;
  height: 100%;
  min-height: 1px;
  padding: 0 15px;
  box-sizing: border-box;
}

.html-container {
  float: left;
  position: relative;
  width: 50%;
  height: 100%;
  min-height: 1px;
  padding: 0 15px;
  box-sizing: border-box;
}

.markdown {
  width: 100%;
  height: 100%;
  padding: 2px;
  border: 1px solid black;
  box-sizing: border-box;
}

textarea {
  margin: 0;
  font: inherit;
  font-family: inherit;
  color: inherit;
  line-height: inherit;
  writing-mode: horizontal-tb;
  overflow: auto;
  box-sizing: border-box;
}

.html {
  height: 100%;
  padding: 2px 20px 2px 30px;
  font-family: var(--annotation-font-family);
  font-size: inherit;
  overflow: auto;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid transparent;
  box-shadow: 0 4px 24px var(--shadow-16);
  color: var(--surface-gray-900);
  background-color: var(--background);
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAQAAABLCVATAAAAAXNSR0IArs4c6QAAAWlJREFUeNqlloFtwzAMBFU0PxF34k5eoUtktBZVnBysixEEUWBD+idpUnrTGXNkhPvt18awXZjKyE5BE5ix8sw6IEQHfKA1kZoMF5ZNnndqy1k2vae+wTAjMBPIp+sY3QJP1JADaXtvFjv4LR1TFKA5GD4suFSQcGEhjPWRn2+zKpRLT0hBwSo3lRerdpScpbMQCgZS2cH4tHQwerJVPIQjUVBH9wFTPOMgxnRwObhWLLkKlpaJA8TnpDxBwEv1r8Uo+ImegDVX4DBXKKWt3mQnZRRMlxZ7vfxDra6j0vD8vKUtKvJ79Pt1X9W6XxZNTvphhYxcGEjneWncGVH3pM2kAs6Qlq4XDIus4x2qDKieYEsz0nTAYd96MelYZEEgElZxnJtEa4mefZpr7hHGsLLmS2uDVgPGEUadgBxwrn3zwRwGhkU2NVqy6fUEbRs1CruoCM5zlPaIIL6/biLs0edft/d7IfjhT9gfL6wnSxDYPyIAAAAASUVORK5CYII=);
}

.control {
  display: block;
  position: absolute;
  right: 20px;
  top: -18px;
  border-radius: 6px 6px 0 0;
  font-size: 12px;
  background-color: #ddd;
  box-sizing: border-box;
}

.control a:first-child {
  padding-left: 30px;
}
.control a:last-child {
  padding-right: 30px;
}

.control a {
  padding: 0 20px;
}

a {
  color: #428bca;
  text-decoration: none;
  background: transparent;
}
</style>
