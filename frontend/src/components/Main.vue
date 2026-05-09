<!-- Главный компонент -->

<template>
  <div class="page-container">
    <Header
      app_name="Geneology Tree"
      family_tree_name="test"
    />
    <div class="main-container">
      <div class="loading-page"></div>
      <div class="error-page"></div>
      <div class="main-page"></div>
    </div>
    <Footer></Footer>
  </div>
</template>

<script setup>
import Header from './Header.vue';
import Footer from './Footer.vue';
</script>