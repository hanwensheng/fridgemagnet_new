import { useState } from 'react';
import { View, Text } from '@tarojs/components';
import { Button } from '@nutui/nutui-react-taro';
import { useCounterStore } from '@/store/useCounterStore';
import SpecDrawer from '@components/SpecDrawer';
import BasePage from '@/components/base-page';
import { useTabBar } from '@/hooks/useTabBar';

export default function Index() {
  useTabBar(0);
  const { count, increment, decrement, reset } = useCounterStore();
  const [drawerVisible, setDrawerVisible] = useState(false);

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
        <Button type='success' onClick={() => setDrawerVisible(true)}>
          打开抽屉
        </Button>
        <SpecDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
      </View>
    </BasePage>
  );
}
