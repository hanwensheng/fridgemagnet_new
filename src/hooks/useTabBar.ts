import { useEffect } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';

/** 原生 tabBar 组件实例（微信 getTabBar() 的返回值） */
type TabBarInstance = {
  setData?: (data: { selected: number }) => void;
};

type PageWithTabBar = {
  getTabBar?: () => TabBarInstance | null;
};

/**
 * 同步 TabBar 选中态（每个 TabBar 页面的顶层调用）
 *
 * 小程序端：走微信官方机制 —— 拿到 tabBar **原生组件实例**后直接 setData，
 * 不经过 Taro 的 React 渲染层。历史上"图标高亮不刷新/点了没反应"的
 * 根因就在那一层（JS 状态全对、画面不动），所以这里刻意绕开它。
 *
 * H5 端：没有原生 tabBar，仍用事件广播驱动 React 版 TabBar 组件。
 *
 * @param index Tab 索引，首页为 0，我的为 1
 */
export function useTabBar(index: number) {
  useDidShow(() => {
    if (process.env.TARO_ENV === 'weapp') {
      const page = Taro.getCurrentInstance().page as unknown as PageWithTabBar | undefined;
      const tabBar = typeof page?.getTabBar === 'function' ? page.getTabBar() : null;
      tabBar?.setData?.({ selected: index });
      return;
    }
    Taro.eventCenter.trigger('tabbar:change', index);
  });

  useEffect(() => {
    if (process.env.TARO_ENV === 'h5') {
      Taro.eventCenter.trigger('tabbar:change', index);
    }
  }, [index]);
}
