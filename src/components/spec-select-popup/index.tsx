import { View, Text, Image, Button } from '@tarojs/components';
import { Popup } from '@nutui/nutui-react-taro';
import { useEffect, useMemo, useState, useCallback } from 'react';
import Taro from '@tarojs/taro';
import CloseIcon from '@/assets/svgs/icon_popup_close.svg';
import RadioActiveIcon from '@/assets/svgs/icon_radio_active.svg';
import RadioIcon from '@/assets/svgs/icon_radio.svg';
import IconAdd from '@/assets/svgs/icon_add.svg';
import IconSub from '@/assets/svgs/icon_sub.svg';
import IconSubDisable from '@/assets/svgs/icon_sub_disable.svg';
import Img85 from '@/assets/images/8.5_4cm.png';
import Img75 from '@/assets/images/7_5.5cm.png';
import Img45 from '@/assets/images/4.5_3cm.png';
import { productApi } from '@/api/modules/product';
import { orderApi, type PriceInfo } from '@/api/modules/order';
import { useAppStore } from '@/store';
import { userApi } from '@/api/modules/user';
import { formatSizeLabel } from '@/utils/format';

import './index.scss';

export interface SelectedSpec {
  id: string;
  name: string;
  price: number;
  quantity: number;
  intro: string;
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

/** 尺寸 -> 本地预览图映射（宽x高，mm） */
const LOCAL_IMAGE_MAP: Record<string, string> = {
  '85x40': Img85,
  '55x70': Img75,
  '30x45': Img45,
};

function getLocalImage(width: string, height: string): string {
  const key = `${parseFloat(width)}x${parseFloat(height)}`;
  return LOCAL_IMAGE_MAP[key] || Img85;
}

function buildPriceText(priceInfo: PriceInfo | null): string {
  if (!priceInfo) return '';
  const second = priceInfo.secondPrice || '--';
  const other = priceInfo.otherPrice || '--';
  return `第2件${second}元，第3件起均${other}元（2件包邮）`;
}

export default function SpecSelectPopup({ visible, onClose, onConfirm }: SpecSelectPopupProps) {
  const [items, setItems] = useState<SpecItemState[]>([]);
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);

  const token = useAppStore((s) => s.token);
  const setToken = useAppStore((s) => s.setToken);
  const setUserInfo = useAppStore((s) => s.setUserInfo);
  const isLoggedIn = !!token;

  // 每次打开抽屉时重置选中状态和步进器
  useEffect(() => {
    if (visible) {
      setItems((prev) => prev.map((item) => ({ ...item, selected: false, quantity: 1 })));
    }
  }, [visible]);

  useEffect(() => {
    productApi.getGoodsList().then((goodsList) => {
      const specItems: SpecItemState[] = goodsList.map((goods) => ({
        id: goods.pkId,
        name: formatSizeLabel(goods.width, goods.height),
        desc: goods.intro,
        price: goods.price,
        image: goods.goodsImg || getLocalImage(goods.width, goods.height),
        selected: false,
        quantity: 1,
      }));
      setItems(specItems);
    });
  }, []);

  useEffect(() => {
    orderApi
      .getPrice()
      .then(setPriceInfo)
      .catch(() => {});
  }, []);

  const totalCount = useMemo(
    () => items.reduce((sum, item) => (item.selected ? sum + item.quantity : sum), 0),
    [items],
  );

  const selectedItems = useMemo(
    () =>
      items
        .filter((item) => item.selected)
        .map(({ id, name, quantity, desc: intro }) => ({
          id,
          name,
          price: Number(priceInfo?.firstPrice || 0),
          quantity,
          intro,
        })),
    [items, priceInfo],
  );

  // const safeAreaBottom = useMemo(() => {
  //   if (process.env.TARO_ENV !== 'weapp') {
  //     return 0;
  //   }
  //   const systemInfo = Taro.getSystemInfoSync();
  //   if (!systemInfo.safeArea) {
  //     return 0;
  //   }
  //   const bottom = systemInfo.screenHeight - systemInfo.safeArea.bottom;
  //   return bottom > 0 ? bottom : 0;
  // }, []);

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

