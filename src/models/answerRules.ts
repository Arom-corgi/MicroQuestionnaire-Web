import type { Answer, AnswerInput, Answers, Question } from './questionnaire'

export function isAnswered(value: Answer | undefined): boolean {
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return typeof value === 'number' && Number.isFinite(value)
}

// Match the API: an unanswered or hidden parent never satisfies not_in.
// Iteration also handles imported surveys whose dependency order differs from display order.
export function visibleQuestions(questions: Question[], answers: Answers): Question[] {
  const visible = new Set(questions.filter(q => !q.depends_on).map(q => q.id))
  let changed = true
  while (changed) {
    changed = false
    for (const q of questions) {
      if (visible.has(q.id) || !q.depends_on) continue
      const matches = q.depends_on.conditions.map(condition => {
        const value = answers[condition.question_id]
        if (!visible.has(condition.question_id) || !isAnswered(value)) return false
        const selected = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
        if (!selected.length) return false
        const hit = selected.some(option => condition.values.includes(option))
        return condition.op === 'not_in' ? !hit : hit
      })
      if (q.depends_on.logic === 'any' ? matches.some(Boolean) : matches.every(Boolean)) {
        visible.add(q.id)
        changed = true
      }
    }
  }
  return questions.filter(q => visible.has(q.id)).sort((a, b) => a.position - b.position)
}

export function visibleAnswers(questions: Question[], answers: Answers): Answers {
  return Object.fromEntries(visibleQuestions(questions, answers)
    .filter(q => isAnswered(answers[q.id])).map(q => [q.id, answers[q.id]!]))
}

export function validateAnswer(q: Question, value: Answer | undefined): string {
  if (!isAnswered(value)) return q.required ? '请完成这道必答题' : ''
  if (q.type === 'single_choice' || q.type === 'dropdown') {
    return typeof value === 'string' && q.options.some(o => o.value === value) ? '' : '请选择有效选项'
  }
  if (q.type === 'multiple_choice') {
    if (!Array.isArray(value) || new Set(value).size !== value.length ||
      value.some(v => !q.options.some(o => o.value === v))) return '请选择有效选项'
    const min = q.validation.min_selections ?? 0
    const max = q.validation.max_selections ?? q.options.length
    return value.length < min ? `请至少选择 ${min} 项` : value.length > max ? `最多选择 ${max} 项` : ''
  }
  if (q.type === 'text') {
    if (typeof value !== 'string') return '请输入文字'
    // Python len counts Unicode code points, not UTF-16 code units.
    const length = Array.from(value).length
    const min = q.validation.min_length ?? 0
    const max = q.validation.max_length ?? 10000
    return length < min ? `请至少填写 ${min} 个字` : length > max ? `请控制在 ${max} 个字以内` : ''
  }
  const min = q.validation.min ?? 1
  const max = q.validation.max ?? 5
  return typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max
    ? `请填写 ${min} 至 ${max} 之间的评分` : ''
}

export function validateAnswers(questions: Question[], answers: Answers): Record<string, string> {
  return Object.fromEntries(visibleQuestions(questions, answers)
    .map(q => [q.id, validateAnswer(q, answers[q.id])]).filter(([, message]) => message))
}

export function submissionAnswers(questions: Question[], answers: Answers): AnswerInput[] {
  return Object.entries(visibleAnswers(questions, answers)).map(([question_id, value]) => ({ question_id, value }))
}

export function ratingChoices(q: Question): number[] {
  const min = q.validation.min ?? 1
  const max = q.validation.max ?? 5
  if (!Number.isInteger(min) || !Number.isInteger(max) || max - min > 10 || max < min) return []
  return Array.from({ length: max - min + 1 }, (_, i) => i + min)
}
