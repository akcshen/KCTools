export function formatJson(input: string, space: 0 | 2): string {
  if (!input.trim()) throw new Error('请先粘贴 JSON')
  let value: unknown
  try {
    value = JSON.parse(input)
  } catch (error) {
    throw new Error(explainJsonError(error, input))
  }
  return space === 0 ? JSON.stringify(value) : JSON.stringify(value, null, space)
}

function explainJsonError(error: unknown, input: string): string {
  const message = error instanceof Error ? error.message : ''
  const position = /position (\d+)/.exec(message)
  if (!position) return 'JSON 无法解析，请检查括号、引号和逗号'
  const index = Number(position[1])
  const line = input.slice(0, index).split(/\n/).length
  return `JSON 无法解析：第 ${line} 行附近有语法错误`
}
