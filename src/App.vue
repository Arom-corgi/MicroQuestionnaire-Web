<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <a class="skip-link" href="#main">跳到主要内容</a>
  <header class="site-header">
    <RouterLink to="/" class="brand" aria-label="微问卷首页"><span class="brand-mark" aria-hidden="true">微</span><span>微问卷<span class="brand-web">WEB</span></span></RouterLink>
    <span class="header-note">让每一份想法，都被听见。</span>
    <RouterLink to="/" class="nav-link">打开问卷 <span aria-hidden="true">↗</span></RouterLink>
  </header>
  <main id="main"><RouterView /></main>
  <footer class="site-footer"><span>微问卷 · 为认真回答的你而做</span><span>轻松填写，分享真实想法</span></footer>
</template>
