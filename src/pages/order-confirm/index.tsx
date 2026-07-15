import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import BasePage from '@/components/base-page';
import PaySuccessPopup from '@/components/pay-success-popup';
import CouponDetailPopup from '@/components/coupon-detail-popup';
import IconRight from '@/assets/svgs/icon_right2.svg';
import IconRedUp from '@/assets/svgs/icon_red_up.svg';
import IconAddAddress from '@/assets/svgs/icon_add_addres.svg';
import IconSingle from '@/assets/svgs/icon_single.svg';
import { useOrderConfirmLogic } from './index.logic';
import './index.scss';

export default function OrderConfirm() {
  const {
    address,
    orderItems,
    totalCount,
    totalPrice,
    totalDiscount,
    originalTotal,
    finalTotal,
    isGroup,
    shippingFee,
    payPopupVisible,
    couponPopupVisible,
    handleAddressClick,
    handlePay,
    toggleCouponPopup,
    closePayPopup,
    closeCouponPopup,
  } = useOrderConfirmLogic();

  return (
    <BasePage
      navTitle='确认订单'
      onNavLeftClick={() => Taro.navigateBack().catch(() => {})}
      bottomBarComponent={
        <View className='order-bottom-bar'>
          <View className='order-total'>
            <View className='order-total-row'>
              <Text className='order-total-label'>总计</Text>
              <Text className='order-total-price'>¥ {finalTotal.toFixed(2)}</Text>
            </View>
            <View className='order-total-row'>
              <Text className='order-total-count'>共 {totalCount} 件</Text>
              {isGroup && (
                <View className='order-coupon-entry' onClick={toggleCouponPopup}>
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
        {orderItems.map((item) => (
          <View key={item.id} className='order-item-card'>
            <View className='order-item-header'>
              <View className='order-item-type'>
                <Image className='order-item-type-icon' src={IconSingle} />
                <Text className='order-item-type-text'>单品</Text>
              </View>
            </View>
            <View className='order-item-body'>
              <Image className='order-item-image' src={item.image} mode='aspectFill' />
              <View className='order-item-info'>
                <Text className='order-item-name'>{item.name}</Text>
                <Text className='order-item-spec'>{item.spec}</Text>
                <Text className='order-item-count'>共 {item.quantity} 件</Text>
              </View>
              <Text className='order-item-price'>¥{item.price.toFixed(2)}</Text>
            </View>
          </View>
        ))}

        {/* 费用汇总卡片 */}
        <View className='order-summary-card'>
          <View className='order-summary-row'>
            <Text className='order-summary-label'>总计</Text>
            <Text className='order-summary-value'>¥ {originalTotal.toFixed(2)}</Text>
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

      <PaySuccessPopup
        visible={payPopupVisible}
        onClose={closePayPopup}
        address={address}
        productImage={orderItems[0]?.image || ''}
      />
      <CouponDetailPopup
        visible={couponPopupVisible}
        items={orderItems}
        totalPrice={totalPrice}
        totalDiscount={totalDiscount}
        totalCount={totalCount}
        onClose={closeCouponPopup}
        onPay={handlePay}
      />
    </BasePage>
  );
}
