/**
 * 将接口返回的毫米尺寸转为 cm 显示文本
 * 如 "85.0"x"40.0" -> "8.5*4cm"
 */
export function formatSizeLabel(width: string, height: string): string {
  return `${mmToCm(width)}*${mmToCm(height)}cm`;
}

/**
 * 毫米 -> 厘米文本。
 * 直接除以 10 会出现浮点误差（116.2 / 10 = 11.620000000000001），
 * 这里按 3 位小数收敛后再转数字，顺带去掉末尾多余的 0（8.500 -> 8.5、4.000 -> 4）。
 */
function mmToCm(value: string): string {
  return String(Number((parseFloat(value) / 10).toFixed(3)));
}
