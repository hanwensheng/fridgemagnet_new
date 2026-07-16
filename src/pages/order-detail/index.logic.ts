import { useEffect, useMemo, useState, useCallback } from 'react';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import { orderApi, OrderStatus, TraceItem } from '@/api/modules/order';
import type { MerchantOrder } from '@/api/modules/order';
import { formatSizeLabel } from '@/utils/format';
import { setLogisticsOrder } from '@/pages/logistics-detail/index.logic';

/** 支付倒计时（分钟） */
const PAY_DEADLINE_MINUTES = 15;

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

/** HH:MM:SS 格式化 */
function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** 模块级订单数据传递 */
let currentOrder: MerchantOrder | null = null;

export function setCurrentOrder(order: MerchantOrder) {
  currentOrder = order;
}

function getCurrentOrder(): MerchantOrder | null {
  const o = currentOrder;
  currentOrder = null;
  return o;
}

export function useOrderDetailLogic() {
  const [now, setNow] = useState(() => Date.now());
  const [traceList, setTraceList] = useState<TraceItem[]>([]);

  const order = useMemo(() => getCurrentOrder(), []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!order?.trackingNumber) return;
    orderApi
      .getOrderTrace(order.trackingNumber)
      .then((res) => {
        setTraceList(Array.isArray(res) ? res : []);
      })
      .catch(() => {});
  }, [order?.trackingNumber]);

  /** 导航标题 */
  const navTitle = useMemo(() => {
    if (!order) return '订单详情';
    const status = Number(order.orderStatus);
    return STATUS_TEXT_MAP[status] || '订单详情';
  }, [order]);

  /** 是否组合订单 */
  const isGroup = useMemo(() => {
    if (!order) return false;
    return Number(order.goodsNum) > 1;
  }, [order]);

  /** 显示价格 */
  const displayPrice = useMemo(() => {
    if (!order) return 0;
    const pp = Number(order.payPrice);
    if (pp) return pp;
    return Number(order.orderPrice) + Number(order.deliveryPrice);
  }, [order]);

  /** 倒计时文案 */
  const countdownText = useMemo(() => {
    if (!order?.gmtCreate) return '';
    const status = Number(order.orderStatus);
    if (status !== OrderStatus.NOT_PAY) return '';
    const deadline = new Date(order.gmtCreate).getTime() + PAY_DEADLINE_MINUTES * 60 * 1000;
    const remaining = Math.max(0, Math.floor((deadline - now) / 1000));
    return formatCountdown(remaining);
  }, [order, now]);

  const handleCopyOrderNo = useCallback(() => {
    if (!order?.orderNo) return;
    Taro.setClipboardData({
      data: order.orderNo,
      success: () => Taro.showToast({ title: '订单编号已复制', icon: 'none' }),
    });
  }, [order]);

  const handleCancel = useCallback(async () => {
    if (!order) return;
    const res = await Taro.showModal({ title: '提示', content: '确定取消该订单吗？' });
    if (!res.confirm) return;
    try {
      await orderApi.cancelOnline({ cancelReason: '用户取消', orderId: String(order.pkId) });
      Taro.showToast({ title: '已取消', icon: 'success' });
      Taro.eventCenter.trigger('orders:refresh');
      Taro.navigateBack().catch(() => {});
    } catch {
      // 接口内部已展示错误
    }
  }, [order]);

  const handleDelete = useCallback(async () => {
    if (!order) return;
    const res = await Taro.showModal({ title: '提示', content: '确定删除该订单吗？' });
    if (!res.confirm) return;
    try {
      await orderApi.deleteByIdOnline(order.pkId);
      Taro.showToast({ title: '已删除', icon: 'success' });
      Taro.eventCenter.trigger('orders:refresh');
      Taro.navigateBack().catch(() => {});
    } catch {
      // 接口内部已展示错误
    }
  }, [order]);

  const handleViewLogistics = useCallback(() => {
    if (!order) return;
    setLogisticsOrder(order);
    Taro.navigateTo({ url: '/pages/logistics-detail/index' });
  }, [order]);

  const handlePay = useCallback(async () => {
    if (!order) return;
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
      Taro.eventCenter.trigger('orders:refresh');
      Taro.navigateBack().catch(() => {});
    } catch (err: any) {
      Taro.hideLoading();
      if (err?.errMsg?.includes('cancel')) {
        Taro.showToast({ title: '支付已取消', icon: 'none', duration: 1000 });
      } else {
        Taro.showToast({ title: err?.message || '支付失败', icon: 'none', duration: 1000 });
      }
    }
  }, [order]);

  /** 单品尺寸文本 */
  const specText = useMemo(() => {
    if (!order?.imgList?.[0]?.width || !order?.imgList?.[0]?.height) return '';
    return formatSizeLabel(order.imgList[0].width, order.imgList[0].height);
  }, [order]);

  /** 最新物流轨迹 */
  const latestTrace = useMemo(() => traceList[0], [traceList]);

  return {
    order,
    navTitle,
    isGroup,
    displayPrice,
    countdownText,
    specText,
    latestTrace,
    handleCopyOrderNo,
    handleCancel,
    handleDelete,
    handleViewLogistics,
    handlePay,
  };
}
