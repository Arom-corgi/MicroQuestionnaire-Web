<script setup lang="ts">
import { RouterLink } from 'vue-router'
import QuestionCard from '../components/QuestionCard.vue'
import LoginPanel from '../components/LoginPanel.vue'
import { useSurveyPageViewModel } from '../viewmodels/surveyPageViewModel'
const { survey, answers, errors, loading, submitting, error, draftMessage, receipt, questions, answeredCount, progress,
  needsLogin, blockMessage, uncertain, setAnswer, checkSubmission, allowRetry, isDemo, copyMessage,
  confirmClear, reload, submit, copyLink, clearDraft } = useSurveyPageViewModel()
</script>

<template>
  <div class="survey-container">
    <div v-if="isDemo" class="demo-banner"><span>体验模式</span> 这是一份示例问卷，答案不会发送到服务器。</div>
    <section v-if="loading && !survey" class="paper state-card" aria-live="polite" aria-busy="true"><span class="loader"></span><h1>正在打开问卷</h1><p class="muted">马上就好，请稍候。</p></section>
    <LoginPanel v-else-if="needsLogin" @logged-in="reload" />
    <section v-else-if="!survey" class="paper state-card"><span class="state-icon" aria-hidden="true">!</span><h1>暂时无法打开问卷</h1><p class="muted" role="alert">{{ error }}</p><div class="actions"><button class="button primary" @click="reload">重新加载</button><RouterLink class="button secondary" to="/">返回首页</RouterLink></div></section>
    <section v-else-if="receipt" class="paper state-card success-card"><span class="success-icon" aria-hidden="true">✓</span><span class="eyebrow">THANK YOU FOR YOUR VOICE</span><h1 id="result-title" tabindex="-1">{{ isDemo ? '体验完成，感谢参与。' : '已收到，谢谢你的回答。' }}</h1><p class="muted">{{ isDemo ? '本次仅为演示，未产生正式答卷。' : '你的想法，会成为下一次改变的起点。' }}</p><div class="receipt"><small>{{ survey.title }}</small><span>回执编号</span><strong>{{ receipt.receipt_code }}</strong></div><div class="actions"><RouterLink class="button primary" to="/">回到首页</RouterLink><button v-if="isDemo" class="button secondary" @click="reload">再体验一次</button></div></section>
    <section v-else-if="!survey.can_fill" class="paper state-card"><span class="success-icon" aria-hidden="true">✓</span><h1>感谢你的参与</h1><p class="muted">{{ blockMessage }}</p><RouterLink class="button primary" to="/">回到首页</RouterLink></section>
    <div v-else class="survey-layout">
      <aside class="survey-sidebar"><RouterLink to="/" class="back-link">← 返回首页</RouterLink>
        <div class="sidebar-body"><span class="eyebrow">一份邀请 / 一次倾听</span><h2>慢慢想，<br>认真回答。</h2><p class="muted small">你的每一个回答<br>都是有价值的声音。</p>
          <div class="progress-info"><strong>{{ answeredCount }} <span>/ {{ questions.length }}</span></strong><span>已回答</span></div><div class="progress-track" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100" aria-label="问卷填写进度"><span :style="{ width: `${progress}%` }"></span></div><p class="draft-status" aria-live="polite">{{ draftMessage }}</p>
          <div class="sidebar-actions"><button class="text-button" @click="copyLink">复制{{ isDemo ? '体验' : '问卷' }}链接 ↗</button></div><p v-if="copyMessage" class="small muted" role="status">{{ copyMessage }}</p>
        </div>
      </aside>
      <div class="survey-content">
        <section class="paper survey-heading"><div class="tags"><span v-for="tag in survey.tags" :key="tag">{{ tag }}</span><span>{{ survey.require_login || !survey.allow_anonymous ? '登录填写' : '无需登录' }}</span></div><h1>{{ survey.title }}</h1><p class="survey-description">{{ survey.description }}</p><div class="survey-heading-foot"><span>共 {{ questions.length }} 道题 · 标记「必答」的题目请完成</span><span class="tiny-leaf" aria-hidden="true">✳</span></div></section>
        <form novalidate @submit.prevent="submit">
          <QuestionCard v-for="(question, index) in questions" :key="question.id" :question="question" :index="index" :value="answers[question.id]" :error="errors[question.id]" :disabled="submitting || uncertain" @answer="setAnswer(question.id, $event)" />
          <div v-if="error" class="error-notice" role="alert"><p>{{ error }}</p><div v-if="uncertain" class="actions"><button type="button" class="button secondary" :disabled="loading" @click="checkSubmission">{{ loading ? '正在核对…' : '核对提交状态' }}</button><button type="button" class="text-button" :disabled="loading" @click="allowRetry">我已核对，允许重试</button></div></div>
          <div class="submit-area"><p class="small muted">提交后，答案将交给问卷发布者。请确认内容无误。</p><button class="button primary submit-button" :disabled="submitting || uncertain || loading" type="submit">{{ submitting ? '正在提交…' : isDemo ? '完成体验' : '提交问卷' }} <span aria-hidden="true">→</span></button><span class="small muted">感谢你愿意花时间分享。</span></div>
        </form>
        <div class="draft-controls"><p class="small muted">草稿保存在当前浏览器，7 天后过期。使用公共设备时，请在离开前清空草稿。</p><button class="text-button" :disabled="submitting || uncertain" @click="confirmClear = !confirmClear">清空草稿</button><div v-if="confirmClear" class="confirm-clear"><span>将清空这份问卷在当前身份下保存的答案。</span><button class="text-button danger" @click="clearDraft">确认清空</button><button class="text-button" @click="confirmClear = false">取消</button></div></div>
      </div>
    </div>
  </div>
</template>
