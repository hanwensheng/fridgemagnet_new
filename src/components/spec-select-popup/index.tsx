import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Popup } from '@nutui/nutui-react-taro';
import { useMemo, useState } from 'react';

import CloseIcon from '@/assets/svgs/icon_popup_close.svg';
import RadioActiveIcon from '@/assets/svgs/icon_radio_active.svg';
import RadioIcon from '@/assets/svgs/icon_radio.svg';
import IconAdd from '@/assets/svgs/icon_add.svg';
import IconSub from '@/assets/svgs/icon_sub.svg';
import IconSubDisable from '@/assets/svgs/icon_sub_disable.svg';
import Img85 from '@/assets/images/8.5_4cm.png';
import Img75 from '@/assets/images/7_5.5cm.png';
import Img45 from '@/assets/images/4.5_3cm.png';

import './index.scss';

export interface SelectedSpec {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface SpecItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  image: string;
}

interface SpecItemState extends SpecItem {
  selected: boolean;
  quantity: number;
}

interface SpecSelectPopupProps {
  visible: boolean;
  onClose: () => void;
  onConfirm?: (selectedItems: SelectedSpec[]) => void;
}

const SPEC_LIST: SpecItem[] = [
  {
    id: '8.5x4',
    name: '8.5*4cm',
    desc: '适合做冰箱贴，可做桌面摆件',
    price: 39,
    image: Img85,
  },
  {
    id: '7x5.5',
    name: '7*5.5cm',
    desc: '适合做冰箱贴，可做桌面摆件',
    price: 35,
    image: Img75,
  },
  {
    id: '4.5x3',
    name: '4.5*3cm',
    desc: '适合做冰箱贴，可做桌面摆件',
    price: 29,
    image: Img45,
  },
];

export default function SpecSelectPopup({ visible, onClose, onConfirm }: SpecSelectPopupProps) {
  const [items, setItems] = useState<SpecItemState[]>(() =>
    SPEC_LIST.map((item) => ({ ...item, selected: item.id !== '4.5x3', quantity: 1 })),
  );

  const totalCount = useMemo(
    () => items.reduce((sum, item) => (item.selected ? sum + item.quantity : sum), 0),
    [items],
  );

  const selectedItems = useMemo(
    () =>
      items
        .filter((item) => item.selected)
        .map(({ id, name, price, quantity }) => ({ id, name, price, quantity })),
    [items],
  );

  const safeAreaBottom = useMemo(() => {
    if (process.env.TARO_ENV !== 'weapp') {
      return 0;
    }
    const systemInfo = Taro.getSystemInfoSync();
    if (!systemInfo.safeArea) {
      return 0;
    }
    const bottom = systemInfo.screenHeight - systemInfo.safeArea.bottom;
    return bottom > 0 ? bottom : 0;
  }, []);

  const toggleSelected = (index: number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], selected: !next[index].selected };
      return next;
    });
  };

  const changeQuantity = (index: number, delta: number) => {
    setItems((prev) => {
      const next = [...prev];
      const item = next[index];
      next[index] = { ...item, quantity: Math.max(1, item.quantity + delta) };
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm?.(selectedItems);
    onClose();
  };

  return (
    <Popup
      visible={visible}
      position='bottom'
      onClose={onClose}
      round
      closeable
      closeIcon={<Image src={CloseIcon} className='h-[16px] w-[16px]' />}
      className='spec-select-popup'
      style={{ backgroundColor: '#f6f6f6' }}
      zIndex={1000}
    >
      <View className='px-[12px] pb-[16px] pt-[56px]'>
        <View className='flex flex-col gap-[12px]'>
          {items.map((item, index) => (
            <View
              key={item.id}
              className={`flex flex-row items-center rounded-[24px] bg-white px-[16px] py-[20px] border-[4px] border-solid box-border w-[351px] h-[143px] ${item.selected ? 'border-[rgba(0,0,0,0.10)]' : 'border-transparent'}`}
              onClick={() => toggleSelected(index)}
            >
              <View className='flex flex-col items-center'>
                <Image src={item.image} mode='aspectFit' className='h-[88px] w-[88px]' />
                <Text className='text-sm text-black leading-[15px]'>{item.name}</Text>
              </View>
              <View className='ml-[16px] flex flex-1 flex-col justify-center w-[183px]'>
                <Text className='text-sm text-black leading-[15px] font-[500]'>{item.desc}</Text>
                <View className='flex items-center justify-between mt-[16px]'>
                  <Text className='text-sm text-black/40 leading-[18px]'>
                    ¥{item.price.toFixed(2)}
                  </Text>
                  <View
                    className='flex flex-row items-center rounded-full bg-[#F4F4F5] w-[74px] h-[24px]'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <View
                      className='flex h-[24px] w-[29px] items-center justify-center'
                      onClick={() => changeQuantity(index, -1)}
                    >
                      <Image
                        src={item.quantity <= 1 ? IconSubDisable : IconSub}
                        className='h-[22px] w-[13px]'
                      />
                    </View>
                    <Text className='w-[16px] text-center text-xs text-black font-[500]'>
                      {item.quantity}
                    </Text>
                    <View
                      className='flex h-[24px] w-[29px] items-center justify-center'
                      onClick={() => changeQuantity(index, 1)}
                    >
                      <Image src={IconAdd} className='h-[22px] w-[13px]' />
                    </View>
                  </View>
                </View>
              </View>
              <View className='ml-[16px]'>
                <Image
                  src={item.selected ? RadioActiveIcon : RadioIcon}
                  className='h-[16px] w-[16px]'
                />
              </View>
            </View>
          ))}
        </View>

        <View className='mb-[48px] mt-[20px] text-center text-xs text-[#945317]'>
          第2个8折，第3个6折，可自由组合（2个包邮）
        </View>

        <View
          className='flex h-[56px] items-center justify-center rounded-full bg-[#1c1c1e]'
          onClick={handleConfirm}
        >
          <Text className='text-base font-bold text-white'>共 {totalCount} 件 去制作</Text>
        </View>

        {safeAreaBottom > 0 && <View style={{ height: `${safeAreaBottom}px` }} />}
      </View>
    </Popup>
  );
}
