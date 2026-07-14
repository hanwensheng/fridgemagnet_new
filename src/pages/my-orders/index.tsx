import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState, useCallback } from 'react';
import BasePage from '@/components/base-page';
import IconSingle from '@/assets/svgs/icon_single.svg';
import IconGroup from '@/assets/svgs/icon_group.svg';
import IconCar from '@/assets/svgs/icon_car_black.svg';
import { orderApi, OrderStatus } from '@/api/modules/order';
import type { MerchantOrder } from '@/api/modules/order';
import './index.scss';

/** 支付倒计时（分钟） */
const PAY_DEADLINE_MINUTES = 15;

/** HH:MM:SS 格式化 */
function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** 状态码 → 展示文案 */
const STATUS_TEXT_MAP: Record<number, string> = {
  [OrderStatus.NOT_PAY]: '待支付',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.REFUNDED]: '已退款',
  [OrderStatus.TO_BE_SHIPPED]: '待发货',
  [OrderStatus.TO_BE_RECEIVED]: '待收货',
  [OrderStatus.CANCELED]: '已取消',
  [OrderStatus.APPLY_REFUND]: '退款中',
  [OrderStatus.CLOSED]: '已关闭',
  [OrderStatus.TO_BE_UPLOAD]: '待制作',
};

/** 高亮状态（红色文字） */
const HIGHLIGHT_STATUSES = new Set<number>([
  OrderStatus.NOT_PAY,
  OrderStatus.TO_BE_SHIPPED,
  OrderStatus.TO_BE_RECEIVED,
]);

/** Tab 定义：key 用于前端标识，orderStatus 传给后端 */
const TABS = [
  { key: 'all', label: '全部', orderStatus: undefined as number | undefined },
  { key: 'pending_payment', label: '待支付', orderStatus: OrderStatus.NOT_PAY },
  { key: 'pending_shipment', label: '待发货', orderStatus: OrderStatus.TO_BE_SHIPPED },
  { key: 'pending_receipt', label: '待收货', orderStatus: OrderStatus.TO_BE_RECEIVED },
  { key: 'completed', label: '已完成', orderStatus: OrderStatus.COMPLETED },
  { key: 'cancelled', label: '已取消', orderStatus: OrderStatus.CANCELED },
];

