import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import BasePage from '@/components/base-page';
import IconSingle from '@/assets/svgs/icon_single.svg';
import IconGroup from '@/assets/svgs/icon_group.svg';
import IconCar from '@/assets/svgs/icon_car_black.svg';
import IconRight from '@/assets/svgs/icon_right2.svg';
import { OrderStatus } from '@/api/modules/order';
import { useOrderDetailLogic } from './index.logic';
import './index.scss';

export default function OrderDetail() {
  const {
    order,
    navTitle,
    isGroup,
    displayPrice,
    countdown,
    specText,
    latestTrace,
    handleCopyOrderNo,
    handleCancel,
    handleDelete,
    handleViewLogistics,
    handlePay,
  } = useOrderDetailLogic();

  if (!order) {
    return (
      <BasePage navTitle='订单详情'>
        <View className='order-detail-page'>
          <Text>订单数据加载失败</Text>
        </View>
      </BasePage>
    );
  }

  const status = Number(order.orderStatus);

  /** 底部栏按钮 */
  const bottomBar = (() => {
    // 待支付
    if (status === OrderStatus.NOT_PAY) {
      return (
        <View className='order-detail-bottom-bar'>
          <View className='order-detail-bottom-actions'>
            <View className='order-detail-btn order-detail-btn--default' onClick={handleCancel}>
              <Text className='order-detail-btn-text order-detail-btn-text--default'>取消订单</Text>
            </View>
            {!countdown.isExpired && (
              <View className='order-detail-btn order-detail-btn--primary' onClick={handlePay}>
                <Text className='order-detail-btn-text'>立即支付 {countdown.text}</Text>
              </View>
            )}
          </View>
        </View>
      );
    }
    // 待收货
    if (status === OrderStatus.TO_BE_RECEIVED) {
      return (
        <View className='order-detail-bottom-bar'>
          <View className='order-detail-bottom-actions'>
            <View
              className='order-detail-btn order-detail-btn--default'
              onClick={handleViewLogistics}
            >
              <Text className='order-detail-btn-text order-detail-btn-text--default'>查看物流</Text>
            </View>
          </View>
        </View>
      );
    }
    // 已完成/已取消/已退款/已关闭 → 删除
    if (
      status === OrderStatus.COMPLETED ||
      status === OrderStatus.CANCELED ||
      status === OrderStatus.REFUNDED ||
      status === OrderStatus.CLOSED
    ) {
      return (
        <View className='order-detail-bottom-bar'>
          <View className='order-detail-bottom-actions'>
            <View className='order-detail-btn order-detail-btn--default' onClick={handleDelete}>
              <Text className='order-detail-btn-text order-detail-btn-text--default'>删除订单</Text>
            </View>
          </View>
        </View>
      );
    }
    return null;
  })();

  return (
    <BasePage
      navTitle={navTitle}
      onNavLeftClick={() => Taro.navigateBack().catch(() => {})}
      bottomBarComponent={bottomBar || undefined}
    >
      <ScrollView className='order-detail-page' scrollY>
        {/* 地址卡片 */}
        <View className='order-detail-address-card'>
          {status === OrderStatus.TO_BE_RECEIVED && (
            <View className='order-detail-logistics-entry' onClick={handleViewLogistics}>
              <Image className='order-detail-logistics-icon' src={IconCar} />
              <Text className='order-detail-logistics-status'>
                {latestTrace?.categoryName || '运输中'}
              </Text>
              <Text className='order-detail-logistics-text' numberOfLines={1}>
                {latestTrace?.operationRemark || '快递运输中，请耐心等待'}
              </Text>
              <Image className='order-detail-logistics-arrow' src={IconRight} />
            </View>
          )}
          <Text className='order-detail-address-text'>{order.address}</Text>
          <View className='order-detail-address-user'>
            <Text className='order-detail-address-name'>{order.recipient}</Text>
            <Text className='order-detail-address-phone'>{order.recipientPhone}</Text>
          </View>
        </View>

        {/* 商品卡片 */}
        <View className='order-detail-goods-card'>
          <View className='order-detail-goods-header'>
            <View className='order-detail-goods-type'>
              <Image
                className='order-detail-goods-type-icon'
                src={isGroup ? IconGroup : IconSingle}
              />
              <Text className='order-detail-goods-type-text'>{isGroup ? '组合' : '单品'}</Text>
            </View>
          </View>

          {isGroup ? (
            <View className='order-detail-images-row'>
              <ScrollView className='order-detail-images-scroll' scrollX showScrollbar={false}>
                <View className='order-detail-images-scroll-inner'>
                  {(order.imgList || []).map((img, idx) => (
                    <View key={img.pkId || idx} className='order-detail-image-wrap'>
                      <Image className='order-detail-image' src={img.imgLink} mode='aspectFill' />
                      <View className='order-detail-image-badge'>
                        <Text className='order-detail-image-badge-text'>x1</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
              <View className='order-detail-total-info'>
                <Text className='order-detail-total-count-text'>共 {order.goodsNum} 件</Text>
              </View>
            </View>
          ) : (
            <View className='order-detail-goods-body'>
              <Image
                className='order-detail-goods-image'
                src={order.orderImg || order.imgList?.[0]?.imgLink || ''}
                mode='aspectFill'
              />
              <View className='order-detail-goods-info'>
                <View className='order-detail-goods-title-wrap'>
                  <Text className='order-detail-goods-name'>{order.orderTitle || ''}</Text>
                  {specText && <Text className='order-detail-goods-spec'>{specText}</Text>}
                </View>
                <Text className='order-detail-goods-count'>共 {order.goodsNum} 件</Text>
              </View>
            </View>
          )}

          {/* 物流信息 */}
          {status === OrderStatus.TO_BE_SHIPPED && (
            <View className='order-detail-shipping-info'>
              <Image className='order-detail-shipping-icon' src={IconCar} />
              <Text className='order-detail-shipping-label'>发货信息</Text>
              <Text className='order-detail-shipping-text'>
                最晚{order.deliveryTime || '后天（48小时之内）'} 发货
              </Text>
            </View>
          )}

          {/* 订单信息汇总 */}
          <View className='order-detail-goods-summary'>
            <View className='order-detail-info-row order-detail-info-row--strong'>
              <Text className='order-detail-info-label'>实付款</Text>
              <Text className='order-detail-info-value'>¥{displayPrice.toFixed(2)}</Text>
            </View>
            <View className='order-detail-info-row'>
              <Text className='order-detail-info-label'>运费</Text>
              <Text className='order-detail-info-value'>
                ¥{Number(order.deliveryPrice).toFixed(2)}
              </Text>
            </View>
            <View className='order-detail-info-row'>
              <Text className='order-detail-info-label'>订单编号</Text>
              <View className='order-detail-info-no-wrap'>
                <Text className='order-detail-info-no'>{order.orderNo}</Text>
                <View className='order-detail-info-divider' />
                <Text className='order-detail-info-copy' onClick={handleCopyOrderNo}>
                  复制
                </Text>
              </View>
            </View>
            <View className='order-detail-info-row'>
              <Text className='order-detail-info-label'>下单时间</Text>
              <Text className='order-detail-info-value order-detail-info-value-time'>
                {order.gmtCreate}
              </Text>
            </View>
          </View>
        </View>

        <View className='order-detail-safe-bottom' />
      </ScrollView>
    </BasePage>
  );
}
