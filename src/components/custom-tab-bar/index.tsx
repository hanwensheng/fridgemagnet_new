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

/** 页面栈顶对应的 tab 下标；-1 表示栈顶不是 TabBar 页 */
function getRouteTabIndex() {
  const route = Taro.getCurrentPages().slice(-1)[0]?.route;
  return TABS.findIndex((t) => t.pagePath === `/${route}`);
}

export default function CustomTabBar() {
  /**
   * 选中态：两端都由各 TabBar 页 `useTabBar` 在 useDidShow 时广播的 `tabbar:change` 驱动。
   * 首屏按页面栈取一次初值（不能写死 0：直接落在「我的」时也得对）。
   */
  const [selected, setSelected] = useState(() => Math.max(getRouteTabIndex(), 0));
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handler = (index: number) => setSelected(index);
    Taro.eventCenter.on('tabbar:change', handler);
    return () => {
      Taro.eventCenter.off('tabbar:change', handler);
    };
  }, []);

  /**
   * 小程序端：挂载后再按页面栈校正一次选中态。
   *
   * 框架 `switchTab`（如「未登录」拦截弹窗点确定跳「我的」）时，tabbar 可能早于目标页 onShow 挂载，
   * 那一次 `tabbar:change` 广播就漏掉了 —— 表现是页面已经跳到「我的」、图标还停在「首页」，
   * 且因为 `switchTab` 里 `index === selected` 会直接 return，两个 tab 都点不动（卡死）。
   * H5 端不校正：那边 getCurrentPages 的时机不可靠（路由以 hash 为准）。
   */
  useEffect(() => {
    if (process.env.TARO_ENV !== 'weapp') return;
    const index = getRouteTabIndex();
    if (index >= 0) setSelected(index);
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

  const switchTab = useCallback(
    (index: number) => {
      if (index === selected) return;
      Taro.switchTab({ url: TABS[index].pagePath });
    },
    [selected],
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
              src={selected === index ? tab.activeIcon : tab.icon}
              mode='aspectFit'
            />
          </View>
        ))}
      </View>
    </View>
  );
}
