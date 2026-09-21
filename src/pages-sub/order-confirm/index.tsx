import { View, Text, Image } from '@tarojs/components';
import BasePage from '@/components/base-page';
import PaySuccessPopup from '@/components/pay-success-popup';
import CouponDetailPopup from '@/components/coupon-detail-popup';
import OrderTotalBar from '@/components/order-total-bar';
import IconRight from '@/assets/svgs/icon_right2.svg';
import IconAddAddress from '@/assets/svgs/icon_add_addres.svg';
import IconSingle from '@/assets/svgs/icon_single.svg';
import { useOrderConfirmLogic } from './index.logic';
import './index.scss';

export default function OrderConfirm() {
  const {
    address,
    orderItems,
    totalCount,
    totalDiscount,
    originalTotal,
    finalTotal,
    isGroup,
    shippingFee,
    deliveryInfo,
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
      bottomBarComponent={
        <OrderTotalBar
          totalAmount={finalTotal}
          totalDiscount={totalDiscount}
          totalCount={totalCount}
          showDetail={isGroup}
          detailExpanded={couponPopupVisible}
          onDetailClick={toggleCouponPopup}
          onPay={handlePay}
        />
      }
    >
      <View className='order-hint'>定制商品无质量问题不支持退换，付款后30分钟内可退款。</View>
      <View className='order-page'>
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
                <View className='order-item-detail'>
                  <Text className='order-item-name'>{item.name}</Text>
                  <Text className='order-item-spec'>{item.spec}</Text>
                </View>
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
            <View className='order-summary-label-group'>
              <Text className='order-summary-label'>运费</Text>
              <View className='order-summary-tag order-summary-tag--free'>
                <Text className='order-summary-tag-text'>满40元包邮</Text>
              </View>
            </View>
            <Text className='order-summary-value'>¥ {shippingFee.toFixed(2)}</Text>
          </View>
          <View className='order-summary-row'>
            <View className='order-summary-label-group'>
              <Text className='order-summary-label'>优惠</Text>
              <View className='order-summary-tag order-summary-tag--discount'>
                <Text className='order-summary-tag-text'>订单≥2件商品第2件起享受8折优惠</Text>
              </View>
            </View>
            <Text className='order-summary-value'>-¥ {totalDiscount.toFixed(2)}</Text>
          </View>
          <View className='order-summary-row'>
            <Text className='order-summary-label'>配送服务</Text>
            <Text className='order-summary-value'>
              {deliveryInfo.prefix}
              {/* <Text className='order-summary-value-green'>{deliveryInfo.shipText}</Text> */}
              <Text className='order-summary-value-green'>承诺2个工作日内发货</Text>
            </Text>
          </View>
        </View>

        <View className='order-safe-bottom' />
      </View>

      <PaySuccessPopup
        visible={payPopupVisible}
        onClose={closePayPopup}
        address={address}
        productImage={orderItems[0]?.image || ''}
      />
      <CouponDetailPopup
        visible={couponPopupVisible}
        items={orderItems}
        totalAmount={finalTotal}
        totalDiscount={totalDiscount}
        totalCount={totalCount}
        onClose={closeCouponPopup}
        onPay={handlePay}
      />
    </BasePage>
  );
}
