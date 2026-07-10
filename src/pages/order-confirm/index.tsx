import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, useUnload } from '@tarojs/taro';
import { useMemo, useRef, useState } from 'react';
import BasePage from '@/components/base-page';
import PaySuccessPopup from '@/components/pay-success-popup';
import CouponDetailPopup from '@/components/coupon-detail-popup';
import IconRight from '@/assets/svgs/icon_right2.svg';
import IconRedUp from '@/assets/svgs/icon_red_up.svg';
import IconAddAddress from '@/assets/svgs/icon_add_addres.svg';
import IconSingle from '@/assets/svgs/icon_single.svg';
import IconGroup from '@/assets/svgs/icon_group.svg';
import ProductImg from '@/assets/images/8.5_4cm.png';
import { addressApi } from '@/api/modules/address';
import type { AddressItem } from '@/api/modules/address';
import './index.scss';

export interface OrderItem {
  id: string;
  name: string;
  spec: string;
  quantity: number;
  price: number;
  originalPrice: number;
  discountAmount: number;
  discountTag?: string;
  image: string;
}

export const MOCK_ITEMS: OrderItem[] = [
  {
    id: '1',
    name: '威海布鲁斯号留念',
    spec: '4.5*3cm',
    quantity: 1,
    price: 49,
    originalPrice: 49,
    discountAmount: 0,
    image: ProductImg,
  },
  {
    id: '2',
    name: '威海布鲁斯号留念',
    spec: '4.5*3cm',
    quantity: 1,
    price: 20,
    originalPrice: 49,
    discountAmount: 29,
    discountTag: '第2件，20元',
    image: ProductImg,
  },
  {
    id: '3',
    name: '威海布鲁斯号留念',
    spec: '4.5*3cm',
    quantity: 1,
    price: 10,
    originalPrice: 49,
    discountAmount: 39,
    discountTag: '第3件，10元',
    image: ProductImg,
  },
];

