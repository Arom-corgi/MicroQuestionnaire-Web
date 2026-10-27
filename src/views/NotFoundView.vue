<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="paper state-card not-found-card">
    <span class="state-logo" aria-hidden="true"><img src="/logo-96.png" alt="" width="96" height="96" /></span>
    <span class="eyebrow">404 / LINK NOT FOUND</span>
    <h1>这个链接没有找到问卷</h1>
    <p class="muted">请检查链接是否完整，或联系发布者重新分享。</p>
    <RouterLink class="button primary" to="/">回到首页</RouterLink>
  </section>
</template>
