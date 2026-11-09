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

export interface SizeCm {
  w: number;
  h: number;
}

/**
 * 解析「15.35*11.5cm」这类规格文本为厘米数值（宽高按原顺序返回）。
 * 分隔符兼容 `*` / `x` / `X` / `×`。
 */
export function parseSizeLabel(name: string): SizeCm | null {
  const matched = (name || '').trim().match(/^([\d.]+)\s*[*x×]\s*([\d.]+)\s*cm$/i);
  if (!matched) return null;
  const w = parseFloat(matched[1]);
  const h = parseFloat(matched[2]);
  if (!Number.isFinite(w) || !Number.isFinite(h)) return null;
  return { w, h };
}

/**
 * 规格尺寸容差（cm）。
 *
 * 规格文本由后端毫米尺寸生成，**尺寸会反复微调**（巨大号 155×116.2mm → 154×115mm →
 * 153.5×115mm，文本随之变化；变更链见 CLAUDE.md 13.2），而花边框 / tab 图等视觉资产
 * 沿用旧尺寸、不重出。所以前端不跟着改代码，靠这个容差把新尺寸归到已有档位。
 *
 * 命中规则是「取差值最小的一档」，容差比相邻档间距大也不会串档；但**新增档位**时
 * 要保证相邻档尺寸差明显大于 2 × 本容差，否则一个尺寸可能落进两档之间。
 */
export const SIZE_MATCH_TOLERANCE_CM = 1;

/**
 * 按尺寸近似匹配「规格文本 -> 值」映射表，宽高允许互换。
 *
 * 后端会微调规格尺寸（如巨大号 15.5*11.62cm → 15.35*11.5cm），精确 key 匹配会让整档
 * 落回默认值（上传区、花边背景、tab 图全部变成 8.5*4cm 那套）。这里改用数值容差
 * 匹配（`tolerance` 单位 cm），取宽高最大差值最小的那一档。
 *
 * 尺寸再改时只需后端改，前端不要动；确实要收紧/放宽，改 `SIZE_MATCH_TOLERANCE_CM`。
 * 详见 CLAUDE.md「13.2 尺寸体系」的规格尺寸容差匹配一节。
 */
export function findSizeMapped<T>(
  map: Record<string, T>,
  name: string,
  tolerance = SIZE_MATCH_TOLERANCE_CM,
): T | undefined {
  if (Object.prototype.hasOwnProperty.call(map, name)) return map[name];
  const target = parseSizeLabel(name);
  if (!target) return undefined;
  let result: T | undefined;
  let resultDiff = Infinity;
  Object.keys(map).forEach((key) => {
    const size = parseSizeLabel(key);
    if (!size) return;
    const diff = Math.min(
      Math.max(Math.abs(size.w - target.w), Math.abs(size.h - target.h)),
      Math.max(Math.abs(size.w - target.h), Math.abs(size.h - target.w)),
    );
    if (diff <= tolerance && diff < resultDiff) {
      resultDiff = diff;
      result = map[key];
    }
  });
  return result;
}

/**
 * 解析后端时间字符串为时间戳（毫秒），解析不了返回 `NaN`。
 *
 * 后端给的是 `2026-11-06 16:59:54` 这种带空格的格式，**不要直接 new Date(字符串)**：
 * 该格式不在 ECMAScript 保证可解析的范围内，部分 iOS(JSCore) 会得到 Invalid Date
 * （微信开发者工具也会报 iOS 兼容提示，`NaN` 会让倒计时变成 `NaN:NaN`）。
 * 这里手工拆字段后用 `new Date(y, m - 1, d, h, mi, s)` 构造，等价本地时区解析，跨端一致。
 *
 * 兼容 `2026-11-06 16:59:54` / `2026/11/06 16:59:54` / `2026-11-06T16:59:54` / 仅日期。
 * 注意：按**本地时区**解析（后端返回的就是不带时区的本地时间）；如果将来后端改成带
 * `+08:00` 这类时区后缀的 ISO 串，这里需要额外处理偏移，不能直接沿用。
 */
export function parseDateTime(value?: string): number {
  const matched = (value || '')
    .trim()
    .match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (!matched) return NaN;
  const [, year, month, day, hour, minute, second] = matched;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour || 0),
    Number(minute || 0),
    Number(second || 0),
  ).getTime();
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