export default function MyOrders() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [loading, setLoading] = useState(false);
  /** 全局当前时间，每秒更新，驱动倒计时刷新 */
  const [now, setNow] = useState(() => Date.now());

  /** 当前 tab 对应的 orderStatus */
  const currentOrderStatus = useMemo(
    () => TABS.find((t) => t.key === activeTab)?.orderStatus,
    [activeTab],
  );

  /** 拉取订单列表 */
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: { pageNum?: number; pageSize?: number; orderStatus?: number } = {
        pageNum: 1,
        pageSize: 50,
      };
      if (currentOrderStatus !== undefined) {
        params.orderStatus = currentOrderStatus;
      }
      const data = await orderApi.findAllBySearchOnline(params);
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [currentOrderStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /** 全局倒计时定时器 */
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  /** 切换 tab */
  const handleTabChange = (key: string) => {
    if (key === activeTab) return;
    setActiveTab(key);
  };

  // === 操作处理 ===

  /** 确认收货 */
  const handleConfirmReceipt = async (pkId: number) => {
    const res = await Taro.showModal({ title: '提示', content: '确认已收到商品？' });
    if (!res.confirm) return;
    try {
      await orderApi.confirmReceiptOnline(pkId);
      Taro.showToast({ title: '已确认收货', icon: 'success' });
      fetchOrders();
    } catch {
      // 接口内部已展示错误
    }
  };

  /** 删除订单 */
  const handleDelete = async (pkId: number) => {
    const res = await Taro.showModal({ title: '提示', content: '确定删除该订单吗？' });
    if (!res.confirm) return;
    try {
      await orderApi.deleteByIdOnline(pkId);
      Taro.showToast({ title: '已删除', icon: 'success' });
      fetchOrders();
    } catch {
      // 接口内部已展示错误
    }
  };

  /** 查看物流 */
  const handleViewLogistics = (order: MerchantOrder) => {
    if (order.trackingNumber) {
      Taro.setClipboardData({
        data: order.trackingNumber,
        success: () => Taro.showToast({ title: '快递单号已复制', icon: 'none' }),
      });
    } else {
      Taro.showToast({ title: '暂无物流信息', icon: 'none' });
    }
  };

  // === 渲染 ===

  /** 获取订单展示图 */
  const getOrderImage = (order: MerchantOrder) => {
    if (order.orderImg) return order.orderImg;
    if (order.imgList && order.imgList.length > 0) return order.imgList[0].imgLink;
    return '';
  };

  /** 是否为组合：件数 > 1 即为组合 */
  const isGroupOrder = (order: MerchantOrder) => order.goodsNum > 1;

  /** 计算单个订单的倒计时 */
  const getOrderCountdown = useCallback(
    (order: MerchantOrder) => {
      if (!order.gmtCreate) return { remaining: 0, isExpired: true, text: '' };
      const deadline = new Date(order.gmtCreate).getTime() + PAY_DEADLINE_MINUTES * 60 * 1000;
      const remaining = Math.max(0, Math.floor((deadline - now) / 1000));
      return {
        remaining,
        isExpired: remaining <= 0,
        text: formatCountdown(remaining),
      };
    },
    [now],
  );

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
            onClick={() => handleDelete(order.pkId)}
          >
            <Text className='order-action-text order-action-text--default'>取消订单</Text>
          </View>
          {!isExpired && (
            <View className='order-action-btn order-action-btn--primary'>
              <Text className='order-action-text'>去支付 {countdownText}</Text>
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
            <View
              className='order-action-btn order-action-btn--primary'
              onClick={() => handleConfirmReceipt(order.pkId)}
            >
              <Text className='order-action-text'>确认收货</Text>
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
    <BasePage navTitle='我的订单'>
      <View className='my-orders-page'>
        {/* tab 栏（可横向滚动，固定在顶部） */}
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
              <Text className='order-list-empty-text'>暂无订单</Text>
            </View>
          ) : (
            orders.map((order) => {
              const isGroup = isGroupOrder(order);
              const status = Number(order.orderStatus);
              const statusText = STATUS_TEXT_MAP[status] || '未知';
              const isHighlight = HIGHLIGHT_STATUSES.has(status);
              const mainImage = getOrderImage(order);

              return (
                <View key={order.pkId} className='order-card'>
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
                        {(order.imgList || []).map((img, idx) => (
                          <View key={img.pkId || idx} className='order-image-wrap'>
                            <Image className='order-image' src={img.imgLink} mode='aspectFill' />
                          </View>
                        ))}
                        <View className='order-total-info'>
                          <Text className='order-total-count-text'>共 {order.goodsNum} 件</Text>
                        </View>
                      </View>
                    ) : (
                      <View className='order-single-item'>
                        <Image className='order-single-image' src={mainImage} mode='aspectFill' />
                        <View className='order-single-info'>
                          <Text className='order-single-name'>冰箱贴一副</Text>
                          <View className='order-single-count-row'>
                            <Text className='order-single-count'>共 {order.goodsNum} 件</Text>
                            <View className='order-payment'>
                              <Text className='order-payment-label'>实付</Text>
                              <Text className='order-payment-price'>
                                ¥{Number(order.payPrice).toFixed(1)}
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
                        ¥{Number(order.payPrice).toFixed(1)}
                      </Text>
                    </View>
                  )}

                  {/* 物流信息 */}
                  {status === OrderStatus.TO_BE_SHIPPED && order.deliveryTime && (
                    <View className='order-shipping-info'>
                      <Image className='order-shipping-icon' src={IconCar} />
                      <Text className='order-shipping-label'>发货信息</Text>
                      <Text className='order-shipping-text'>最晚 {order.deliveryTime} 发货</Text>
                    </View>
                  )}
                  {status === OrderStatus.TO_BE_RECEIVED && order.courier && (
                    <View className='order-shipping-info'>
                      <Image className='order-shipping-icon' src={IconCar} />
                      <Text className='order-shipping-label'>运输中</Text>
                      <Text className='order-shipping-text'>
                        {order.courier}
                        {order.trackingNumber ? ` ${order.trackingNumber}` : ''}
                      </Text>
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
