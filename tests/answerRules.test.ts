import { describe, expect, it } from 'vitest'
import { demoSurvey } from '../src/fixtures/demoSurvey'
import { ratingChoices, submissionAnswers, validateAnswer, validateAnswers, visibleQuestions } from '../src/models/answerRules'
import { parseSurveyLink } from '../src/models/shareLink'
import type { Question } from '../src/models/questionnaire'

const questions = demoSurvey.current_version.questions
const [identity, grade, activities, rating, text] = questions as [Question, Question, Question, Question, Question]
describe('conditional questionnaire rules', () => {
  it('shows follow-up only after selecting its parent choice', () => {
    expect(visibleQuestions(questions, {}).map(q => q.id)).not.toContain(grade.id)
    expect(visibleQuestions(questions, { [identity.id]: 'student' }).map(q => q.id)).toContain(grade.id)
    expect(validateAnswers(questions, {})[grade.id]).toBeUndefined()
  })
  it('not_in never matches an empty or hidden parent', () => {
    const q = { ...grade, depends_on: { logic: 'all' as const, conditions: [{ question_id: identity.id, op: 'not_in' as const, values: ['teacher'] }] } }
    expect(visibleQuestions([identity, q], {})).toHaveLength(1)
    expect(visibleQuestions([identity, q], { [identity.id]: 'student' })).toHaveLength(2)
  })
  it('handles nested dependencies even when display order differs', () => {
    const child = { ...text, depends_on: { logic: 'all' as const, conditions: [{ question_id: grade.id, op: 'in' as const, values: ['1'] }] } }
    const all = [child, grade, identity]
    expect(visibleQuestions(all, { [identity.id]: 'student', [grade.id]: '1' })).toHaveLength(3)
    expect(submissionAnswers(all, { [identity.id]: 'teacher', [grade.id]: '1', [text.id]: 'stale' })).toEqual([{ question_id: identity.id, value: 'teacher' }])
  })
  it('distinguishes any and all across multiple parents', () => {
    const depends = { logic: 'any' as 'all' | 'any', conditions: [
      { question_id: identity.id, op: 'in' as const, values: ['student'] },
      { question_id: activities.id, op: 'in' as const, values: ['2'] },
    ] }
    const q = { ...text, depends_on: depends }
    expect(visibleQuestions([identity, activities, q], { [activities.id]: ['2'] })).toHaveLength(3)
    q.depends_on.logic = 'all'
    expect(visibleQuestions([identity, activities, q], { [activities.id]: ['2'] })).toHaveLength(2)
  })
  it('validates option membership, duplicate choices and selection limits', () => {
    expect(validateAnswer(identity, 'made-up')).not.toBe('')
    expect(validateAnswer(activities, ['1', '1'])).not.toBe('')
    expect(validateAnswer(activities, ['1', '2', '3', '4'])).toContain('3')
  })
  it('matches Python Unicode length and accepts zero/decimal rating when allowed', () => {
    expect(validateAnswer({ ...text, validation: { max_length: 1 } }, '🐟')).toBe('')
    const q = { ...rating, validation: { min: 0, max: 100 } }
    expect(validateAnswer(q, 0)).toBe('')
    expect(validateAnswer(q, 1.5)).toBe('')
    expect(validateAnswer(q, NaN)).not.toBe('')
    expect(ratingChoices(q)).toEqual([])
  })
  it('omits empty optional answers', () => {
    expect(submissionAnswers([text], { [text.id]: '   ' })).toEqual([])
  })
})
describe('share links', () => {
  it('accepts the agreed HTTPS URL and bare ID', () => {
    expect(parseSurveyLink(`https://www.kiandfn.cn/s/${demoSurvey.id}?from=qq`)).toBe(demoSurvey.id)
    expect(parseSurveyLink(demoSurvey.id)).toBe(demoSurvey.id)
  })
  it('rejects unrelated hosts, schemes and malformed IDs', () => {
    for (const link of [`microquestionnaire://fill?survey_id=${demoSurvey.id}`, `http://www.kiandfn.cn/s/${demoSurvey.id}`, `https://evil.test/s/${demoSurvey.id}`, 'javascript:alert(1)', 'https://www.kiandfn.cn/s/no']) expect(parseSurveyLink(link)).toBeNull()
  })
})
