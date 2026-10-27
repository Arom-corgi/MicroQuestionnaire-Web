const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function parseSurveyLink(input: string): string | null {
  const text = input.trim()
  if (uuid.test(text)) return text.toLowerCase()
  try {
    const url = new URL(text)
    if (url.origin !== 'https://www.kiandfn.cn' || url.username || url.password) return null
    const pathId = url.pathname.match(/^\/s\/([^/]+)$/)?.[1]
    const id = pathId ? decodeURIComponent(pathId) : null
    return id && uuid.test(id) ? id.toLowerCase() : null
  } catch { return null }
}
