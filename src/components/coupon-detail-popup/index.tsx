import { useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import { Popup } from '@nutui/nutui-react-taro';
import IconClose from '@/assets/svgs/icon_popup_close.svg';
import OrderTotalBar from '@/components/order-total-bar';
import type { OrderItem } from '@/pages-sub/order-confirm/index.logic';

import './index.scss';

/** 折扣说明文案（固定展示，不再逐件展示打折计算过程） */
const DISCOUNT_TIP = '订单≥2件商品第2件起享受8折优惠';

interface CouponDetailPopupProps {
  visible: boolean;
  items: OrderItem[];
  onClose: () => void;
  /** 底部区域：pay = 合计 + 微信支付（确认订单页，默认）；confirm = 单个确认按钮（订单详情页） */
  footerType?: 'pay' | 'confirm';
  /** footerType='pay' 时使用：底部「合计」金额，须与页面底栏一致（含运费） */
  totalAmount?: number;
  totalDiscount?: number;
  totalCount?: number;
  onPay?: () => void;
  /** footerType='confirm' 时的确认回调（点击后先关闭弹层） */
  onConfirm?: () => void;
}

export default function CouponDetailPopup({
  visible,
  items,
  onClose,
  footerType = 'pay',
  totalAmount = 0,
  totalDiscount = 0,
  totalCount = 0,
  onPay,
  onConfirm,
}: CouponDetailPopupProps) {
  // 原价商品排在第一个，其余打折商品按原顺序依次展示
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => Number(!!a.discountTag) - Number(!!b.discountTag)),
    [items],
  );

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
          {sortedItems.map((item, index) => (
            // 同一规格可能被下单多次（id 相同），用下标兜底保证 key 唯一
            <View key={`${item.id}-${index}`} className='coupon-detail-item'>
              <Image className='coupon-detail-image' src={item.image} mode='aspectFill' />
              <View className='coupon-detail-info'>
                {item.discountTag ? (
                  <View className='coupon-detail-tag-row'>
                    <Text className='coupon-detail-tag'>{DISCOUNT_TIP}</Text>
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

        {footerType === 'confirm' ? (
          <View
            className='coupon-detail-footer--confirm'
            style={{ marginBottom: 'max(env(safe-area-inset-bottom), 34px)' }}
          >
            <View
              className='coupon-detail-confirm-btn'
              onClick={() => {
                onClose();
                onConfirm?.();
              }}
            >
              <Text className='coupon-detail-confirm-text'>确认</Text>
            </View>
          </View>
        ) : (
          // 与确认订单页底栏共用同一份实现，合计金额直接透传，保证两处一致
          <OrderTotalBar
            className='coupon-detail-footer'
            style={{ marginBottom: 'max(env(safe-area-inset-bottom), 34px)' }}
            totalAmount={totalAmount}
            totalDiscount={totalDiscount}
            totalCount={totalCount}
            detailExpanded
            onDetailClick={onClose}
            onPay={() => {
              onClose();
              onPay?.();
            }}
          />
        )}
      </View>
    </Popup>
  );
}
