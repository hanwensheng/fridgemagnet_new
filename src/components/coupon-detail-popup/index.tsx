import { View, Text, Image, ScrollView } from '@tarojs/components';
import { Popup } from '@nutui/nutui-react-taro';
import IconClose from '@/assets/svgs/icon_popup_close.svg';
import IconRedUp from '@/assets/svgs/icon_red_up.svg';
import type { OrderItem } from '@/pages-sub/order-confirm/index.logic';

import './index.scss';

interface CouponDetailPopupProps {
  visible: boolean;
  items: OrderItem[];
  totalPrice: number;
  totalDiscount: number;
  totalCount: number;
  onClose: () => void;
  onPay: () => void;
}

export default function CouponDetailPopup({
  visible,
  items,
  totalPrice,
  totalDiscount,
  totalCount,
  onClose,
  onPay,
}: CouponDetailPopupProps) {
  return (
    <Popup
      visible={visible}
      position='bottom'
      onClose={onClose}
      round
      closeable={false}
      className='coupon-detail-popup'
      style={{ backgroundColor: '#f6f6f6' }}
      zIndex={1000}
    >
      <View className='coupon-detail-content'>
        <View className='coupon-detail-close' onClick={onClose}>
          <Image className='coupon-detail-close-icon' src={IconClose} />
        </View>

        <ScrollView className='coupon-detail-list' scrollY>
          {items.map((item) => (
            <View key={item.id} className='coupon-detail-item'>
              <Image className='coupon-detail-image' src={item.image} mode='aspectFill' />
              <View className='coupon-detail-info'>
                {item.discountTag ? (
                  <View className='coupon-detail-tag-row'>
                    <Text className='coupon-detail-tag'>{item.discountTag}</Text>
                  </View>
                ) : (
                  <Text className='coupon-detail-subtotal'>小计 ¥{item.price.toFixed(2)}</Text>
                )}
                {item.discountAmount > 0 && (
                  <Text className='coupon-detail-discount'>
                    小计 ¥{item.price.toFixed(2)}，减{item.discountAmount.toFixed(2)}元
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        <View
          className='coupon-detail-footer'
          style={{ marginBottom: 'max(env(safe-area-inset-bottom), 34px)' }}
        >
          <View className='coupon-detail-total'>
            <View className='coupon-detail-total-row'>
              <Text className='coupon-detail-total-label'>总计</Text>
              <Text className='coupon-detail-total-price'>¥ {totalPrice.toFixed(2)}</Text>
            </View>
            <View className='coupon-detail-total-row'>
              <Text className='coupon-detail-total-count'>共 {totalCount} 件</Text>
              <View className='coupon-detail-entry' onClick={onClose}>
                <Text className='coupon-detail-entry-text'>
                  优惠 ¥{totalDiscount.toFixed(2)} 明细
                </Text>
                <Image className='coupon-detail-entry-arrow' src={IconRedUp} />
              </View>
            </View>
          </View>
          <View
            className='coupon-detail-pay-btn'
            onClick={() => {
              onClose();
              onPay();
            }}
          >
            <Text className='coupon-detail-pay-text'>微信支付</Text>
          </View>
        </View>
      </View>
    </Popup>
  );
}
