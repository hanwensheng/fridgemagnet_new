import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import BasePage from '@/components/base-page';
import IconSingle from '@/assets/svgs/icon_single.svg';
import IconGroup from '@/assets/svgs/icon_group.svg';
import ProductImg from '@/assets/images/8.5_4cm.png';
import ProductImg2 from '@/assets/images/7_5.5cm.png';
import ProductImg3 from '@/assets/images/4.5_3cm.png';
import IconCar from '@/assets/svgs/icon_car_black.svg';
import './index.scss';

type OrderStatus =
  'pending_payment' | 'pending_shipment' | 'pending_receipt' | 'completed' | 'cancelled';

interface OrderItem {
  id: string;
  name: string;
  spec: string;
  image: string;
  quantity: number;
}

interface Order {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  totalQuantity: number;
  actualPayment: number;
  shippingInfo?: string;
  countdown?: number;
}

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending_payment', label: '待支付' },
  { key: 'pending_shipment', label: '待发货' },
  { key: 'pending_receipt', label: '待收货' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

const STATUS_TEXT: Record<OrderStatus, string> = {
  pending_payment: '待支付',
  pending_shipment: '待发货',
  pending_receipt: '待收货',
  completed: '已完成',
  cancelled: '已取消',
};

const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    status: 'pending_payment',
    items: [
      {
        id: '1-1',
        name: '威海布鲁斯号留念',
        spec: '8*5.4cm',
        image: ProductImg,
        quantity: 3,
      },
    ],
    totalQuantity: 3,
    actualPayment: 107.3,
    countdown: 1667,
  },
  {
    id: '2',
    status: 'completed',
    items: [
      {
        id: '2-1',
        name: '威海布鲁斯号留念',
        spec: '8*5.4cm',
        image: ProductImg2,
        quantity: 1,
      },
    ],
    totalQuantity: 1,
    actualPayment: 107.3,
  },
  {
    id: '3',
    status: 'cancelled',
    items: [
      { id: '3-1', name: '威海布鲁斯号留念', spec: '8*5.4cm', image: ProductImg2, quantity: 1 },
      { id: '3-2', name: '威海布鲁斯号留念', spec: '8*5.4cm', image: ProductImg, quantity: 1 },
      { id: '3-3', name: '威海布鲁斯号留念', spec: '8*5.4cm', image: ProductImg3, quantity: 1 },
    ],
    totalQuantity: 7,
    actualPayment: 107.3,
  },
  {
    id: '4',
    status: 'pending_shipment',
    items: [
      {
        id: '4-1',
        name: '威海布鲁斯号留念',
        spec: '8*5.4cm',
        image: ProductImg,
        quantity: 1,
      },
    ],
    totalQuantity: 1,
    actualPayment: 107.3,
    shippingInfo: '最晚后天（06月29日）14:58发货',
  },
  {
    id: '5',
    status: 'pending_receipt',
    items: [
      {
        id: '5-1',
        name: '威海布鲁斯号留念',
        spec: '8*5.4cm',
        image: ProductImg,
        quantity: 1,
      },
    ],
    totalQuantity: 1,
    actualPayment: 107.3,
    shippingInfo: '预计后天送达',
  },
];

