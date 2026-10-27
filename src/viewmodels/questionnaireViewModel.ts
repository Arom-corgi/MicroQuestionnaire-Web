import { computed, ref } from 'vue'
import type { Answer, Answers, Receipt, Survey, SurveyGateway } from '../models/questionnaire'
import { isAnswered, submissionAnswers, validateAnswers, visibleAnswers, visibleQuestions } from '../models/answerRules'
import { ApiError } from '../services/http'
import type { DraftStore } from '../services/storage'

export function createQuestionnaireViewModel(gateway: SurveyGateway, drafts: DraftStore, identity: () => string) {
  const survey = ref<Survey | null>(null)
  const answers = ref<Answers>({})
  const errors = ref<Record<string, string>>({})
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref('')
  const errorCode = ref('')
  const draftMessage = ref('答案仅保存在当前浏览器')
  const receipt = ref<Receipt | null>(null)
  const uncertain = ref(false)
  let loadVersion = 0
  const questions = computed(() => visibleQuestions(survey.value?.current_version.questions ?? [], answers.value))
  const answeredCount = computed(() => questions.value.filter(q => isAnswered(answers.value[q.id])).length)
  const progress = computed(() => questions.value.length ? Math.round(answeredCount.value / questions.value.length * 100) : 0)
  const needsLogin = computed(() => ['AUTH_REQUIRED', 'ANONYMOUS_DISABLED', 'INVALID_TOKEN', 'INVALID_REFRESH_TOKEN'].includes(errorCode.value))
  const blockMessage = computed(() => survey.value?.block_reason === 'daily_submitted'
    ? '你今天已经提交过这份问卷，明天可以再次填写。' : '你已经完成这份问卷，谢谢你的参与。')

  async function load(id: string): Promise<void> {
    const version = ++loadVersion
    const currentIdentity = identity()
    loading.value = true
    submitting.value = false
    error.value = ''
    errorCode.value = ''
    survey.value = null
    answers.value = {}
    errors.value = {}
    receipt.value = null
    uncertain.value = false
    try {
      const value = await gateway.load(id)
      if (version !== loadVersion || currentIdentity !== identity()) return
      survey.value = value
      const stored = drafts.read(value, currentIdentity)
      answers.value = stored ? visibleAnswers(value.current_version.questions, stored.answers) : {}
      draftMessage.value = stored ? '已恢复你上次填写的内容' : '答案仅保存在当前浏览器'
      if (!value.can_fill) drafts.clear(value, currentIdentity)
    } catch (cause) {
      if (version !== loadVersion) return
      error.value = cause instanceof Error ? cause.message : '问卷加载失败，请重试'
      errorCode.value = cause instanceof ApiError ? cause.code : 'REQUEST_FAILED'
    } finally { if (version === loadVersion) loading.value = false }
  }

  function setAnswer(id: string, value: Answer | undefined): void {
    if (!survey.value || submitting.value || receipt.value || !survey.value.can_fill || uncertain.value) return
    const next = { ...answers.value }
    if (value === undefined) delete next[id]
    else next[id] = value
    answers.value = visibleAnswers(survey.value.current_version.questions, next)
    if (Object.keys(errors.value).length) errors.value = validateAnswers(survey.value.current_version.questions, answers.value)
    draftMessage.value = drafts.save(survey.value, identity(), answers.value)
      ? '草稿已保存在当前浏览器' : '浏览器无法保存草稿，请在离开前完成提交'
  }

  function clearDraft(): void {
    if (!survey.value || submitting.value) return
    answers.value = {}
    errors.value = {}
    const cleared = drafts.clear(survey.value, identity())
    draftMessage.value = cleared ? '已清空当前草稿' : '草稿清理失败，请检查浏览器存储设置'
  }

  async function submit(): Promise<string | null> {
    if (!survey.value || submitting.value || receipt.value || !survey.value.can_fill || uncertain.value) return null
    const current = survey.value
    const version = loadVersion
    const currentIdentity = identity()
    errors.value = validateAnswers(current.current_version.questions, answers.value)
    const firstInvalid = questions.value.find(q => errors.value[q.id])?.id
    if (firstInvalid) return firstInvalid
    submitting.value = true
    error.value = ''
    try {
      const result = await gateway.submit(current.id, submissionAnswers(current.current_version.questions, answers.value))
      drafts.clear(current, currentIdentity)
      if (version !== loadVersion || currentIdentity !== identity()) return null
      receipt.value = result
    } catch (cause) {
      if (version !== loadVersion) return null
      const code = cause instanceof ApiError ? cause.code : 'REQUEST_FAILED'
      errorCode.value = code
      if (code === 'DUPLICATE_SUBMISSION') {
        survey.value = { ...current, can_fill: false,
          block_reason: current.duplicate_policy === 'daily' ? 'daily_submitted' : 'already_submitted' }
      } else {
        uncertain.value = code === 'NETWORK_ERROR' || code === 'INVALID_RESPONSE'
        error.value = uncertain.value
          ? '暂未确认提交结果，答案已保留。请先核对，避免重复提交。'
          : cause instanceof Error ? cause.message : '提交未完成，请重试'
      }
    } finally { if (version === loadVersion) submitting.value = false }
    return null
  }
  async function checkSubmission(): Promise<void> {
    if (!survey.value || loading.value) return
    const version = loadVersion
    const currentIdentity = identity()
    loading.value = true
    try {
      const fresh = await gateway.load(survey.value.id)
      if (version !== loadVersion || currentIdentity !== identity()) return
      survey.value = fresh
      if (!fresh.can_fill) { uncertain.value = false; error.value = ''; drafts.clear(fresh, identity()) }
      else error.value = '尚未查到重复提交限制。若发布者允许多次提交，请先向发布者核对，再决定是否重试。'
    } catch (cause) { if (version === loadVersion) error.value = cause instanceof Error ? cause.message : '暂时无法核对提交状态' }
    finally { if (version === loadVersion) loading.value = false }
  }
  function allowRetry(): void { uncertain.value = false; error.value = ''; errorCode.value = '' }
  function dispose(): void { loadVersion++ }
  return { survey, answers, errors, loading, submitting, error, errorCode, draftMessage, receipt,
    questions, answeredCount, progress, needsLogin, blockMessage, uncertain,
    load, setAnswer, clearDraft, submit, checkSubmission, allowRetry, dispose }
}