  const handleLogin = useCallback(
    async (e: any) => {
      if (process.env.TARO_ENV !== 'weapp') {
        Taro.showToast({ title: '请使用微信小程序登录', icon: 'none' });
        return;
      }

      if (e.detail.errMsg !== 'getPhoneNumber:ok') {
        Taro.showToast({ title: '您已拒绝授权', icon: 'none' });
        return;
      }

      if (selectedItems.length === 0) {
        Taro.showToast({ title: '请至少选择一个规格', icon: 'none' });
        return;
      }

      const phoneCode = e.detail.code;
      Taro.showLoading({ title: '登录中...' });

      try {
        const loginRes = await Taro.login();
        const res = await userApi.miniProgramLogin({
          loginCode: loginRes.code,
          phoneCode,
        });

        if (res.token) {
          Taro.setStorageSync('token', res.token);
          Taro.setStorageSync('userInfo', JSON.stringify(res));
          setToken(res.token);
          setUserInfo(res);
          onConfirm?.(selectedItems);
        } else {
          Taro.showToast({ title: '登录失败', icon: 'none' });
        }
      } catch {
        Taro.showToast({ title: '登录失败，请重试', icon: 'none' });
      } finally {
        Taro.hideLoading();
      }
    },
    [selectedItems, onConfirm, setToken, setUserInfo],
  );

  const handleConfirm = () => {
    if (selectedItems.length === 0) {
      Taro.showToast({ title: '请至少选择一个规格', icon: 'none' });
      return;
    }
    onConfirm?.(selectedItems);
  };

  return (
    <>
      {/* 自定义遮罩：始终存在于 DOM 中，仅通过 opacity 控制显示/隐藏，避免 DOM 增删导致的闪烁 */}
      <View
        className='fixed inset-0'
        style={{
          zIndex: 1001,
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
          transition: 'opacity 0.3s',
        }}
        onClick={onClose}
      />
      <Popup
        visible={visible}
        position='bottom'
        onClose={onClose}
        round
        closeable
        overlay={false}
        closeIcon={<Image src={CloseIcon} className='h-[16px] w-[16px]' />}
        className='spec-select-popup'
        style={{ backgroundColor: '#f6f6f6' }}
        zIndex={1002}
      >
        <View className='px-[12px] pt-[56px]'>
          <View className='flex flex-col gap-[12px]'>
            {items.map((item, index) => (
              <View
                key={item.id}
                className={`flex flex-row items-center rounded-[24px] bg-white px-[16px] py-[20px] border-[4px] border-solid box-border w-[351px] h-[143px] ${item.selected ? 'border-[rgba(0,0,0,0.10)]' : 'border-transparent'}`}
                onClick={() => toggleSelected(index)}
              >
                <View className='flex flex-col items-center'>
                  <Image src={item.image} mode='aspectFit' className='h-[88px] w-[88px]' />
                  <Text className='text-sm text-black leading-[15px]'>
                    {item.name.replace('cm', ' cm')}
                  </Text>
                </View>
                <View className='ml-[16px] flex flex-1 flex-col justify-center w-[183px]'>
                  <Text className='text-sm text-black leading-[15px] font-[500]'>{item.desc}</Text>
                  <View className='flex items-center justify-between mt-[16px]'>
                    <Text className='text-sm text-black/40 leading-[18px]'>
                      ¥{parseFloat(priceInfo?.firstPrice || '0').toFixed(2)}
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
            {buildPriceText(priceInfo)}
          </View>

          {isLoggedIn ? (
            <View
              className='flex h-[56px] items-center justify-center rounded-full bg-[#1c1c1e]'
              style={{ marginBottom: 'max(env(safe-area-inset-bottom), 34px)' }}
              onClick={handleConfirm}
            >
              <Text className='text-base font-bold text-white'>共 {totalCount} 件 去制作</Text>
            </View>
          ) : (
            <Button
              className='flex h-[56px] w-full items-center justify-center rounded-full bg-[#1c1c1e] !border-none !p-0'
              style={{ marginBottom: 'max(env(safe-area-inset-bottom), 34px)' }}
              openType='getPhoneNumber'
              onGetPhoneNumber={handleLogin}
            >
              <Text className='text-base font-bold text-white'>共 {totalCount} 件 去制作</Text>
            </Button>
          )}

          {/* {safeAreaBottom > 0 && <View style={{ height: `${safeAreaBottom}px` }} />} */}
        </View>
      </Popup>
    </>
  );
}
