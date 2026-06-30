import { useState, useEffect, useCallback } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { View, Image } from '@tarojs/components';
import HomeIcon from '@/assets/tabbar/home.svg';
import HomeActiveIcon from '@/assets/tabbar/home_active.svg';
import MineIcon from '@/assets/tabbar/mine.svg';
import MineActiveIcon from '@/assets/tabbar/mine_active.svg';
import './index.scss';

const TABS = [
  { pagePath: '/pages/index/index', icon: HomeIcon, activeIcon: HomeActiveIcon },
  { pagePath: '/pages/mine/index', icon: MineIcon, activeIcon: MineActiveIcon },
];

const ICON_SIZE = 20;

export default function CustomTabBar() {
  const [selected, setSelected] = useState(0);

  const updateSelected = useCallback(() => {
    const instance = Taro.getCurrentInstance();
    const path = instance?.router?.path || '';
    const fullPath = path.startsWith('/') ? path : `/${path}`;
    const index = TABS.findIndex((tab) => tab.pagePath === fullPath);
    if (index !== -1) setSelected(index);
  }, []);

  // 只在小程序端监听 tabbar:change 事件
  useEffect(() => {
    const handler = (index: number) => setSelected(index);
    Taro.eventCenter.on('tabbar:change', handler);
    return () => {
      Taro.eventCenter.off('tabbar:change', handler);
    };
  }, []);

  // 仅小程序端使用 useDidShow 更新选中态
  useDidShow(() => {
    if (process.env.TARO_ENV === 'weapp') {
      updateSelected();
    }
  });

  const switchTab = (index: number) => {
    if (index === selected) return;
    Taro.switchTab({ url: TABS[index].pagePath });
  };

  return (
    <View className='custom-tab-bar' style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <View
        className='custom-tab-bar__capsule'
        style={process.env.TARO_ENV === 'h5' ? { marginBottom: '38px' } : undefined}
      >
        {TABS.map((tab, index) => (
          <View
            key={tab.pagePath}
            className='custom-tab-bar__item'
            onClick={() => switchTab(index)}
          >
            <Image
              className='custom-tab-bar__icon'
              style={{ width: `${ICON_SIZE}px`, height: `${ICON_SIZE}px` }}
              src={selected === index ? tab.activeIcon : tab.icon}
              mode='aspectFit'
            />
          </View>
        ))}
      </View>
    </View>
  );
}
