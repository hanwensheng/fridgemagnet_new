import Taro from '@tarojs/taro';

/** 切换到 tabBar 页，switchTab 失败时兜底 reLaunch */
function goTab(url: string) {
  Taro.switchTab({ url }).catch(() => {
    Taro.reLaunch({ url }).catch(() => {});
  });
}

/**
 * 返回上一页
 *
 * 当页面是栈底（微信订单中心 path 直达、reLaunch 落地等无历史入口）时，
 * navigateBack 必然失败，此时改为跳到 fallbackTab。
 * 不依赖路由参数，靠运行时页面栈深度判断。
 */
export function goBackOrTab(fallbackTab = '/pages/index/index') {
  const stack = Taro.getCurrentPages() ?? [];
  if (stack.length > 1) {
    Taro.navigateBack().catch(() => goTab(fallbackTab));
    return;
  }
  goTab(fallbackTab);
}
