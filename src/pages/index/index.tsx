import { View, Text } from '@tarojs/components';
import Taro, { useDidHide } from '@tarojs/taro';
import { Button } from '@nutui/nutui-react-taro';
import { useState, useEffect } from 'react';
import { useCounterStore } from '@/store/useCounterStore';
import BasePage from '@/components/base-page';
import SpecSelectPopup, { SelectedSpec } from '@/components/spec-select-popup';
import { useTabBar } from '@/hooks/useTabBar';

export default function Index() {
  useTabBar(0);
  const { count, increment, decrement, reset } = useCounterStore();
  const [popupVisible, setPopupVisible] = useState(false);

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
    <BasePage navShowBack={false}>
      <View className='flex flex-col items-center justify-center h-screen bg-gray-100 p-4'>
        <Text className='text-2xl font-bold text-blue-600 mb-4'>Count: {count}</Text>
        <View className='flex gap-4 mb-4'>
          <Button type='primary' onClick={increment}>
            +
          </Button>
          <Button type='info' onClick={decrement}>
            -
          </Button>
          <Button type='default' onClick={reset}>
            Reset
          </Button>
        </View>
        <Button type='success' onClick={handleMakeClick}>
          开始制作
        </Button>
      </View>
      <SpecSelectPopup
        visible={popupVisible}
        onClose={handlePopupClose}
        onConfirm={handleConfirm}
      />
    </BasePage>
  );
}
