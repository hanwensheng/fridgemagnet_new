import Taro from '@tarojs/taro';

import { ApiResponse, RequestConfig, ErrorCode, HTTP_MESSAGES } from './common';
/** API 基础地址 — 根据环境切换 */
const BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'http://8.141.81.252:7098'
    : 'https://api.zhongjiatong.vip/api';
// : 'http://192.168.110.85:8080/fridgemagnet_app_bg';

/** 请求超时时间 (ms) */
const TIMEOUT = 10000;

/** 当前并发请求数 */
let requestCount = 0;

function showLoading() {
  requestCount++;
  if (requestCount === 1) {
    Taro.showLoading({ title: '加载中...', mask: true });
  }
}

function hideLoading() {
  requestCount--;
  if (requestCount <= 0) {
    requestCount = 0;
    Taro.hideLoading();
  }
}

function showError(msg: string) {
  Taro.showToast({ title: msg, icon: 'none', duration: 2000 });
}

/** 网络异常 Modal 是否正在显示（防重入，避免并发请求重复弹窗） */
let isShowingNetworkModal = false;

/** 显示网络异常 Modal（需用户点"我知道了"关闭，拦截性最强） */
function showNetworkModal(title: string, content: string): Promise<void> {
  return new Promise((resolve) => {
    if (isShowingNetworkModal) {
      resolve();
      return;
    }
    isShowingNetworkModal = true;
    Taro.showModal({
      title,
      content,
      showCancel: false,
      confirmText: '我知道了',
      success: () => {
        isShowingNetworkModal = false;
        // 用户点击确认后，清空页面栈返回首页
        Taro.switchTab({ url: '/pages/index/index' });
        resolve();
      },
      fail: () => {
        isShowingNetworkModal = false;
        resolve();
      },
    });
  });
}

/** 检测网络状态，无网络时弹 Modal 提示并返回 false 用于拦截请求 */
async function ensureNetworkAvailable(): Promise<boolean> {
  try {
    const { networkType } = await Taro.getNetworkType();
    if (networkType === 'none') {
      await showNetworkModal('网络异常', '当前无网络连接，请检查网络后重试');
      return false;
    }
    return true;
  } catch {
    // 检测本身失败时不阻塞，交给后续请求的错误处理兜底
    return true;
  }
}

function getToken(): string {
  return Taro.getStorageSync('token') || '';
}

/** 未登录处理 */
function handleUnauthorized() {
  import('@/store').then(({ useAppStore }) => {
    const { logout } = useAppStore.getState();
    logout();
  });
  Taro.showModal({
    title: '提示',
    content: '登录已过期，请重新登录',
    showCancel: false,
  }).then(() => {
    Taro.switchTab({ url: '/pages/mine/index' });
  });
}

/** 根据文件扩展名获取 MIME 类型 */
function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    bmp: 'image/bmp',
    webp: 'image/webp',
  };
  return map[ext.toLowerCase()] || 'image/jpeg';
}

/**
 * 上传图片到阿里云 OSS，返回展示 URL
 * 流程：获取加签 URL → PUT 上传文件 → 返回 showUrl
 * @param merchantId 可选，套餐上传时传入，路径为 app/merchant/{merchantId}/xxx.jpg
 */
export async function uploadImage(filePath: string, merchantId?: string): Promise<string> {
  // 网络检测拦截
  if (!(await ensureNetworkAvailable())) {
    throw new Error('当前无网络连接');
  }
  const fs = Taro.getFileSystemManager();

  // 读取本地文件为 ArrayBuffer
  const fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
    fs.readFile({
      filePath,
      dataType: 'arraybuffer',
      success: (res) => resolve(res.data as ArrayBuffer),
      fail: (err) => reject(new Error(err.errMsg || '读取文件失败')),
    } as any);
  });

  // 生成唯一 objectName 和 contentType
  const ext = filePath.split('.').pop() || 'jpg';
  const contentType = getMimeType(ext);
  const prefix = merchantId ? `app/merchant/${merchantId}` : 'app/order';
  const objectName = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // 获取加签 URL
  const token = getToken();
  const header: Record<string, string> = {};
  if (token) header['Authorization'] = token;

  const signRes = await Taro.request({
    url: `${BASE_URL}/secureImageUploadUrl`,
    method: 'POST',
    data: { contentType: [contentType], objectName: [objectName] },
    header,
    timeout: TIMEOUT,
  });

  const signData = signRes.data as ApiResponse<{ uploadUrl: string[]; showUrl: string[] }>;
  if (!signData.status || !signData.data) {
    throw new Error(signData.msg || '获取上传地址失败');
  }

  const uploadUrl = signData.data.uploadUrl[0];
  const showUrl = signData.data.showUrl[0];

  // PUT 上传到 OSS — Content-Type 必须与后端签名时一致
  await Taro.request({
    url: uploadUrl,
    method: 'PUT',
    data: fileData,
    header: {
      'Content-Type': contentType,
      'x-oss-forbid-overwrite': 'true',
      'x-oss-content-length-range': `1,${10 * 1024 * 1024}`,
    },
    timeout: 30000,
  });

  return showUrl;
}

