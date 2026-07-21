import { useState, useEffect, useCallback } from 'react';
import Taro from '@tarojs/taro';
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

interface CustomTabBarProps {
  /** 小程序端：微信框架自动注入当前选中 Tab 索引 */
  selected?: number;
}

export default function CustomTabBar(props: CustomTabBarProps) {
  // H5 端：由各页面 useTabBar 的 tabbar:change 事件驱动选中态
  const [selected, setSelected] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handler = (index: number) => setSelected(index);
    Taro.eventCenter.on('tabbar:change', handler);
    return () => {
      Taro.eventCenter.off('tabbar:change', handler);
    };
  }, []);

  // H5 端：根据当前路由自动控制 tabbar 显隐，仅 tab 页面显示
  useEffect(() => {
    if (process.env.TARO_ENV !== 'h5') return;

    const checkRoute = () => {
      const pages = Taro.getCurrentPages();
      const route = pages.length > 0 ? pages[pages.length - 1].route : '';
      const isTabPage = TABS.some((t) => t.pagePath === `/${route}`);
      setHidden(!isTabPage);
    };

    checkRoute();
    window.addEventListener('hashchange', checkRoute);
    return () => {
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  useEffect(() => {
    const handleShow = () => setHidden(false);
    const handleHide = () => setHidden(true);
    Taro.eventCenter.on('tabbar:show', handleShow);
    Taro.eventCenter.on('tabbar:hide', handleHide);
    return () => {
      Taro.eventCenter.off('tabbar:show', handleShow);
      Taro.eventCenter.off('tabbar:hide', handleHide);
    };
  }, []);

  // 小程序端：优先使用微信框架注入的 selected，否则用 getCurrentPages 兜底
  // H5 端：selected 来自 state（tabbar:change 事件驱动）
  const currentIndex =
    process.env.TARO_ENV === 'weapp'
      ? (props.selected ??
        Math.max(
          TABS.findIndex((t) => t.pagePath === `/${Taro.getCurrentPages().slice(-1)[0]?.route}`),
          0,
        ))
      : selected;

  const switchTab = useCallback(
    (index: number) => {
      if (index === currentIndex) return;
      Taro.switchTab({ url: TABS[index].pagePath });
    },
    [currentIndex],
  );

  if (hidden) return null;

  return (
    <View
      className='custom-tab-bar'
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 34px)' }}
    >
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
              src={currentIndex === index ? tab.activeIcon : tab.icon}
              mode='aspectFit'
            />
          </View>
        ))}
      </View>
    </View>
  );
}
