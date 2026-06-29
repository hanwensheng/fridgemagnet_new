import { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { Popup } from '@nutui/nutui-react-taro';

interface SpecItem {
  id: string;
  size: string;
  price: number;
  quantity: number;
  selected: boolean;
}

interface SpecDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const INITIAL_SPECS: SpecItem[] = [
  { id: '8.5*4', size: '8.5*4cm', price: 39, quantity: 1, selected: true },
  { id: '7*5.5', size: '7*5.5cm', price: 35, quantity: 2, selected: true },
  { id: '4.5*3', size: '4.5*3cm', price: 29, quantity: 1, selected: false },
];

export default function SpecDrawer({ visible, onClose }: SpecDrawerProps) {
  const [specs, setSpecs] = useState<SpecItem[]>(INITIAL_SPECS);

  const updateQuantity = (id: string, delta: number) => {
    setSpecs((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item,
      ),
    );
  };

  const toggleSelected = (id: string) => {
    setSpecs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)),
    );
  };

  const totalCount = specs
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Popup
      visible={visible}
      position='bottom'
      onClose={onClose}
      style={{ height: '70%' }}
      lockScroll
      destroyOnClose
      duration={0}
    >
      <View className='bg-[#f6f6f6] rounded-t-[32px] flex flex-col' style={{ height: '100%' }}>
        <View
          className='absolute top-3 right-3 w-8 h-8 flex items-center justify-center z-10'
          onClick={onClose}
        >
          <Text className='text-[#1c1c1e] text-2xl leading-none'>×</Text>
        </View>

        <ScrollView scrollY className='flex-1 pt-12 pb-36'>
          <View className='px-3 flex flex-col gap-3'>
            {specs.map((item) => (
              <View
                key={item.id}
                className={`bg-white rounded-2xl p-3 flex items-center gap-3 ${
                  item.selected ? 'border border-[#1c1c1e]' : ''
                }`}
              >
                <View className='w-[88px] h-[88px] rounded-[22px] border border-dashed border-[#1c1c1e] flex items-center justify-center shrink-0'>
                  <View className='w-[54px] h-[44px] border border-[#1c1c1e] rounded' />
                </View>

                <View className='flex-1 flex flex-col justify-between h-[88px] py-1'>
                  <View>
                    <Text className='text-sm font-medium text-black leading-[15px]'>
                      适合做冰箱贴，可做桌面摆件
                    </Text>
                    <Text className='text-sm text-black leading-[15px] mt-1'>{item.size}</Text>
                  </View>

                  <View className='flex items-center justify-between'>
                    <Text className='text-xs text-black/50 leading-[18px]'>
                      ¥ {item.price.toFixed(2)}
                    </Text>

                    <View className='flex items-center h-6 rounded overflow-hidden'>
                      <View
                        className='w-[29px] h-6 flex items-center justify-center bg-[rgba(116,116,128,0.08)] active:opacity-70'
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Text className='text-xs text-black/30'>-</Text>
                      </View>
                      <View className='w-4 h-6 flex items-center justify-center bg-[#f4f4f5]'>
                        <Text className='text-xs text-black'>{item.quantity}</Text>
                      </View>
                      <View
                        className='w-[29px] h-6 flex items-center justify-center bg-[rgba(116,116,128,0.08)] active:opacity-70'
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Text className='text-xs text-black'>+</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    item.selected ? 'bg-[#1c1c1e]' : 'border border-[#1c1c1e]/30'
                  }`}
                  onClick={() => toggleSelected(item.id)}
                >
                  {item.selected && <Text className='text-white text-xs'>✓</Text>}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View
          className='absolute left-0 right-0 bottom-0 px-3 pt-3 bg-[#f6f6f6]'
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <View className='h-[38px] rounded-full bg-[#fff2da] flex items-center justify-center'>
            <Text className='text-xs text-[#945317] leading-[22px]'>
              第2个8折，第3个6折，可自由组合（2个包邮）
            </Text>
          </View>

          <View className='mt-3 mb-3 h-14 rounded-full bg-[#1c1c1e] flex items-center justify-center active:opacity-90'>
            <Text className='text-base font-bold text-white leading-[18px]'>
              共 {totalCount} 件 去制作
            </Text>
          </View>
        </View>
      </View>
    </Popup>
  );
}
