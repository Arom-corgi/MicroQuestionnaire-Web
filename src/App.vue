<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <a class="skip-link" href="#main">跳到主要内容</a>
  <header class="site-header">
    <RouterLink to="/" class="brand" aria-label="微问卷首页">
      <span class="brand-logo"><img src="/logo-96.png" alt="" width="44" height="44" /></span>
      <span class="brand-text">微问卷<span class="brand-web">WEB</span></span>
    </RouterLink>
    <span class="header-note">让每一份想法，都被听见。</span>
    <RouterLink to="/" class="nav-link">打开问卷 <span aria-hidden="true">↗</span></RouterLink>
  </header>
  <main id="main"><RouterView /></main>
  <footer class="site-footer">
    <div class="footer-brand">
      <span class="footer-logo"><img src="/logo-96.png" alt="" width="28" height="28" /></span>
      <span>微问卷 · 为认真回答的你而做</span>
    </div>
    <div class="footer-meta">
      <span>轻松填写，分享真实想法</span>
      <a href="/userPrivacy.html">用户协议</a>
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">鄂ICP备2026061137号-1</a>
    </div>
  </footer>
</template>