/** 批量上传图片，一次签名请求，并行上传 */
export async function uploadImages(filePaths: string[], merchantId?: string): Promise<string[]> {
  // 网络检测拦截
  if (!(await ensureNetworkAvailable())) {
    throw new Error('当前无网络连接');
  }
  const fs = Taro.getFileSystemManager();

  // 并行读取所有文件
  const fileDataList = await Promise.all(
    filePaths.map(
      (filePath) =>
        new Promise<ArrayBuffer>((resolve, reject) => {
          fs.readFile({
            filePath,
            dataType: 'arraybuffer',
            success: (res) => resolve(res.data as ArrayBuffer),
            fail: (err) => reject(new Error(err.errMsg || '读取文件失败')),
          } as any);
        }),
    ),
  );

  // 生成 objectName 和 contentType
  const contentTypes: string[] = [];
  const objectNames: string[] = [];
  const prefix = merchantId ? `app/merchant/${merchantId}` : 'app/order';
  filePaths.forEach((filePath) => {
    const ext = filePath.split('.').pop() || 'jpg';
    contentTypes.push(getMimeType(ext));
    objectNames.push(`${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`);
  });

  // 一次签名请求
  const token = getToken();
  const header: Record<string, string> = {};
  if (token) header['Authorization'] = token;

  const signRes = await Taro.request({
    url: `${BASE_URL}/secureImageUploadUrl`,
    method: 'POST',
    data: { contentType: contentTypes, objectName: objectNames },
    header,
    timeout: TIMEOUT,
  });

  const signData = signRes.data as ApiResponse<{ uploadUrl: string[]; showUrl: string[] }>;
  if (!signData.status || !signData.data) {
    throw new Error(signData.msg || '获取上传地址失败');
  }

  const { uploadUrl, showUrl } = signData.data;

  // 并行上传所有文件
  await Promise.all(
    fileDataList.map((fileData, i) =>
      Taro.request({
        url: uploadUrl[i],
        method: 'PUT',
        data: fileData,
        header: {
          'Content-Type': contentTypes[i],
          'x-oss-forbid-overwrite': 'true',
          'x-oss-content-length-range': `1,${10 * 1024 * 1024}`,
        },
        timeout: 30000,
      }),
    ),
  );

  return showUrl;
}

/** 核心请求函数 */
export async function request<T = any>(config: RequestConfig): Promise<T> {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    showLoading: needLoading = true,
    showError: needShowError = true,
  } = config;

  // 注入 Token
  const token = getToken();
  if (token) {
    header['Authorization'] = token;
  }

  // 网络检测拦截：放在 loading 之前，避免 loading 与 Modal 冲突
  if (!(await ensureNetworkAvailable())) {
    return Promise.reject({
      code: ErrorCode.NETWORK_ERROR,
      message: '当前无网络连接',
    });
  }

  if (needLoading) showLoading();

  try {
    const response = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
      timeout: TIMEOUT,
    });

    const { statusCode, data: resData } = response;

    // HTTP 层错误
    if (statusCode < 200 || statusCode >= 300) {
      const msg = HTTP_MESSAGES[statusCode] || `请求错误 (${statusCode})`;
      if (statusCode === 401) {
        handleUnauthorized();
        return Promise.reject({ code: ErrorCode.UNAUTHORIZED, message: msg });
      }
      if (needShowError) showError(msg);
      return Promise.reject({ code: statusCode, message: msg });
    }

    // 业务层错误
    const apiRes = resData as ApiResponse<T>;
    if (!apiRes.status) {
      if (apiRes.code === '3005') {
        // 无登录凭证，清除本地状态并跳转首页
        import('@/store').then(({ useAppStore }) => {
          const { logout } = useAppStore.getState();
          logout();
        });
        Taro.showToast({
          title: '请先登录',
          icon: 'none',
          duration: 1500,
        });
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/mine/index' });
        }, 1500);
        return Promise.reject(apiRes);
      }
      if (apiRes.code === ErrorCode.UNAUTHORIZED) {
        handleUnauthorized();
      } else if (needShowError) {
        showError(apiRes.msg || '请求失败');
      }
      return Promise.reject(apiRes);
    }

    return apiRes.data;
  } catch (err: any) {
    // 网络异常 / 超时 — 用 Modal 强提示（finally 会关闭 loading）
    const isTimeout = err?.errMsg?.includes('timeout');
    const msg = isTimeout ? '网络请求超时，请检查网络后重试' : '网络连接异常，请检查网络后重试';
    if (needShowError) await showNetworkModal('网络异常', msg);
    return Promise.reject({
      code: isTimeout ? ErrorCode.TIMEOUT : ErrorCode.NETWORK_ERROR,
      message: msg,
    });
  } finally {
    if (needLoading) hideLoading();
  }
}