export default function OrderConfirm() {
  const [payPopupVisible, setPayPopupVisible] = useState(false);
  const [couponPopupVisible, setCouponPopupVisible] = useState(false);
  const [address, setAddress] = useState<AddressItem | null>(null);

  const totalCount = useMemo(() => MOCK_ITEMS.reduce((sum, item) => sum + item.quantity, 0), []);

  const totalPrice = useMemo(
    () => MOCK_ITEMS.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [],
  );

  const totalDiscount = useMemo(
    () => MOCK_ITEMS.reduce((sum, item) => sum + item.discountAmount * item.quantity, 0),
    [],
  );

  const originalTotal = useMemo(
    () => MOCK_ITEMS.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0),
    [],
  );

  const shippingFee = 0;

  const isGroup = MOCK_ITEMS.length > 1;
  const mounted = useRef(false);

  useDidShow(() => {
    if (!mounted.current) {
      // 首次加载：清理可能的残留临时地址，只请求默认地址
      mounted.current = true;
      Taro.removeStorageSync('selectedAddress');
      addressApi
        .findDefault(false)
        .then((data) => {
          if (data) setAddress(data);
        })
        .catch(() => {});
      return;
    }

    // 从地址页返回：读取用户临时选择的地址
    try {
      const stored = Taro.getStorageSync('selectedAddress');
      if (stored) {
        setAddress(stored as AddressItem);
      }
    } catch {}
  });

  // 离开订单页时清理临时地址
  useUnload(() => {
    Taro.removeStorageSync('selectedAddress');
  });

  const handleAddressClick = () => {
    Taro.navigateTo({ url: '/pages/address/index?from=order-confirm' });
  };

  const handlePay = () => {
    if (!address) {
      Taro.showToast({ title: '请先添加地址', icon: 'none' });
      return;
    }
    setPayPopupVisible(true);
  };

  const handlePayPopupClose = () => {
    setPayPopupVisible(false);
  };

  const handleToggleCouponPopup = () => {
    setCouponPopupVisible((prev) => !prev);
  };

  return (
    <BasePage
      navTitle='确认订单'
      onNavLeftClick={() => Taro.navigateBack().catch(() => {})}
      bottomBarComponent={
        <View className='order-bottom-bar'>
          <View className='order-total'>
            <View className='order-total-row'>
              <Text className='order-total-label'>总计</Text>
              <Text className='order-total-price'>¥ {totalPrice.toFixed(2)}</Text>
            </View>
            <View className='order-total-row'>
              <Text className='order-total-count'>共 {totalCount} 件</Text>
              {totalDiscount > 0 && (
                <View className='order-coupon-entry' onClick={handleToggleCouponPopup}>
                  <Text className='order-coupon-text'>优惠 ¥{totalDiscount} 明细</Text>
                  <Image
                    className={`order-coupon-arrow ${couponPopupVisible ? 'order-coupon-arrow--up' : ''}`}
                    src={IconRedUp}
                  />
                </View>
              )}
            </View>
          </View>
          <View className='order-pay-btn' onClick={handlePay}>
            <Text className='order-pay-text'>微信支付</Text>
          </View>
        </View>
      }
    >
      <ScrollView className='order-page' scrollY>
        {/* 地址卡片 */}
        <View className='order-address-card' onClick={handleAddressClick}>
          {address ? (
            <>
              <View className='order-address-main'>
                <Text className='order-address-text'>
                  {address.province}
                  {address.city}
                  {address.district}
                  {address.detailAddress}
                </Text>
                <View className='order-address-user'>
                  <Text className='order-address-name'>{address.recipient}</Text>
                  <Text className='order-address-phone'>{address.recipientPhone}</Text>
                </View>
              </View>
              <Image className='order-address-arrow' src={IconRight} />
            </>
          ) : (
            <View className='order-add-address'>
              <Image className='order-add-address-icon' src={IconAddAddress} />
              <Text className='order-add-address-text'>添加地址</Text>
            </View>
          )}
        </View>

        {/* 订单商品卡片 */}
        {MOCK_ITEMS.map((item) => (
          <View key={item.id} className='order-item-card'>
            <View className='order-item-header'>
              <View className='order-item-type'>
                <Image className='order-item-type-icon' src={isGroup ? IconGroup : IconSingle} />
                <Text className='order-item-type-text'>{isGroup ? '组合' : '单品'}</Text>
              </View>
            </View>
            <View className='order-item-body'>
              <Image className='order-item-image' src={item.image} mode='aspectFill' />
              <View className='order-item-info'>
                <Text className='order-item-name'>{item.name}</Text>
                <Text className='order-item-spec'>{item.spec}</Text>
                <Text className='order-item-count'>共 {item.quantity} 件</Text>
              </View>
              <Text className='order-item-price'>¥{(item.price * item.quantity).toFixed(1)}</Text>
            </View>
          </View>
        ))}

        {/* 费用汇总卡片 */}
        <View className='order-summary-card'>
          <View className='order-summary-row'>
            <Text className='order-summary-label'>总计</Text>
            <Text className='order-summary-value'>¥ {originalTotal.toFixed(1)}</Text>
          </View>
          <View className='order-summary-row'>
            <Text className='order-summary-label'>运费</Text>
            <Text className='order-summary-value'>¥ {shippingFee}</Text>
          </View>
          <View className='order-summary-row'>
            <Text className='order-summary-label'>优惠</Text>
            <Text className='order-summary-value'>¥ {totalDiscount}</Text>
          </View>
        </View>

        <View className='order-safe-bottom' />
      </ScrollView>

      <PaySuccessPopup visible={payPopupVisible} onClose={handlePayPopupClose} />
      <CouponDetailPopup
        visible={couponPopupVisible}
        items={MOCK_ITEMS}
        totalPrice={totalPrice}
        totalDiscount={totalDiscount}
        totalCount={totalCount}
        onClose={() => setCouponPopupVisible(false)}
        onPay={handlePay}
      />
    </BasePage>
  );
}
