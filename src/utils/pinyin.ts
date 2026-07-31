/**
 * 汉字拼音首字母映射表
 * 仅覆盖中国省份/自治区/直辖市/特别行政区名称的首字
 */
const PINYIN_INITIAL_MAP: Record<string, string> = {
  // A
  安: 'A',
  澳: 'A',
  阿: 'A',
  // B
  北: 'B',
  // C
  重: 'C',
  // F
  福: 'F',
  // G
  甘: 'G',
  广: 'G',
  贵: 'G',
  // H
  海: 'H',
  河: 'H',
  黑: 'H',
  湖: 'H',
  // J
  吉: 'J',
  江: 'J',
  // L
  辽: 'L',
  // N
  内: 'N',
  宁: 'N',
  // Q
  青: 'Q',
  // S
  山: 'S',
  陕: 'S',
  上: 'S',
  四: 'S',
  // T
  台: 'T',
  天: 'T',
  // X
  西: 'X',
  香: 'X',
  新: 'X',
  // Y
  云: 'Y',
  // Z
  浙: 'Z',
};

/**
 * 获取汉字的拼音首字母，无法识别时返回 '#'
 */
export function getPinyinInitial(char: string): string {
  return PINYIN_INITIAL_MAP[char] || '#';
}
