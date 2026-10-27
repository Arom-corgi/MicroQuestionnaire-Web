<script setup lang="ts">
import { useLoginViewModel } from '../viewmodels/loginViewModel'
const emit = defineEmits<{ loggedIn: [] }>()
const { email, password, busy, error, login } = useLoginViewModel(() => emit('loggedIn'))
</script>
<template>
  <form class="paper state-card login-card" @submit.prevent="login"><span class="state-icon" aria-hidden="true">↗</span><h1>登录后，继续填写</h1><p class="muted">这份问卷需要使用微问卷账号登录。</p>
    <label class="field-label" for="email">邮箱</label><input id="email" v-model="email" type="email" autocomplete="username" required :disabled="busy" placeholder="你的账号邮箱">
    <label class="field-label" for="password">密码</label><input id="password" v-model="password" type="password" autocomplete="current-password" required :disabled="busy" placeholder="输入密码">
    <p v-if="error" class="field-error" role="alert">{{ error }}</p><button class="button primary full" :disabled="busy">{{ busy ? '正在登录…' : '登录并继续' }}</button><p class="small muted">使用已有的邮箱账号。注册或找回密码请前往微问卷 App。</p>
  </form>
</template>
