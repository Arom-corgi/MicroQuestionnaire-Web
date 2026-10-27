import { receiptSchema, surveySchema, type AnswerInput, type SurveyGateway } from '../models/questionnaire'
import { ApiClient, ApiError } from './http'

export class SurveyService implements SurveyGateway {
  private client: ApiClient
  constructor(client: ApiClient) { this.client = client }
  async load(id: string) {
    const data = await this.client.request(`/responses/surveys/${encodeURIComponent(id)}`)
    const result = surveySchema.safeParse(data)
    if (!result.success) throw new ApiError('INVALID_RESPONSE')
    return result.data
  }
  async submit(id: string, answers: AnswerInput[]) {
    const data = await this.client.request(`/responses/surveys/${encodeURIComponent(id)}/submit`, 'POST', { answers })
    const result = receiptSchema.safeParse(data)
    if (!result.success) throw new ApiError('INVALID_RESPONSE')
    return result.data
  }
}
