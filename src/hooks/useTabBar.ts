import { useEffect } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';

/**
 * 设置当前 TabBar 选中态
 * 每个 TabBar 页面必须在组件顶层调用此 Hook
 *
 * @param index Tab 索引，首页为 0，我的为 1
 */
export function useTabBar(index: number) {
  useDidShow(() => {
    Taro.eventCenter.trigger('tabbar:change', index);
  });

  useEffect(() => {
    if (process.env.TARO_ENV === 'h5') {
      Taro.eventCenter.trigger('tabbar:change', index);
    }
  }, [index]);
}
