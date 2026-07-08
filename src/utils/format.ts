/**
 * 将接口返回的毫米尺寸转为 cm 显示文本
 * 如 "85.0"x"40.0" -> "8.5*4cm"
 */
export function formatSizeLabel(width: string, height: string): string {
  return `${parseFloat(width) / 10}*${parseFloat(height) / 10}cm`;
}
