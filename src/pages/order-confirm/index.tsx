import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useMemo, useState } from 'react';
import BasePage from '@/components/base-page';
import PaySuccessPopup from '@/components/pay-success-popup';
import CouponDetailPopup from '@/components/coupon-detail-popup';
import IconBack from '@/assets/svgs/icon_back.svg';
import IconRight from '@/assets/svgs/icon_right2.svg';
import IconSingle from '@/assets/svgs/icon_single.svg';
import IconGroup from '@/assets/svgs/icon_group.svg';
import ProductImg from '@/assets/images/8.5_4cm.png';
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

interface AddressInfo {
  name: string;
  phone: string;
  address: string;
}

const MOCK_ADDRESS: AddressInfo = {
  name: '三金',
  phone: '158****3663',
  address: '辽宁省大连市甘井子区革贞普街道万科c翡翠四季7栋901',
};

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

const ORDER_NO = 'P511000488';
const ORDER_TIME = '2026-06-27 11:04:53';

export default function OrderConfirm() {
  const [payPopupVisible, setPayPopupVisible] = useState(false);
  const [couponPopupVisible, setCouponPopupVisible] = useState(false);

  const totalCount = useMemo(() => MOCK_ITEMS.reduce((sum, item) => sum + item.quantity, 0), []);

  const totalPrice = useMemo(
    () => MOCK_ITEMS.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [],
  );

  const totalDiscount = useMemo(
    () => MOCK_ITEMS.reduce((sum, item) => sum + item.discountAmount * item.quantity, 0),
    [],
  );

  const isGroup = MOCK_ITEMS.length > 1;

  const handleAddressClick = () => {
    Taro.navigateTo({ url: '/pages/address/index' });
  };

  const handleCopyOrderNo = () => {
    Taro.setClipboardData({ data: ORDER_NO });
  };

  const handlePay = () => {
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
      backgroundColor='#f6f6f6'
      navShowBack={false}
      navLeftComponent={
        <View className='order-nav-back'>
          <Image className='order-nav-back-icon' src={IconBack} />
        </View>
      }
      onNavLeftClick={() => Taro.navigateBack().catch(() => {})}
      bottomBarHeight={108}
      safeAreaBackgroundColor='#f6f6f6'
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
                    src={IconRight}
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
          <View className='order-address-main'>
            <Text className='order-address-text'>{MOCK_ADDRESS.address}</Text>
            <View className='order-address-user'>
              <Text className='order-address-name'>{MOCK_ADDRESS.name}</Text>
              <Text className='order-address-phone'>{MOCK_ADDRESS.phone}</Text>
            </View>
          </View>
          <Image className='order-address-arrow' src={IconRight} />
        </View>

        {/* 订单商品卡片 */}
        {MOCK_ITEMS.map((item) => (
          <View key={item.id} className='order-item-card'>
            <View className='order-item-header'>
              <Image className='order-item-type-icon' src={isGroup ? IconGroup : IconSingle} />
              <Text className='order-item-type-text'>{isGroup ? '组合' : '单品'}</Text>
            </View>
            <View className='order-item-body'>
              <Image className='order-item-image' src={item.image} mode='aspectFill' />
              <View className='order-item-info'>
                <Text className='order-item-name'>{item.name}</Text>
                <Text className='order-item-spec'>{item.spec}</Text>
                <Text className='order-item-count'>共 {item.quantity} 件</Text>
              </View>
            </View>
            <View className='order-item-row'>
              <Text className='order-item-row-label'>实付款</Text>
              <Text className='order-item-row-value'>
                ¥ {(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
            <View className='order-item-row'>
              <Text className='order-item-row-label'>运费</Text>
              <Text className='order-item-row-value'>¥ 0</Text>
            </View>
            <View className='order-item-row'>
              <Text className='order-item-row-label'>订单编号</Text>
              <View className='order-item-row-right'>
                <Text className='order-item-row-value order-item-row-value--gray'>
                  {ORDER_NO} ｜
                </Text>
                <Text className='order-item-row-copy' onClick={handleCopyOrderNo}>
                  复制
                </Text>
              </View>
            </View>
            <View className='order-item-row'>
              <Text className='order-item-row-label'>下单时间</Text>
              <Text className='order-item-row-value order-item-row-value--gray'>{ORDER_TIME}</Text>
            </View>
          </View>
        ))}

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
