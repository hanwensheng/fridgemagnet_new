import { useEffect, useMemo, useState, useCallback } from 'react';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import { orderApi, OrderStatus } from '@/api/modules/order';
import type { MerchantOrder } from '@/api/modules/order';
import { setLogisticsOrder } from '@/pages/logistics-detail/index.logic';

/** 支付倒计时（分钟） */
export const PAY_DEADLINE_MINUTES = 15;

/** HH:MM:SS 格式化 */
export function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** 状态码 → 展示文案 */
export const STATUS_TEXT_MAP: Record<number, string> = {
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
export const HIGHLIGHT_STATUSES = new Set<number>([
  OrderStatus.NOT_PAY,
  OrderStatus.TO_BE_SHIPPED,
  OrderStatus.TO_BE_RECEIVED,
]);

/** Tab 定义：key 用于前端标识，orderStatus 传给后端 */
export const TABS = [
  { key: 'all', label: '全部', orderStatus: undefined as number | undefined },
  { key: 'pending_payment', label: '待支付', orderStatus: OrderStatus.NOT_PAY },
  { key: 'pending_shipment', label: '待发货', orderStatus: OrderStatus.TO_BE_SHIPPED },
  { key: 'pending_receipt', label: '待收货', orderStatus: OrderStatus.TO_BE_RECEIVED },
  { key: 'completed', label: '已完成', orderStatus: OrderStatus.COMPLETED },
  { key: 'cancelled', label: '已取消', orderStatus: OrderStatus.CANCELED },
  { key: 'closed', label: '已关闭', orderStatus: OrderStatus.CLOSED },
];

export function useMyOrdersLogic() {
  const isFromCancelPay = useMemo(() => {
    try {
      return Taro.getCurrentInstance()?.router?.params?.from === 'cancel-pay';
    } catch {
      return false;
    }
  }, []);

  const [activeTab, setActiveTab] = useState<string>('all');
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const currentOrderStatus = useMemo(
    () => TABS.find((t) => t.key === activeTab)?.orderStatus,
    [activeTab],
  );

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

  useEffect(() => {
    const handler = () => fetchOrders();
    Taro.eventCenter.on('orders:refresh', handler);
    return () => {
      Taro.eventCenter.off('orders:refresh', handler);
    };
  }, [fetchOrders]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTabChange = (key: string) => {
    if (key === activeTab) return;
    setActiveTab(key);
  };

  const handleGoMake = () => {
    Taro.eventCenter.trigger('home:open-drawer');
    Taro.switchTab({ url: '/pages/index/index' });
  };

  const handleCancel = async (pkId: number) => {
    const res = await Taro.showModal({ title: '提示', content: '确定取消该订单吗？' });
    if (!res.confirm) return;
    try {
      await orderApi.cancelOnline({ cancelReason: '用户取消', orderId: String(pkId) });
      Taro.showToast({ title: '已取消', icon: 'success' });
      fetchOrders();
    } catch {
      // 接口内部已展示错误
    }
  };

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

  const handleViewLogistics = (order: MerchantOrder) => {
    setLogisticsOrder(order);
    Taro.navigateTo({ url: '/pages/logistics-detail/index' });
  };

  const getOrderImage = (order: MerchantOrder) => {
    if (order.orderImg) return order.orderImg;
    if (order.imgList && order.imgList.length > 0) return order.imgList[0].imgLink;
    return '';
  };

  const isGroupOrder = (order: MerchantOrder) => order.goodsNum > 1;

  /** 默认用 payPrice，为空时用 orderPrice + deliveryPrice */
  const getDisplayPrice = (order: MerchantOrder) => {
    const pp = Number(order.payPrice);
    if (pp) return pp;
    return order.orderPrice + order.deliveryPrice;
  };

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

  const handlePayOrder = useCallback(
    async (order: MerchantOrder) => {
      Taro.showLoading({ title: '发起支付...', mask: true });
      try {
        const { merchantId } = useAppStore.getState();
        const payResult = merchantId
          ? await orderApi.payOrder(order.pkId)
          : await orderApi.payOrderOnline(order.pkId);

        if (!payResult?.payParams) {
          throw new Error('支付信息获取失败');
        }

        await Taro.requestPayment({
          timeStamp: payResult.payParams.timeStamp,
          nonceStr: payResult.payParams.nonceStr,
          package: payResult.payParams.package,
          signType: payResult.payParams.signType as 'MD5' | 'HMAC-SHA256' | 'RSA',
          paySign: payResult.payParams.paySign,
        });

        Taro.hideLoading();
        Taro.showToast({ title: '支付成功', icon: 'success' });
        fetchOrders();
      } catch (err: any) {
        Taro.hideLoading();
        if (err?.errMsg?.includes('cancel')) {
          Taro.showToast({ title: '支付已取消', icon: 'none', duration: 1000 });
        } else {
          Taro.showToast({ title: err?.message || '支付失败', icon: 'none', duration: 1000 });
        }
      }
    },
    [fetchOrders],
  );

  return {
    isFromCancelPay,
    activeTab,
    orders,
    loading,
    now,
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
  };
}
