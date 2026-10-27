import { ref } from 'vue'
import { apiClient } from '../services/appContext'

export function useLoginViewModel(onSuccess: () => void) {
  const email = ref('')
  const password = ref('')
  const busy = ref(false)
  const error = ref('')
  async function login(): Promise<void> {
    if (busy.value) return
    if (!email.value.trim() || !password.value) { error.value = '请输入邮箱和密码'; return }
    busy.value = true
    error.value = ''
    try { await apiClient.login(email.value.trim(), password.value); password.value = ''; onSuccess() }
    catch (cause) { error.value = cause instanceof Error ? cause.message : '登录失败，请重试' }
    finally { busy.value = false }
  }
  return { email, password, busy, error, login }
}
