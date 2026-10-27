import { computed, nextTick, onScopeDispose, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { createQuestionnaireViewModel } from './questionnaireViewModel'
import { apiClient, draftStore, siteOrigin, surveyService } from '../services/appContext'
import { DemoSurveyService, demoSurvey } from '../fixtures/demoSurvey'

export function useSurveyPageViewModel() {
  const route = useRoute()
  const isDemo = computed(() => route.name === 'demo')
  const gateway = { load: (id: string) => isDemo.value ? new DemoSurveyService().load() : surveyService.load(id),
    submit: (id: string, answers: Parameters<typeof surveyService.submit>[1]) => isDemo.value
      ? new DemoSurveyService().submit() : surveyService.submit(id, answers) }
  const vm = createQuestionnaireViewModel(gateway, draftStore, () => isDemo.value ? 'demo' : apiClient.identity)
  const id = computed(() => isDemo.value ? demoSurvey.id : String(route.params.id ?? ''))
  const copyMessage = ref('')
  const confirmClear = ref(false)
  const shareUrl = computed(() => isDemo.value ? `${siteOrigin}/demo` : `${siteOrigin}/s/${id.value}`)
  const reload = () => vm.load(id.value)
  watch([id, isDemo], () => { copyMessage.value = ''; confirmClear.value = false; void reload() }, { immediate: true })
  watch(() => vm.survey.value?.title, title => { document.title = title ? `${title} · 微问卷` : '填写问卷 · 微问卷' })
  onScopeDispose(vm.dispose)
  async function submit(): Promise<void> {
    const invalid = await vm.submit()
    await nextTick()
    if (invalid) document.getElementById(`question-${invalid}`)?.focus({ preventScroll: false })
    else if (vm.receipt.value) { window.scrollTo({ top: 0, behavior: 'smooth' }); document.getElementById('result-title')?.focus() }
  }
  async function copyLink(): Promise<void> {
    try { await navigator.clipboard.writeText(shareUrl.value); copyMessage.value = '链接已复制' }
    catch { copyMessage.value = '复制未完成，请复制地址栏中的链接' }
  }
  function clearDraft(): void { vm.clearDraft(); confirmClear.value = false }
  return { ...vm, id, isDemo, copyMessage, confirmClear, shareUrl, reload,
    submit, copyLink, clearDraft }
}
