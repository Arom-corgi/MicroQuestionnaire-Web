<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useHomeViewModel } from '../viewmodels/homeViewModel'
const { link, error, openSurvey } = useHomeViewModel()
</script>

<template>
  <section class="home-layout">
    <div class="home-intro">
      <span class="eyebrow"><span class="status-dot"></span> 微小的声音，也有回响</span>
      <h1>一份问卷，<br>听见你的<span class="accent">想法。</span></h1>
      <p class="intro-copy">课堂里的反馈，社团里的期待，生活里的小建议。<br class="desktop-only">打开分享链接，在这里留下你的答案。</p>
      <div class="home-points"><span>↗ 无需安装</span><span>◷ 随时继续</span><span>✓ 轻松填写</span></div>
      <div class="paper-art" aria-hidden="true"><span class="art-caption">EVERY ANSWER MATTERS</span><div class="art-paper"><span class="art-line short"></span><span class="art-line"></span><div class="art-option">○ &nbsp; 一个新想法</div><div class="art-option chosen">✓ &nbsp; 值得被听见</div></div><span class="art-star">✳</span><span class="art-note">从一个回答开始</span></div>
    </div>
    <div class="home-entry">
      <form class="paper entry-card" @submit.prevent="openSurvey">
        <span class="card-index">01 / 打开一份问卷</span><h2>收到问卷邀请了？</h2><p class="muted">粘贴分享链接，马上开始填写。</p>
        <label class="field-label" for="survey-link">问卷链接或 ID</label>
        <textarea id="survey-link" v-model="link" rows="3" placeholder="https://www.kiandfn.cn/s/…" :aria-invalid="!!error" aria-describedby="link-error" spellcheck="false" />
        <p v-if="error" id="link-error" class="field-error" role="alert">{{ error }}</p>
        <button class="button primary full" type="submit">打开问卷 <span aria-hidden="true">→</span></button>
        <p class="small muted">支持从微问卷 App 分享的 HTTPS 链接。</p>
      </form>
      <RouterLink class="demo-card" to="/demo"><span class="demo-icon" aria-hidden="true">✎</span><span><strong>先看看填写体验</strong><small>一份关于校园生活的示例问卷</small></span><span aria-hidden="true">↗</span></RouterLink>
      <p class="entry-note">如果没有链接，请联系问卷发布者获取。</p>
    </div>
  </section>
</template>
