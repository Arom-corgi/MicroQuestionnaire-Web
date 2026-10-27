<script setup lang="ts">
import type { Answer, Question } from '../models/questionnaire'
import { useQuestionViewModel } from '../viewmodels/questionViewModel'
const props = defineProps<{ question: Question; index: number; value?: Answer; error?: string; disabled?: boolean }>()
const emit = defineEmits<{ answer: [value: Answer | undefined] }>()
const { choices, typeLabel, options, textValue, textLength, selected, toggle, inputText, inputRating } = useQuestionViewModel(props, value => emit('answer', value))
</script>

<template>
  <fieldset :id="`question-${question.id}`" class="paper question-card" :class="{ 'has-error': error }" :disabled="disabled" tabindex="-1" :aria-describedby="`hint-${question.id} error-${question.id}`">
    <legend class="sr-only">{{ index + 1 }}. {{ question.title }}{{ question.required ? '（必答）' : '' }}</legend>
    <div class="question-meta"><span class="question-number">{{ String(index + 1).padStart(2, '0') }}</span><span>{{ typeLabel }}</span><span v-if="question.required" class="required-label">必答</span><span v-else class="optional-label">选填</span></div>
    <h2 class="question-title">{{ question.title }}</h2><p :id="`hint-${question.id}`" class="question-description">{{ question.description }}</p>
    <div v-if="question.type === 'single_choice' || question.type === 'multiple_choice'" class="choice-list">
      <label v-for="option in options" :key="option.id" class="choice" :class="{ selected: question.type === 'single_choice' ? value === option.value : selected(option.value) }">
        <input v-if="question.type === 'single_choice'" type="radio" :name="question.id" :value="option.value" :checked="value === option.value" :aria-invalid="!!error" @change="emit('answer', option.value)">
        <input v-else type="checkbox" :name="question.id" :value="option.value" :checked="selected(option.value)" :aria-invalid="!!error" @change="toggle(option.value)"><span>{{ option.label }}</span>
      </label>
    </div>
    <template v-else-if="question.type === 'dropdown'"><label class="sr-only" :for="`input-${question.id}`">{{ question.title }}</label><select :id="`input-${question.id}`" :value="textValue" :aria-invalid="!!error" @change="inputText"><option value="">请选择</option><option v-for="option in options" :key="option.id" :value="option.value">{{ option.label }}</option></select></template>
    <template v-else-if="question.type === 'text'"><label class="sr-only" :for="`input-${question.id}`">{{ question.title }}</label><textarea :id="`input-${question.id}`" :value="textValue" rows="4" placeholder="在这里写下你的想法…" :aria-invalid="!!error" @input="inputText" /><div class="text-count">{{ textLength }} / {{ question.validation.max_length ?? 10000 }}</div></template>
    <template v-else>
      <div v-if="choices.length" class="rating-list"><label v-for="score in choices" :key="score" class="rating-choice" :class="{ selected: value === score }"><input type="radio" :name="question.id" :checked="value === score" :value="score" :aria-label="`${score} 分`" @change="emit('answer', score)"><span>{{ score }}</span></label></div>
      <template v-else><label class="sr-only" :for="`input-${question.id}`">{{ question.title }}</label><input :id="`input-${question.id}`" type="number" inputmode="decimal" step="any" :min="question.validation.min ?? 1" :max="question.validation.max ?? 5" :value="value" :aria-invalid="!!error" @input="inputRating"></template>
      <div class="rating-labels"><span>{{ question.validation.min ?? 1 }} 分</span><span>{{ question.validation.max ?? 5 }} 分</span></div>
    </template>
    <button v-if="!question.required && value !== undefined" type="button" class="text-button clear-answer" @click="emit('answer', undefined)">清除本题答案</button><p v-if="error" :id="`error-${question.id}`" class="field-error" role="alert">{{ error }}</p>
  </fieldset>
</template>
