import { View, Text } from '@tarojs/components';
import { Button } from '@nutui/nutui-react-taro';
import { useCounterStore } from '@/store/useCounterStore';

export default function Index() {
  const { count, increment, decrement, reset } = useCounterStore();
  return (
    <View className='flex flex-col items-center justify-center h-screen bg-gray-100 p-4'>
      <Text className='text-2xl font-bold text-blue-600 mb-4'>Count: {count}</Text>
      <View className='flex gap-4'>
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
    </View>
  );
}
