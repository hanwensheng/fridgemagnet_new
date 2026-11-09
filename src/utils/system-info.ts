import Taro from '@tarojs/taro';

/**
 * 窗口/系统尺寸的统一入口。
 *
 * 背景：`Taro.getSystemInfoSync()` 已被微信标记 deprecated，每调用一次控制台就刷一条
 * 「wx.getSystemInfoSync is deprecated」警告；而它原本散落在各页面 render 期调用
 * （BasePage 每次重渲染都调一次，叠加订单页的 setInterval 会每秒刷屏）。
 *
 * 处理：
 * - 统一走 `Taro.getWindowInfo()`（基础库 ≥ 2.20.1，本项目 libVersion 3.17.3 已满足），
 *   它覆盖原有用到的全部字段：statusBarHeight / windowWidth / windowHeight /
 *   screenWidth / screenHeight / pixelRatio / safeArea；
 * - 老基础库回落 getSystemInfoSync；
 * - 小程序端模块级缓存，整个应用只真正取一次（反复渲染、定时器重渲染都不再调 API）。
 *
 * 不要再直接调用 `Taro.getSystemInfoSync()`，统一用这里的 `getWindowInfo()`。
 */
export interface SafeArea {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface WindowInfo {
  statusBarHeight: number;
  windowWidth: number;
  windowHeight: number;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  safeArea?: SafeArea;
}

function readWindowInfo(): WindowInfo {
  /**
   * 基础库 < 2.20.1 没有 wx.getWindowInfo，调用会抛错（Taro 也可能把它代理成空实现），
   * 统一 catch 后回落旧 API。回落只发生在老基础库，不会产生 deprecated 刷屏。
   */
  const readNewApi = () => {
    try {
      return typeof Taro.getWindowInfo === 'function' ? Taro.getWindowInfo() : undefined;
    } catch {
      return undefined;
    }
  };
  const raw = readNewApi() ?? Taro.getSystemInfoSync();
  return {
    statusBarHeight: raw.statusBarHeight || 0,
    windowWidth: raw.windowWidth || 0,
    windowHeight: raw.windowHeight || 0,
    screenWidth: raw.screenWidth || 0,
    screenHeight: raw.screenHeight || 0,
    pixelRatio: raw.pixelRatio || 1,
    safeArea: raw.safeArea,
  };
}

let weappCache: WindowInfo | null = null;

/**
 * 读取窗口尺寸。小程序端带缓存；H5 端窗口会 resize，每次现取。
 *
 * 缓存前校验 windowWidth / windowHeight：冷启动极早期可能拿到 0，
 * 这种无效值不写缓存，等下次调用重取，避免把错误尺寸固化到整个生命周期。
 */
export function getWindowInfo(): WindowInfo {
  if (process.env.TARO_ENV !== 'weapp') return readWindowInfo();
  if (weappCache) return weappCache;
  const info = readWindowInfo();
  if (info.windowWidth > 0 && info.windowHeight > 0) weappCache = info;
  return info;
}
