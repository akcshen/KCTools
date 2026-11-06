export async function copyText(text: string): Promise<void> {
  if (!text) throw new Error('没有可复制的内容')
  if (!navigator.clipboard?.writeText) {
    throw new Error('这台浏览器不允许复制，请手动选择文本')
  }
  await navigator.clipboard.writeText(text)
}
