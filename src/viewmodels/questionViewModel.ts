import { computed } from 'vue'
import type { Answer, Question } from '../models/questionnaire'
import { questionTypeLabels } from '../models/questionnaire'
import { ratingChoices } from '../models/answerRules'

export function useQuestionViewModel(props: { question: Question; value?: Answer }, update: (value: Answer | undefined) => void) {
  const choices = computed(() => ratingChoices(props.question))
  const typeLabel = computed(() => questionTypeLabels[props.question.type])
  const options = computed(() => [...props.question.options].sort((a, b) => a.position - b.position))
  const textValue = computed(() => typeof props.value === 'string' ? props.value : '')
  const textLength = computed(() => Array.from(textValue.value).length)
  const selected = (value: string) => Array.isArray(props.value) && props.value.includes(value)
  function toggle(value: string): void {
    const values = Array.isArray(props.value) ? props.value : []
    update(values.includes(value) ? values.filter(v => v !== value) : [...values, value])
  }
  function inputText(event: Event): void { update((event.target as HTMLInputElement).value) }
  function inputRating(event: Event): void {
    const raw = (event.target as HTMLInputElement).value
    update(raw === '' ? undefined : Number(raw))
  }
  return { choices, typeLabel, options, textValue, textLength, selected, toggle, inputText, inputRating }
}
