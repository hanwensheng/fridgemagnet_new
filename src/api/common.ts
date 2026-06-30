/**
 * API 公共类型和常量
 */

/** 后端统一响应格式 */
export interface ApiResponse<T = any> {
  code: string;
  data: T;
  msg: string;
  status: boolean;
}

/** 分页响应 */
export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 请求配置 */
export interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  /** 是否显示 loading */
  showLoading?: boolean;
  /** 是否显示错误提示 */
  showError?: boolean;
  /** 自定义错误消息 */
  errorMsg?: string;
}

/** 错误码定义 */
export const ErrorCode = {
  SUCCESS: '0',
  UNAUTHORIZED: '401',
  FORBIDDEN: '403',
  NOT_FOUND: '404',
  SERVER_ERROR: '500',
  NETWORK_ERROR: '-1',
  TIMEOUT: '-2',
  UNKNOWN: '-999',
} as const;

/** HTTP 状态码映射 */
export const HTTP_MESSAGES: Record<number, string> = {
  400: '请求参数错误',
  401: '未授权，请重新登录',
  403: '拒绝访问',
  404: '请求资源不存在',
  408: '请求超时',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务不可用',
  504: '网关超时',
};
