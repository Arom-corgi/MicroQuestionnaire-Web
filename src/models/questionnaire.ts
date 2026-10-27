import { z } from 'zod'

const optionSchema = z.object({
  id: z.string().uuid(), label: z.string(), value: z.string(), position: z.number(),
})
export const questionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['single_choice', 'multiple_choice', 'text', 'rating', 'dropdown']),
  title: z.string(), description: z.string().nullable().optional(), required: z.boolean(),
  position: z.number(), options: z.array(optionSchema).default([]),
  validation: z.object({
    min_length: z.number().optional(), max_length: z.number().optional(),
    min_selections: z.number().optional(), max_selections: z.number().optional(),
    min: z.number().optional(), max: z.number().optional(),
  }).default({}),
  depends_on: z.object({
    logic: z.enum(['all', 'any']).default('all'),
    conditions: z.array(z.object({
      question_id: z.string().uuid(), op: z.enum(['in', 'not_in']).default('in'),
      values: z.array(z.string()),
    })).min(1),
  }).nullable().optional(),
})

export const surveySchema = z.object({
  id: z.string().uuid(), title: z.string(), description: z.string().nullable(),
  tags: z.array(z.string()).default([]), allow_anonymous: z.boolean(), require_login: z.boolean(),
  duplicate_policy: z.enum(['once', 'daily', 'unlimited']),
  ends_at: z.string().nullable().optional(), can_fill: z.boolean(),
  block_reason: z.enum(['already_submitted', 'daily_submitted']).nullable().optional(),
  current_version: z.object({ id: z.string().uuid(), questions: z.array(questionSchema).min(1) }),
})

export const receiptSchema = z.object({
  submission_id: z.string().uuid(), receipt_code: z.string(), submitted_at: z.string(),
})
export const tokenSchema = z.object({
  access_token: z.string().min(1), refresh_token: z.string().min(1), expires_in: z.number().positive(),
})
export type Question = z.infer<typeof questionSchema>
export type Survey = z.infer<typeof surveySchema>
export type Receipt = z.infer<typeof receiptSchema>
export type TokenPair = z.infer<typeof tokenSchema>
export type Answer = string | string[] | number
export type Answers = Record<string, Answer>
export interface AnswerInput { question_id: string; value: Answer }
export interface SurveyGateway {
  load(id: string): Promise<Survey>
  submit(id: string, answers: AnswerInput[]): Promise<Receipt>
}
export const questionTypeLabels: Record<Question['type'], string> = {
  single_choice: '单选', multiple_choice: '多选', text: '填空', rating: '评分', dropdown: '下拉选择',
}
