import { ApiClient } from './http'
import { SurveyService } from './surveyService'
import { DraftStore } from './storage'

export const siteOrigin = (import.meta.env.VITE_SITE_ORIGIN || 'https://www.kiandfn.cn').replace(/\/$/, '')
export const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL || '/api/v1')
export const surveyService = new SurveyService(apiClient)
export const draftStore = new DraftStore()
