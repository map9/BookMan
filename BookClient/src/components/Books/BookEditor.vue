<template>
  <div class="container">
    <div class="html-container">
      <label class="html" v-html="htmlText" ></label>
    </div>
    <textarea class="markdown" v-model="markdownText" @input="OnTextChange"></textarea>
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
.container {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  width: 100%;
  box-sizing: border-box;
  font-size: var(--reader-font-size);
  text-align: justify;
  overflow: auto;
}

.markdown {
  width: 50%;
  min-height: 100vh;
  margin: 10px 10px;
  padding: 20px 20px;
  font-size: inherit;
  resize: none;
  border: 1px solid black;
  box-sizing: border-box;
}

.html-container {
  width: 50%;
  min-height: 100vh;
  margin: 10px 10px;
  padding: 0px 20px 0px 40px;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid transparent;
  box-shadow: 0 4px 24px var(--shadow-16);
  color: var(--surface-gray-900);
  background-color: var(--background);
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAQAAABLCVATAAAAAXNSR0IArs4c6QAAAWlJREFUeNqlloFtwzAMBFU0PxF34k5eoUtktBZVnBysixEEUWBD+idpUnrTGXNkhPvt18awXZjKyE5BE5ix8sw6IEQHfKA1kZoMF5ZNnndqy1k2vae+wTAjMBPIp+sY3QJP1JADaXtvFjv4LR1TFKA5GD4suFSQcGEhjPWRn2+zKpRLT0hBwSo3lRerdpScpbMQCgZS2cH4tHQwerJVPIQjUVBH9wFTPOMgxnRwObhWLLkKlpaJA8TnpDxBwEv1r8Uo+ImegDVX4DBXKKWt3mQnZRRMlxZ7vfxDra6j0vD8vKUtKvJ79Pt1X9W6XxZNTvphhYxcGEjneWncGVH3pM2kAs6Qlq4XDIus4x2qDKieYEsz0nTAYd96MelYZEEgElZxnJtEa4mefZpr7hHGsLLmS2uDVgPGEUadgBxwrn3zwRwGhkU2NVqy6fUEbRs1CruoCM5zlPaIIL6/biLs0edft/d7IfjhT9gfL6wnSxDYPyIAAAAASUVORK5CYII=);
}

.html {
  margin: 10px 10px 10px 30px;
  width: 100%;
  font-family: var(--annotation-font-family);
  font-size: inherit;
  box-sizing: border-box;
}
</style>
