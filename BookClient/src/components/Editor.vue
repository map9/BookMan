<template>
  <head-bar :inHeadType="HeadType.search"/>

  <div id="center">
    <BookEditor />
  </div>
</template>

<script setup lang="ts">
import BookEditor from './Books/BookEditor.vue';
import HeadBar from './HeadBar.vue';

import HeadType from './ts/HeadType';

</script>

<style scoped>
#center {
  flex-grow: 1;
  justify-content: center;
  z-index: 3;
  margin: auto 10px;
}

</style>
