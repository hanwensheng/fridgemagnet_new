import { useEffect, useMemo, useState } from 'react';
import type { MerchantOrder, OrderImgItem, TraceItem } from '@/api/modules/order';
import { orderApi } from '@/api/modules/order';
import { formatSizeLabel } from '@/utils/format';

/** 模块级订单数据传递 */
let currentOrder: MerchantOrder | null = null;

export function setLogisticsOrder(order: MerchantOrder) {
  currentOrder = order;
}

function getLogisticsOrder(): MerchantOrder | null {
  const o = currentOrder;
  currentOrder = null;
  return o;
}

export interface LogisticsDisplayData {
  courierName: string;
  trackingNumber: string;
  address: string;
  recipient: string;
  recipientPhone: string;
  isGroup: boolean;
  imgList: OrderImgItem[];
  goodsImage: string;
  goodsName: string;
  goodsSpec: string;
  goodsNum: number;
  payPrice: number;
  deliveryPrice: number;
  orderNo: string;
  createTime: string;
  timeline: LogisticsTimelineItem[];
}

export interface LogisticsTimelineItem {
  date: string;
  time: string;
  content: string;
  statusText: string;
  operationTime: string;
  active: boolean;
}

/** 将 TraceItem 列表转为时间线数据 */
function mapTraceToTimeline(traceList: TraceItem[]): LogisticsTimelineItem[] {
  return traceList.map((item, index) => {
    const [date, time] = item.operationTime.split(' ');
    const monthDay = date ? date.slice(5) : '';
    const shortTime = time ? time.slice(0, 5) : '';
    return {
      date: monthDay,
      time: shortTime,
      content: item.operationRemark,
      statusText: item.categoryName,
      operationTime: item.operationTime,
      active: index === 0,
    };
  });
}

/** 从 order 构建展示数据 */
function buildDisplayData(order: MerchantOrder, traceList: TraceItem[]): LogisticsDisplayData {
  const pp = Number(order.payPrice);
  const displayPrice = pp || Number(order.orderPrice) + Number(order.deliveryPrice);

  return {
    courierName: order.courier || '京东快递',
    trackingNumber: order.trackingNumber || '',
    address: order.address || '',
    recipient: order.recipient || '',
    recipientPhone: order.recipientPhone || '',
    isGroup: Number(order.goodsNum) > 1,
    imgList: order.imgList || [],
    goodsImage: order.orderImg || order.imgList?.[0]?.imgLink || '',
    goodsName: '冰箱贴一副',
    goodsSpec:
      order.imgList?.[0]?.width && order.imgList?.[0]?.height
        ? formatSizeLabel(order.imgList[0].width, order.imgList[0].height)
        : '',
    goodsNum: Number(order.goodsNum) || 1,
    payPrice: displayPrice,
    deliveryPrice: Number(order.deliveryPrice) || 0,
    orderNo: order.orderNo || '',
    createTime: order.gmtCreate || '',
    timeline: mapTraceToTimeline(traceList),
  };
}

export function useLogisticsDetailLogic() {
  const order = useMemo(() => getLogisticsOrder(), []);
  const [traceList, setTraceList] = useState<TraceItem[]>([]);

  useEffect(() => {
    if (!order?.trackingNumber) return;
    orderApi
      .getOrderTrace(order.trackingNumber)
      .then((res) => {
        setTraceList(Array.isArray(res) ? res : []);
      })
      .catch(() => {});
  }, [order?.trackingNumber]);

  const data = useMemo(() => {
    if (!order) return null;
    return buildDisplayData(order, traceList);
  }, [order, traceList]);

  return { data };
}