function formatCountdown(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function MyOrders() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});

  useEffect(() => {
    const initial: Record<string, number> = {};
    MOCK_ORDERS.forEach((order) => {
      if (order.countdown) {
        initial[order.id] = order.countdown;
      }
    });
    setCountdowns(initial);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdowns((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (next[key] > 0) {
            next[key] -= 1;
          }
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return MOCK_ORDERS;
    return MOCK_ORDERS.filter((order) => order.status === activeTab);
  }, [activeTab]);

  const isGroupOrder = (order: Order) => order.items.length > 1;

  const handlePay = (orderId: string) => {
    Taro.showToast({ title: `支付订单 ${orderId}`, icon: 'none' });
  };

  const handleDelete = (orderId: string) => {
    Taro.showModal({ title: '提示', content: '确定删除该订单吗？' }).then((res) => {
      if (res.confirm) {
        Taro.showToast({ title: `已删除 ${orderId}`, icon: 'success' });
      }
    });
  };

  const handleViewLogistics = (orderId: string) => {
    Taro.showToast({ title: `查看物流 ${orderId}`, icon: 'none' });
  };

  const renderOrderAction = (order: Order) => {
    switch (order.status) {
      case 'pending_payment':
        return (
          <View
            className='order-action-btn order-action-btn--primary'
            onClick={() => handlePay(order.id)}
          >
            <Text className='order-action-text'>
              立即支付 {formatCountdown(countdowns[order.id] || 0)}
            </Text>
          </View>
        );
      case 'completed':
      case 'cancelled':
        return (
          <View
            className='order-action-btn order-action-btn--default'
            onClick={() => handleDelete(order.id)}
          >
            <Text className='order-action-text order-action-text--default'>删除订单</Text>
          </View>
        );
      case 'pending_receipt':
        return (
          <View
            className='order-action-btn order-action-btn--default'
            onClick={() => handleViewLogistics(order.id)}
          >
            <Text className='order-action-text order-action-text--default'>查看物流</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <BasePage navTitle='我的订单'>
      <View className='my-orders-page'>
        {/* 可滚动tab */}
        <ScrollView className='order-tabs' scrollX showScrollbar={false}>
          <View className='order-tabs-inner'>
            {TABS.map((tab) => (
              <View
                key={tab.key}
                className={`order-tab ${activeTab === tab.key ? 'order-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Text className='order-tab-text'>{tab.label}</Text>
                {activeTab === tab.key && <View className='order-tab-line' />}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* 订单列表 */}
        <View className='order-list'>
          {filteredOrders.map((order) => {
            const isGroup = isGroupOrder(order);
            return (
              <View key={order.id} className='order-card'>
                <View className='order-card-header'>
                  <View className='order-card-type'>
                    <Image
                      className='order-card-type-icon'
                      src={isGroup ? IconGroup : IconSingle}
                    />
                    <Text className='order-card-type-text'>{isGroup ? '组合' : '单品'}</Text>
                  </View>
                  <Text
                    className={`order-card-status ${order.status === 'pending_payment' || order.status === 'pending_shipment' || order.status === 'pending_receipt' ? 'order-card-status--highlight' : ''}`}
                  >
                    {STATUS_TEXT[order.status]}
                  </Text>
                </View>

                <View className='order-card-body'>
                  {isGroup ? (
                    <View className='order-images-row'>
                      {order.items.map((item) => (
                        <View key={item.id} className='order-image-wrap'>
                          <Image className='order-image' src={item.image} mode='aspectFill' />
                          <View className='order-image-badge'>
                            <Text className='order-image-badge-text'>x{item.quantity}</Text>
                          </View>
                        </View>
                      ))}
                      <View className='order-total-info'>
                        <Text className='order-total-count-text'>共 {order.totalQuantity} 件</Text>
                      </View>
                    </View>
                  ) : (
                    <View className='order-single-item'>
                      <Image
                        className='order-single-image'
                        src={order.items[0].image}
                        mode='aspectFill'
                      />
                      <View className='order-single-info'>
                        <Text className='order-single-name'>{order.items[0].name}</Text>
                        <Text className='order-single-spec'>{order.items[0].spec}</Text>
                        <View className='order-single-count-row'>
                          <Text className='order-single-count'>
                            共 {order.items[0].quantity} 件
                          </Text>
                          <View className='order-payment'>
                            <Text className='order-payment-label'>实付</Text>
                            <Text className='order-payment-price'>
                              ¥{order.actualPayment.toFixed(1)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </View>

                {isGroup && (
                  <View className='order-payment-group'>
                    <Text className='order-payment-label'>实付</Text>
                    <Text className='order-payment-price'>¥{order.actualPayment.toFixed(1)}</Text>
                  </View>
                )}

                {order.shippingInfo && (
                  <View className='order-shipping-info'>
                    <Image className='order-shipping-icon' src={IconCar} />
                    <Text className='order-shipping-label'>
                      {order.status === 'pending_shipment' ? '发货信息' : '运输中'}
                    </Text>
                    <Text className='order-shipping-text'>{order.shippingInfo}</Text>
                  </View>
                )}

                {renderOrderAction(order) && (
                  <View className='order-card-footer'>{renderOrderAction(order)}</View>
                )}
              </View>
            );
          })}
          <View className='my-orders-safe-bottom' />
        </View>
      </View>
    </BasePage>
  );
}
