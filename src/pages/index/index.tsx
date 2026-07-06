import { View, Image } from '@tarojs/components';
import Taro, { ENV_TYPE, useDidHide } from '@tarojs/taro';
import { useState, useEffect, useMemo } from 'react';
import BasePage from '@/components/base-page';
import SpecSelectPopup, { SelectedSpec } from '@/components/spec-select-popup';
import { useTabBar } from '@/hooks/useTabBar';
import logoIcon from '@/assets/svgs/icon_logo_black.svg';
import HomeBg from '@/assets/images/home_bg.png';
import HomeImg0 from '@/assets/images/home_img0.png';
import './index.scss';

export default function Index() {
  useTabBar(0);
  const [popupVisible, setPopupVisible] = useState(false);

  const systemInfo = Taro.getSystemInfoSync();
  const statusBarHeight = systemInfo.statusBarHeight || 0;

  // 与 BaseNavBar 完全相同的导航栏高度计算
  const menuButtonInfo = useMemo(() => {
    if (Taro.getEnv() !== ENV_TYPE.WEAPP) {
      return { top: statusBarHeight + 4, height: 32 };
    }
    try {
      return Taro.getMenuButtonBoundingClientRect();
    } catch {
      return { top: statusBarHeight + 4, height: 32 };
    }
  }, [statusBarHeight]);

  const navBarHeight = useMemo(() => {
    const gap = menuButtonInfo.top - statusBarHeight;
    return statusBarHeight + menuButtonInfo.height + gap * 2;
  }, [statusBarHeight, menuButtonInfo]);

  // 调试：在开发者工具控制台看实际高度值
  console.log('statusBarHeight:', statusBarHeight);
  console.log('navBarHeight:', navBarHeight);

  const showTabBar = () => {
    Taro.eventCenter.trigger('tabbar:show');
  };

  const hideTabBar = () => {
    Taro.eventCenter.trigger('tabbar:hide');
  };

  const handleMakeClick = () => {
    hideTabBar();
    setPopupVisible(true);
  };

  const handlePopupClose = () => {
    showTabBar();
    setPopupVisible(false);
  };

  // 组件卸载时恢复 TabBar（防止弹窗打开时页面被切走导致 TabBar 一直隐藏）
  useEffect(() => {
    return () => {
      showTabBar();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useDidHide(() => {
    showTabBar();
  });

  const handleConfirm = (selectedItems: SelectedSpec[]) => {
    console.log('selected specs:', selectedItems);
    Taro.showToast({
      title: `已选 ${selectedItems.reduce((sum, item) => sum + item.quantity, 0)} 件`,
      icon: 'none',
    });
  };

  return (
    <BasePage navShowBack={false} navTitle='冰箱贴上爱' navTitleIcon={logoIcon}>
      <View className='flex-col overflow-hidden home-box'>
        <Image src={HomeBg} className='home-bg' mode='widthFix' />
        <View className='home-title-box' style={{ top: `${navBarHeight + 60}px` }}>
          <View className='home-title'>传自己的照片</View>
          <View className='home-subtitle'>定制冰箱贴</View>
        </View>
      </View>
      <Image src={HomeImg0} className='home-img0' mode='widthFix' />
      <View className='home-btn' onClick={handleMakeClick}>
        开始制作
      </View>
      <SpecSelectPopup
        visible={popupVisible}
        onClose={handlePopupClose}
        onConfirm={handleConfirm}
      />
    </BasePage>
  );
}
