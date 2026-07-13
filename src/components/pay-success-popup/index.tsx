import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Popup } from '@nutui/nutui-react-taro';
import { useEffect, useState } from 'react';
import IconLocation from '@/assets/svgs/icon_car.svg';
import type { AddressItem } from '@/api/modules/address';

import './index.scss';

interface PaySuccessPopupProps {
  visible: boolean;
  onClose: () => void;
  address: AddressItem | null;
  productImage: string;
}

const COUNTDOWN_SECONDS = 5;

export default function PaySuccessPopup({
  visible,
  onClose,
  address,
  productImage,
}: PaySuccessPopupProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (!visible) {
      setCountdown(COUNTDOWN_SECONDS);
      return;
    }

    setCountdown(COUNTDOWN_SECONDS);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          Taro.switchTab({ url: '/pages/index/index' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible]);

  const handleBackHome = () => {
    onClose();
    Taro.switchTab({ url: '/pages/index/index' });
  };

  const handleViewOrder = () => {
    onClose();
    Taro.navigateTo({ url: '/pages/my-orders/index' });
  };

  const addressText = address
    ? `${address.province}${address.city}${address.district}${address.detailAddress}`
    : '';

  return (
    <Popup
      visible={visible}
      position='bottom'
      onClose={onClose}
      closeOnOverlayClick={false}
      round
      closeable={false}
      className='pay-success-popup'
      style={{ backgroundColor: '#f6f6f6' }}
      zIndex={1000}
    >
      <View className='pay-success-content'>
        <View className='pay-success-header'>
          <Text className='pay-success-title'>支付成功</Text>
          <Text className='pay-success-subtitle'>已成功排期制作</Text>
        </View>

        <View className='pay-success-card'>
          <Image className='pay-success-image' src={productImage} mode='aspectFill' />
          <View className='pay-success-info'>
            <Text className='pay-success-delivery'>预计明早发货</Text>
            {addressText && (
              <View className='pay-success-address'>
                <Image className='pay-success-address-icon' src={IconLocation} />
                <Text className='pay-success-address-text'>{addressText}</Text>
              </View>
            )}
          </View>
          <View className='pay-success-view-btn' onClick={handleViewOrder}>
            <Text className='pay-success-view-text'>查看订单</Text>
          </View>
        </View>

        <Text className='pay-success-countdown'>
          当前页面将在 <Text className='pay-success-countdown-num'>{countdown}</Text> 秒后关闭
        </Text>

        <View
          className='pay-success-home-btn'
          onClick={handleBackHome}
          style={{ marginBottom: 'max(env(safe-area-inset-bottom), 34px)' }}
        >
          <Text className='pay-success-home-text'>返回首页</Text>
        </View>
      </View>
    </Popup>
  );
}
