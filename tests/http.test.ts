import { afterEach, expect, it, vi } from 'vitest'
import { ApiClient } from '../src/services/http'
import { SurveyService } from '../src/services/surveyService'
import { demoSurvey } from '../src/fixtures/demoSurvey'
const success = (data: unknown) => Response.json({ success: true, message: 'ok', data })
const denied = () => Response.json({ success: false, error: { code: 'INVALID_TOKEN' } }, { status: 401 })
const tokens = { access_token: 'old', refresh_token: 'refresh', expires_in: 900 }
afterEach(() => vi.unstubAllGlobals())
it('shares one refresh between concurrent 401s and retries once', async () => {
  let refreshes = 0
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    if (url.endsWith('/auth/refresh')) { refreshes++; return success({ ...tokens, access_token: 'new' }) }
    return (init.headers as Record<string, string>).Authorization === 'Bearer new' ? success({ ok: true }) : denied()
  }))
  const api = new ApiClient('/api/v1', 'test-client'); api.setSession(tokens, 'user')
  expect(await Promise.all([api.request('/a'), api.request('/b')])).toEqual([{ ok: true }, { ok: true }])
  expect(refreshes).toBe(1)
})
it('does not refresh a failed login or retry a network-failed POST', async () => {
  const fetcher = vi.fn().mockResolvedValue(denied()); vi.stubGlobal('fetch', fetcher)
  const api = new ApiClient('/api/v1', 'test-client'); api.setSession(tokens, 'user')
  await expect(api.request('/auth/login', 'POST', {}, false)).rejects.toMatchObject({ status: 401 })
  expect(fetcher).toHaveBeenCalledTimes(1)
  fetcher.mockRejectedValue(new TypeError('offline'))
  await expect(api.request('/submit', 'POST', { answers: [] })).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
  expect(fetcher).toHaveBeenCalledTimes(2)
})
it('uses the backend envelope, stable client header and submission contract', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(success(demoSurvey)).mockResolvedValueOnce(success({ submission_id: demoSurvey.id, receipt_code: 'R123', submitted_at: new Date().toISOString() }))
  vi.stubGlobal('fetch', fetcher)
  const service = new SurveyService(new ApiClient('/api/v1', 'client-1234567890'))
  expect((await service.load(demoSurvey.id)).id).toBe(demoSurvey.id)
  expect((await service.submit(demoSurvey.id, [])).receipt_code).toBe('R123')
  expect(fetcher.mock.calls[1]?.[0]).toBe(`/api/v1/responses/surveys/${demoSurvey.id}/submit`)
  expect(JSON.parse(fetcher.mock.calls[1]?.[1].body)).toEqual({ answers: [] })
  expect(fetcher.mock.calls[1]?.[1].headers['X-Client-ID']).toBe('client-1234567890')
})
it('surfaces malformed real API responses without substituting demo data', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(success({ title: 'incomplete' })))
  await expect(new SurveyService(new ApiClient('/api/v1', 'test-client')).load(demoSurvey.id)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
})
