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

/**
 * 预计送达时间文案：后端给 `2026-10-16 12:00:00` → 「预计送达时间10月16日12:00前」
 *
 * 手工正则解析，**不要用 `new Date('2026-10-16 12:00:00')`**：iOS(JSCore) 不认这种带空格的格式，
 * 会得到 Invalid Date。月/日去掉前导零（7月21日），时分保持两位（09:00）；
 * 只给到日期（`2026-10-16`）时拼成「预计送达时间10月16日前」；解析不了就原样返回，避免整行空着。
 */
export function formatDeliveryPromise(value?: string): string {
  const raw = (value || '').trim();
  if (!raw) return '';

  const matched = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{1,2}))?/);
  if (!matched) return raw;

  const [, , month, day, hour, minute] = matched;
  const timeText = hour === undefined ? '' : `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  return `预计送达时间${Number(month)}月${Number(day)}日${timeText}前`;
}
