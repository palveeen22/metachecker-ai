export function formatUrl(url: string | undefined) {
  if (!url) return 'Not found'
  try {
    const urlObj = new URL(url)
    return urlObj.toString()
  } catch {
    return url
  }
}
