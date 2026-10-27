import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { parseSurveyLink } from '../models/shareLink'

export function useHomeViewModel() {
  const link = ref('')
  const error = ref('')
  const router = useRouter()
  function openSurvey(): void {
    const id = parseSurveyLink(link.value)
    if (!id) { error.value = '请粘贴有效的问卷分享链接或问卷 ID'; return }
    error.value = ''
    void router.push(`/s/${id}`)
  }
  return { link, error, openSurvey }
}
