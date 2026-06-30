import { request } from './request';
import type { RequestConfig } from './common';

/**
 * 请求拦截器 — 对 request 的二次封装
 * 可在此添加自定义逻辑：签名、加密、请求去重等
 */

/** 无需鉴权的请求 */
export function publicRequest<T = any>(config: RequestConfig) {
  return request<T>({
    ...config,
    header: { ...config.header, 'X-No-Auth': 'true' },
  });
}

/** 静默请求（不显示 loading 和错误提示） */
export function silentRequest<T = any>(config: Omit<RequestConfig, 'showLoading' | 'showError'>) {
  return request<T>({
    ...config,
    showLoading: false,
    showError: false,
  });
}
