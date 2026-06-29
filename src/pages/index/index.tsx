import { View, Text } from '@tarojs/components';
import { Button } from '@nutui/nutui-react-taro';
import { useLoad } from '@tarojs/taro';
import './index.scss';

export default function Index() {
  useLoad(() => {
    console.log('Page loaded.');
  });

  return (
    <View className='flex items-center justify-center h-screen bg-gray-100'>
      <Text>Hello Taro!</Text>
      <Button type='primary'>测试</Button>
    </View>
  );
}
