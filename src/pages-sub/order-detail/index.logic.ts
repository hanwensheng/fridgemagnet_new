import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { orderApi, OrderStatus, TraceItem } from '@/api/modules/order';
import type { MerchantOrder } from '@/api/modules/order';
import { formatSizeLabel } from '@/utils/format';
import { setLogisticsOrder } from '@/pages-sub/logistics-detail/index.logic';

/** 支付倒计时（分钟） */
const PAY_DEADLINE_MINUTES = 15;

/** 退款倒计时（分钟） */
const REFUND_DEADLINE_MINUTES = 30;

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

/** MM:SS 格式化 */
function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function useOrderDetailLogic() {
  const router = useRouter();
  const pkId = router.params.pkId;

  const [order, setOrder] = useState<MerchantOrder | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [traceList, setTraceList] = useState<TraceItem[]>([]);

  const fetchOrder = useCallback(() => {
    if (!pkId) return;
    orderApi
      .findById(pkId)
      .then(setOrder)
      .catch(() => {});
  }, [pkId]);

  // 通过接口获取订单详情
  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // 监听地址修改成功后刷新数据
  useEffect(() => {
    const handler = () => fetchOrder();
    Taro.eventCenter.on('order-detail:refresh', handler);
    return () => {
      Taro.eventCenter.off('order-detail:refresh', handler);
    };
  }, [fetchOrder]);

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

  /** 倒计时文案及是否过期 */
  const countdown = useMemo(() => {
    if (!order?.gmtCreate) return { text: '', isExpired: true };
    const status = Number(order.orderStatus);
    if (status !== OrderStatus.NOT_PAY) return { text: '', isExpired: true };
    const maxSeconds = PAY_DEADLINE_MINUTES * 60;
    let deadline = new Date(order.gmtCreate).getTime() + maxSeconds * 1000;
    if (deadline > now + maxSeconds * 1000) {
      deadline = now + maxSeconds * 1000;
    }
    const remaining = Math.max(0, Math.floor((deadline - now) / 1000));
    return {
      text: formatCountdown(remaining),
      isExpired: remaining <= 0,
    };
  }, [order, now]);

  /** 退款倒计时：用 useRef 自减，避免 payTime 偏差和跨平台差异 */
  const refundRemainingRef = useRef(0);
  const [refundRemaining, setRefundRemaining] = useState(0);
  const refundTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!order?.payTime) return;
    const status = Number(order.orderStatus);
    if (status !== OrderStatus.TO_BE_SHIPPED) return;
    const maxSeconds = REFUND_DEADLINE_MINUTES * 60;
    let deadline = new Date(order.payTime).getTime() + maxSeconds * 1000;
    if (deadline > Date.now() + maxSeconds * 1000) {
      deadline = Date.now() + maxSeconds * 1000;
    }
    const initial = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
    refundRemainingRef.current = initial;
    setRefundRemaining(initial);

    if (refundTimerRef.current) clearInterval(refundTimerRef.current);
    refundTimerRef.current = setInterval(() => {
      refundRemainingRef.current = Math.max(0, refundRemainingRef.current - 1);
      setRefundRemaining(refundRemainingRef.current);
    }, 1000);

    return () => {
      if (refundTimerRef.current) {
        clearInterval(refundTimerRef.current);
        refundTimerRef.current = null;
      }
    };
  }, [order]);

  const refundCountdown = useMemo(
    () => ({
      text: formatCountdown(refundRemaining),
      isExpired: refundRemaining <= 0,
    }),
    [refundRemaining],
  );

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

  const handleRefund = useCallback(async () => {
    if (!order) return;
    const res = await Taro.showModal({ title: '提示', content: '确定申请退款吗？' });
    if (!res.confirm) return;
    try {
      await orderApi.refundOnline(order.pkId);
      Taro.showToast({ title: '退款申请已提交', icon: 'success' });
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

  const handleEditAddress = useCallback(() => {
    if (!order) return;
    Taro.navigateTo({
      url: `/pages-sub/address/index?from=order-detail&orderId=${order.pkId}&selectable=1`,
    });
  }, [order]);

  const handleViewLogistics = useCallback(() => {
    if (!order) return;
    setLogisticsOrder(order);
    Taro.navigateTo({ url: '/pages-sub/logistics-detail/index' });
  }, [order]);

  const handlePay = useCallback(async () => {
    if (!order) return;
    Taro.showLoading({ title: '发起支付...', mask: true });
    try {
      const payResult = order.merchantId
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

  /** 预计发货文案：付款时间16点前今天，16点后明天（仅待发货） */
  const estimatedShipText = useMemo(() => {
    if (!order?.payTime) return '';
    const status = Number(order.orderStatus);
    if (status !== OrderStatus.TO_BE_SHIPPED) return '';
    const payHour = new Date(order.payTime).getHours();
    return payHour < 16 ? '预计今天发货' : '预计明天发货';
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
    countdown,
    specText,
    estimatedShipText,
    latestTrace,
    handleCopyOrderNo,
    handleCancel,
    handleRefund,
    refundCountdown,
    handleDelete,
    handleEditAddress,
    handleViewLogistics,
    handlePay,
  };
}
