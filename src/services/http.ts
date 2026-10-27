import { z } from 'zod'
import { tokenSchema, type TokenPair } from '../models/questionnaire'
import { browserStorage, createClientId } from './storage'

const messages: Record<string, string> = {
  AUTH_REQUIRED: '这份问卷需要登录后填写', ANONYMOUS_DISABLED: '发布者要求登录后填写',
  INVALID_TOKEN: '登录已过期，请重新登录', INVALID_CREDENTIALS: '邮箱或密码不正确',
  INVALID_REFRESH_TOKEN: '登录已过期，请重新登录',
  USER_UNAVAILABLE: '此账号暂时无法使用', SURVEY_UNAVAILABLE: '问卷已关闭或不存在',
  SURVEY_PRIVATE: '这是一份私有问卷，你暂时无法访问', SURVEY_NOT_STARTED: '问卷还未开始，请稍后再来',
  SURVEY_ENDED: '这份问卷已截止，感谢你的关注', EMPTY_SURVEY: '问卷还没有可填写的题目',
  DUPLICATE_SUBMISSION: '你已经提交过这份问卷了', CONDITION_MISMATCH: '题目条件已变化，请检查答案后重试',
  REQUIRED_ANSWER: '还有必答题未完成，请检查后提交', VALIDATION_ERROR: '填写内容不符合要求，请检查后重试',
  INVALID_RESPONSE: '问卷数据格式暂不支持，请联系发布者', NETWORK_ERROR: '暂时无法连接服务，请检查网络后重试',
}
export class ApiError extends Error {
  code: string
  status: number
  constructor(code: string, status = 0, toast?: string) {
    super(messages[code] ?? toast ?? '操作暂未完成，请稍后重试')
    this.code = code
    this.status = status
  }
}
const sessionSchema = tokenSchema.extend({ userId: z.string().optional() })
export type Session = z.infer<typeof sessionSchema>
export class ApiClient {
  readonly clientId: string
  private session: Session | null = null
  private revision = 0
  private refreshing: Promise<boolean> | null = null
  private baseUrl: string
  constructor(baseUrl: string, clientId = createClientId()) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.clientId = clientId
    try {
      const parsed = sessionSchema.safeParse(JSON.parse(browserStorage('sessionStorage')?.getItem('mq-web:session') ?? 'null'))
      if (parsed.success) this.session = parsed.data
    } catch { /* Start as a guest if storage is unavailable or corrupt. */ }
  }
  get identity(): string { return this.session ? `user:${this.session.userId ?? 'pending'}` : `guest:${this.clientId}` }
  get hasSession(): boolean { return this.session !== null }
  setSession(tokens: TokenPair | null, userId?: string): void {
    this.revision++
    this.session = tokens ? { ...tokens, userId } : null
    try {
      const storage = browserStorage('sessionStorage')
      if (this.session) storage?.setItem('mq-web:session', JSON.stringify(this.session))
      else storage?.removeItem('mq-web:session')
    } catch { /* In-memory sessions still work for this tab. */ }
  }
  private async refresh(): Promise<boolean> {
    if (this.refreshing) return this.refreshing
    const current = this.session
    if (!current) return false
    const revision = this.revision
    this.refreshing = (async () => {
      try {
        const data = await this.request('/auth/refresh', 'POST', { refresh_token: current.refresh_token }, false)
        const tokens = tokenSchema.parse(data)
        if (this.revision !== revision) return false
        this.setSession(tokens, current.userId)
        return true
      } catch (error) {
        if (error instanceof ApiError && [400, 401, 403].includes(error.status) && this.revision === revision) this.setSession(null)
        throw error
      }
    })()
    try { return await this.refreshing } finally { this.refreshing = null }
  }
  async request(path: string, method = 'GET', body?: object, authenticated = true, retried = false): Promise<unknown> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    const token = authenticated ? this.session?.access_token : undefined
    const headers: Record<string, string> = { Accept: 'application/json', 'X-Client-ID': this.clientId }
    if (body) headers['Content-Type'] = 'application/json'
    if (token) headers.Authorization = `Bearer ${token}`
    const envelope = z.object({
      success: z.boolean(), data: z.unknown().optional(),
      error: z.object({ code: z.string(), toast: z.string().optional() }).optional(),
    })
    let response: Response
    let value: z.infer<typeof envelope>
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method, headers, body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal, credentials: 'omit', cache: 'no-store',
      })
      try { value = envelope.parse(await response.json()) }
      catch {
        throw new ApiError(controller.signal.aborted ? 'NETWORK_ERROR' : 'INVALID_RESPONSE', response.status)
      }
    } catch (cause) { throw cause instanceof ApiError ? cause : new ApiError('NETWORK_ERROR') }
    finally { clearTimeout(timer) }
    if (response.status === 401 && token && !retried) {
      // Another concurrent response may have already rotated this token.
      if ((this.session?.access_token !== token && this.hasSession) || await this.refresh()) {
        return this.request(path, method, body, authenticated, true)
      }
    }
    if (!response.ok || !value.success) {
      throw new ApiError(value.error?.code ?? 'REQUEST_FAILED', response.status, value.error?.toast)
    }
    return value.data
  }
  async login(email: string, password: string): Promise<void> {
    const tokens = tokenSchema.parse(await this.request('/auth/login', 'POST', { email, password }, false))
    this.setSession(tokens)
    try {
      const user = z.object({ id: z.string().uuid() }).parse(await this.request('/users/me'))
      // Keep the latest pair in case /users/me triggered a rotation.
      if (this.session) this.setSession(this.session, user.id)
    } catch (error) { this.setSession(null); throw error }
  }
}
