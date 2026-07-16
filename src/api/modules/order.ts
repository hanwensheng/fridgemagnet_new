import { request, uploadImage, uploadImages } from '../request';
import type { PaginatedData } from '../common';

export interface OrderItem {
  productId: string;
  productName: string;
  image: string;
  price: number;
  quantity: number;
  size: string;
}

export interface Order {
  id: string;
  orderNo: string;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  items: OrderItem[];
  totalPrice: number;
  createTime: string;
}

export interface CreateOrderParams {
  items: {
    productId: string;
    quantity: number;
    size: string;
    designData: any;
  }[];
  addressId: string;
  remark?: string;
}

export interface SaveOrderParams {
  merchantId: string;
  merchantPackageId: string;
  merchantPromoterId?: string;
}

export interface WechatPayParams {
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: string;
  paySign: string;
  appId: string;
}

export interface SaveOrderResult {
  orderId: string;
  orderNo: string;
  payParams: WechatPayParams;
  [key: string]: any;
}

export interface UpdateBaseParams {
  orderId: string;
  imgList: {
    goodsId: string;
    imgLink: string;
  }[];
  merchantPromoterId?: string;
  address?: string;
  recipient?: string;
  recipientPhone?: string;
}

export interface SaveAppendParams {
  imgList: {
    goodsId: string;
    imgLink: string;
  }[];
  merchantId: string;
  merchantPackageId: string;
  merchantPromoterId?: string;
  address?: string;
  recipient?: string;
  recipientPhone?: string;
}

export interface SaveSingleParams {
  imgList: {
    goodsId: string;
    imgLink: string;
  }[];
  address: string;
  recipient: string;
  recipientPhone: string;
}

export interface CancelOrderParams {
  cancelReason: string;
  orderId: string;
}

/** 订单状态 */
export const OrderStatus = {
  NOT_PAY: 0,
  COMPLETED: 1,
  REFUNDED: 2,
  TO_BE_SHIPPED: 3,
  TO_BE_RECEIVED: 4,
  CANCELED: 5,
  APPLY_REFUND: 6,
  CLOSED: 7,
  TO_BE_UPLOAD: 8,
} as const;

export type OrderStatusValue = (typeof OrderStatus)[keyof typeof OrderStatus];

/** 订单商品图片 */
export interface OrderImgItem {
  gmtCreate: string;
  gmtModified: string;
  goodsId: string;
  height?: string;
  imgLink: string;
  pkId: number;
  width?: string;
}

/** 商户订单 */
export interface MerchantOrder {
  address: string;
  cancelReason: string;
  cancelTime: string;
  closeTime: string;
  courier: string;
  deliveryPrice: number;
  deliveryTime: string;
  deliveryPromiseTime: string;
  finishTime: string;
  gmtCreate: string;
  gmtModified: string;
  goodsNum: number;
  goodsPrice: number;
  imgList?: OrderImgItem[];
  isDelete: number;
  isReview: number;
  merchantId: string;
  merchantName: string;
  merchantPackageId: string;
  merchantPackageName: string;
  orderImg: string;
  orderNo: string;
  orderPrice: number;
  orderSource: string;
  orderStatus: OrderStatusValue | string;
  orderType: number;
  payPrice: number;
  payStatus: number;
  payTime: string;
  pkId: number;
  recipient: string;
  recipientPhone: string;
  refundTime: string;
  trackingNumber: string;
  uploadTime: string;
  userId: string;
  userPhone: string;
}

/** 物流轨迹项 */
export interface TraceItem {
  category: number;
  categoryName: string;
  operationRemark: string;
  operationTime: string;
  operationTitle: string;
  operatorName: string;
  state: string;
  waybillCode: string;
}

export interface PriceInfo {
  /** 第一件价格 */
  firstPrice: string;
  /** 第二件价格 */
  secondPrice: string;
  /** 第三件起价格 */
  otherPrice: string;
  /** 邮费 */
  deliveryPrice: string;
}

