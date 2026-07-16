import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import BasePage from '@/components/base-page';
import IconSingle from '@/assets/svgs/icon_single.svg';
import IconGroup from '@/assets/svgs/icon_group.svg';
import IconCar from '@/assets/svgs/icon_car_black.svg';
import { OrderStatus } from '@/api/modules/order';
import type { MerchantOrder } from '@/api/modules/order';
import { formatSizeLabel } from '@/utils/format';
import { setCurrentOrder } from '@/pages/order-detail/index.logic';
import { useMyOrdersLogic, TABS, STATUS_TEXT_MAP, HIGHLIGHT_STATUSES } from './index.logic';
import './index.scss';

export default function MyOrders() {
  const {
    isFromCancelPay,
    activeTab,
    orders,
    loading,
    handleTabChange,
    handleGoMake,
    handleCancel,
    handleDelete,
    handleViewLogistics,
    handlePayOrder,
    getOrderImage,
    isGroupOrder,
    getDisplayPrice,
    getOrderCountdown,
  } = useMyOrdersLogic();

  const handleGoOrderDetail = (order: MerchantOrder) => {
    setCurrentOrder(order);
    Taro.navigateTo({ url: '/pages/order-detail/index' });
  };

  /** 渲染操作按钮 */
  const renderOrderAction = (order: MerchantOrder) => {
    const status = Number(order.orderStatus);
    const isPendingPay = status === OrderStatus.NOT_PAY;

    if (isPendingPay) {
      const { isExpired, text: countdownText } = getOrderCountdown(order);
      return (
        <View className='order-card-footer-actions'>
          <View
            className='order-action-btn order-action-btn--default'
            onClick={() => handleCancel(order.pkId)}
          >
            <Text className='order-action-text order-action-text--default'>取消订单</Text>
          </View>
          {!isExpired && (
            <View
              className='order-action-btn order-action-btn--primary'
              onClick={() => handlePayOrder(order)}
            >
              <Text className='order-action-text'>立即支付 {countdownText}</Text>
            </View>
          )}
        </View>
      );
    }

    switch (status) {
      case OrderStatus.TO_BE_RECEIVED:
        return (
          <View className='order-card-footer-actions'>
            <View
              className='order-action-btn order-action-btn--default'
              onClick={() => handleViewLogistics(order)}
            >
              <Text className='order-action-text order-action-text--default'>查看物流</Text>
            </View>
          </View>
        );
      case OrderStatus.COMPLETED:
      case OrderStatus.CANCELED:
      case OrderStatus.REFUNDED:
      case OrderStatus.CLOSED:
        return (
          <View
            className='order-action-btn order-action-btn--default'
            onClick={() => handleDelete(order.pkId)}
          >
            <Text className='order-action-text order-action-text--default'>删除订单</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <BasePage
      navTitle='我的订单'
      onNavLeftClick={
        isFromCancelPay ? () => Taro.switchTab({ url: '/pages/index/index' }) : undefined
      }
    >
      <View className='my-orders-page'>
        {/* tab 栏 */}
        <ScrollView className='order-tabs' scrollX showScrollbar={false}>
          <View className='order-tabs-inner'>
            {TABS.map((tab) => (
              <View
                key={tab.key}
                className={`order-tab ${activeTab === tab.key ? 'order-tab--active' : ''}`}
                onClick={() => handleTabChange(tab.key)}
              >
                <Text className='order-tab-text'>{tab.label}</Text>
                {activeTab === tab.key && <View className='order-tab-line' />}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* 订单列表 */}
        <View className='order-list'>
          {loading ? (
            <View className='order-list-empty'>
              <Text className='order-list-empty-text'>加载中...</Text>
            </View>
          ) : orders.length === 0 ? (
            <View className='order-list-empty'>
              <Text className='order-list-empty-line'>暂无相关订单</Text>
              <Text className='order-list-empty-line'>快去制作专属冰箱贴吧</Text>
              <View className='order-list-empty-btn' onClick={handleGoMake}>
                <Text className='order-list-empty-btn-text'>去制作</Text>
              </View>
            </View>
          ) : (
            orders.map((order) => {
              const isGroup = isGroupOrder(order);
              const status = Number(order.orderStatus);
              const statusText = STATUS_TEXT_MAP[status] || '未知';
              const isHighlight = HIGHLIGHT_STATUSES.has(status);
              const mainImage = getOrderImage(order);

              return (
                <View
                  key={order.pkId}
                  className='order-card'
                  onClick={() => handleGoOrderDetail(order)}
                >
                  {/* 头部：类型 + 状态 */}
                  <View className='order-card-header'>
                    <View className='order-card-type'>
                      <Image
                        className='order-card-type-icon'
                        src={isGroup ? IconGroup : IconSingle}
                      />
                      <Text className='order-card-type-text'>{isGroup ? '组合' : '单品'}</Text>
                    </View>
                    <Text
                      className={`order-card-status ${isHighlight ? 'order-card-status--highlight' : ''}`}
                    >
                      {statusText}
                    </Text>
                  </View>

                  {/* 商品区域 */}
                  <View className='order-card-body'>
                    {isGroup ? (
                      <View className='order-images-row'>
                        <ScrollView className='order-images-scroll' scrollX showScrollbar={false}>
                          <View className='order-images-scroll-inner'>
                            {(order.imgList || []).map((img, idx) => (
                              <View key={img.pkId || idx} className='order-image-wrap'>
                                <Image
                                  className='order-image'
                                  src={img.imgLink}
                                  mode='aspectFill'
                                />
                                <View className='order-image-badge'>
                                  <Text className='order-image-badge-text'>x1</Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        </ScrollView>
                        <View className='order-total-info'>
                          <Text className='order-total-count-text'>共 {order.goodsNum} 件</Text>
                        </View>
                      </View>
                    ) : (
                      <View className='order-single-item'>
                        <Image className='order-single-image' src={mainImage} mode='aspectFill' />
                        <View className='order-single-info'>
                          <Text className='order-single-name'>冰箱贴一副</Text>
                          {order.imgList?.[0]?.width && order.imgList?.[0]?.height && (
                            <Text className='order-single-spec'>
                              {formatSizeLabel(order.imgList[0].width, order.imgList[0].height)}
                            </Text>
                          )}
                          <View className='order-single-count-row'>
                            <Text className='order-single-count'>共 {order.goodsNum} 件</Text>
                            <View className='order-payment'>
                              <Text className='order-payment-label'>实付</Text>
                              <Text className='order-payment-price'>
                                ¥{getDisplayPrice(order).toFixed(2)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* 组合订单实付行 */}
                  {isGroup && (
                    <View className='order-payment-group'>
                      <Text className='order-payment-label'>实付</Text>
                      <Text className='order-payment-price'>
                        ¥{getDisplayPrice(order).toFixed(2)}
                      </Text>
                    </View>
                  )}

                  {/* 物流信息 */}
                  {status === OrderStatus.TO_BE_SHIPPED && (
                    <View className='order-shipping-info'>
                      <Image className='order-shipping-icon' src={IconCar} />
                      <Text className='order-shipping-label'>发货信息</Text>
                      <Text className='order-shipping-text'>
                        最晚{order.deliveryTime || '后天（48小时之内）'} 发货
                      </Text>
                    </View>
                  )}
                  {status === OrderStatus.TO_BE_RECEIVED && order.deliveryPromiseTime && (
                    <View className='order-shipping-info'>
                      <Image className='order-shipping-icon' src={IconCar} />
                      <Text className='order-shipping-label'>运输中</Text>
                      <Text className='order-shipping-text'>{order.deliveryPromiseTime}</Text>
                    </View>
                  )}

                  {/* 操作按钮 */}
                  {renderOrderAction(order) && (
                    <View className='order-card-footer'>{renderOrderAction(order)}</View>
                  )}
                </View>
              );
            })
          )}
          <View className='my-orders-safe-bottom' />
        </View>
      </View>
    </BasePage>
  );
}
