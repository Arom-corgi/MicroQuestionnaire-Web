import { expect, it, vi } from 'vitest'
import { demoSurvey, DemoSurveyService } from '../src/fixtures/demoSurvey'
import { DraftStore, type StorageLike } from '../src/services/storage'
import { ApiError } from '../src/services/http'
import { createQuestionnaireViewModel } from '../src/viewmodels/questionnaireViewModel'

class MemoryStorage implements StorageLike {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}
const [identity, grade, activities, rating] = demoSurvey.current_version.questions
async function setup() {
  const service = new DemoSurveyService()
  const storage = new MemoryStorage()
  const drafts = new DraftStore(storage)
  const vm = createQuestionnaireViewModel(service, drafts, () => 'guest:test')
  await vm.load(demoSurvey.id)
  return { vm, service, drafts, storage }
}
function complete(vm: Awaited<ReturnType<typeof setup>>['vm']) {
  vm.setAnswer(identity!.id, 'teacher'); vm.setAnswer(activities!.id, ['1']); vm.setAnswer(rating!.id, 5)
}
it('prunes hidden answers immediately and restores a local draft', async () => {
  const { vm } = await setup()
  vm.setAnswer(identity!.id, 'student'); vm.setAnswer(grade!.id, '1')
  vm.setAnswer(identity!.id, 'teacher')
  expect(vm.answers.value[grade!.id]).toBeUndefined()
  await vm.load(demoSurvey.id)
  expect(vm.answers.value[identity!.id]).toBe('teacher')
})
it('does not submit when required answers are missing', async () => {
  const { vm, service } = await setup(); const send = vi.spyOn(service, 'submit')
  expect(await vm.submit()).toBe(identity!.id)
  expect(send).not.toHaveBeenCalled()
})
it('blocks double submission, shows receipt and clears the draft', async () => {
  const { vm, service, drafts } = await setup(); complete(vm)
  const send = vi.spyOn(service, 'submit')
  await Promise.all([vm.submit(), vm.submit()])
  expect(send).toHaveBeenCalledTimes(1)
  expect(vm.receipt.value?.receipt_code).toBe('DEMO-PREVIEW')
  expect(drafts.read(demoSurvey, 'guest:test')).toBeNull()
})
it('retains failed answers and requires explicit retry after uncertain submission', async () => {
  const { vm, service, drafts } = await setup(); complete(vm)
  const send = vi.spyOn(service, 'submit').mockRejectedValue(new ApiError('NETWORK_ERROR'))
  await vm.submit(); await vm.submit()
  expect(vm.uncertain.value).toBe(true); expect(send).toHaveBeenCalledTimes(1)
  expect(drafts.read(demoSurvey, 'guest:test')?.answers[rating!.id]).toBe(5)
  vm.allowRetry(); await vm.submit(); expect(send).toHaveBeenCalledTimes(2)
})
it('blocks after the server reports a duplicate', async () => {
  const { vm, service } = await setup(); complete(vm)
  vi.spyOn(service, 'submit').mockRejectedValue(new ApiError('DUPLICATE_SUBMISSION', 409))
  await vm.submit(); expect(vm.survey.value?.can_fill).toBe(false)
})
it('never displays a previous questionnaire submission on a new route', async () => {
  const { vm, service } = await setup(); complete(vm)
  let resolve!: (value: Awaited<ReturnType<DemoSurveyService['submit']>>) => void
  vi.spyOn(service, 'submit').mockImplementation(() => new Promise(r => { resolve = r }))
  const pending = vm.submit()
  await vm.load(demoSurvey.id)
  resolve(await new DemoSurveyService().submit()); await pending
  expect(vm.receipt.value).toBeNull()
})
it('isolates drafts by identity, survey version and expiry', async () => {
  const { drafts, storage } = await setup()
  drafts.save(demoSurvey, 'a', { [identity!.id]: 'student' })
  expect(drafts.read(demoSurvey, 'b')).toBeNull()
  const changed = structuredClone(demoSurvey); changed.current_version.id = 'new-version'
  expect(drafts.read(changed, 'a')).toBeNull()
  drafts.save(demoSurvey, 'a', {})
  const key = [...storage.values.keys()][0]!
  const value = JSON.parse(storage.values.get(key)!); value.savedAt = 0
  storage.values.set(key, JSON.stringify(value))
  expect(drafts.read(demoSurvey, 'a')).toBeNull()
})