export const orderApi = {
  /** 获取阶梯价格信息 */
  getPrice() {
    return request<PriceInfo>({
      url: '/v1/bizOrder/getPrice',
      showLoading: false,
    });
  },

  /** 创建订单 */
  create(data: CreateOrderParams) {
    return request<Order>({
      url: '/order/create',
      method: 'POST',
      data,
    });
  },

  /** 创建套餐订单 */
  saveBease(data: SaveOrderParams) {
    return request<SaveOrderResult>({
      url: '/v1/bizMerchantOrder/saveBease',
      method: 'POST',
      data,
    });
  },

  /** 订单列表 */
  getList(params: { page?: number; pageSize?: number; status?: string }) {
    return request<PaginatedData<Order>>({
      url: '/order/list',
      data: params,
    });
  },

  /** 订单详情 */
  getDetail(id: string) {
    return request<Order>({
      url: `/order/detail/${id}`,
    });
  },

  /** 取消订单 */
  cancel(data: CancelOrderParams) {
    return request({
      url: '/v1/bizMerchantOrder/cancel',
      method: 'POST',
      data,
    });
  },

  /** 删除订单 */
  deleteById(pkId: string | number) {
    return request({
      url: `/v1/bizMerchantOrder/deleteById/${pkId}`,
      method: 'POST',
    });
  },

  /** 确认收货 */
  confirmReceipt(pkId: string | number) {
    return request({
      url: `/v1/bizMerchantOrder/confirmReceipt/${pkId}`,
      method: 'POST',
    });
  },

  /** 套餐支付 */
  payOrder(orderPkId: string | number) {
    return request<SaveOrderResult>({
      url: `/v1/bizMerchantOrder/payOrder/${orderPkId}`,
      method: 'POST',
    });
  },

  /** 更新基础订单图片 */
  updateBase(data: UpdateBaseParams) {
    return request<any>({
      url: '/v1/bizMerchantOrder/updateBase',
      method: 'POST',
      data,
      showLoading: false,
    });
  },

  /** 追加订单保存，返回支付信息 */
  saveAppend(data: SaveAppendParams) {
    return request<SaveOrderResult>({
      url: '/v1/bizMerchantOrder/saveAppend',
      method: 'POST',
      data,
      showLoading: false,
    });
  },

  /** 单商品支付 */
  saveSingle(data: SaveSingleParams) {
    return request<SaveOrderResult>({
      url: '/v1/bizOrder/saveAppend',
      method: 'POST',
      data,
    });
  },

  /** 查询商户订单列表 */
  findAllBySearch(data?: { pageNum?: number; pageSize?: number }) {
    return request<MerchantOrder[]>({
      url: '/v1/bizMerchantOrder/findAllBySearch',
      method: 'POST',
      data: data ?? {},
    });
  },

  /** 查询线上订单列表 */
  findAllBySearchOnline(data?: { pageNum?: number; pageSize?: number; orderStatus?: number }) {
    return request<MerchantOrder[]>({
      url: '/v1/bizOrder/findAllBySearch',
      method: 'POST',
      data: data ?? {},
    });
  },

  /** 取消线上订单 */
  cancelOnline(data: CancelOrderParams) {
    return request({
      url: '/v1/bizOrder/cancel',
      method: 'POST',
      data,
    });
  },

  /** 删除线上订单 */
  deleteByIdOnline(pkId: string | number) {
    return request({
      url: `/v1/bizOrder/deleteById/${pkId}`,
      method: 'POST',
    });
  },

  /** 线上订单确认收货 */
  confirmReceiptOnline(pkId: string | number) {
    return request({
      url: `/v1/bizOrder/confirmReceipt/${pkId}`,
      method: 'POST',
    });
  },

  /** 线上订单支付 */
  payOrderOnline(orderPkId: string | number) {
    return request<SaveOrderResult>({
      url: `/v1/bizOrder/payOrder/${orderPkId}`,
      method: 'POST',
    });
  },

  /** 查询物流轨迹 */
  getOrderTrace(jdWayBillCode: string) {
    return request<TraceItem[]>({
      url: `/v1/bizOrder/getOrderTrace/${jdWayBillCode}`,
    });
  },

  /** 上传图片 */
  uploadImage,

  /** 批量上传图片 */
  uploadImages,
};
