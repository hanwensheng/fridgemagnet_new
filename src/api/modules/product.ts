import { request } from '../request';
import type { PaginatedData } from '../common';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
}

export interface ProductDetail extends Product {
  images: string[];
  specs: { label: string; value: string }[];
  stock: number;
}

/** 套餐订单信息（付款成功后获取） */
export interface BundleOrderInfo {
  orderId: string;
  bundleName: string;
  totalPrice: number;
  items: {
    slotId: string;
    size: string;
    widthCm: number;
    heightCm: number;
    description: string;
  }[];
}

/** 可选尺寸（用于额外购买） */
export interface AvailableSize {
  id: number;
  size: string;
  widthCm: number;
  heightCm: number;
  price: number;
  description: string;
}

/** 商品（BizGoodsBeanVO） */
export interface BizGoods {
  pkId: string;
  width: string;
  height: string;
  price: number;
  intro: string;
  isShow: string;
  sellNum: string;
  sellNum2: string;
  leftC: string;
  topC: string;
  gmtCreate: string;
  gmtModified: string;
  goodsImg: string;
}

/** 热门套餐 */
export interface PackageItem {
  currentPrice: number;
  deliveryPrice: number;
  deliveryType: string;
  gmtCreate: string;
  gmtModified: string;
  isShow: string;
  merchantId: string;
  merchantName: string;
  originalPrice: number;
  packageImg: string;
  packageName: string;
  pkId: string;
  sellNum: string;
  sellNum2: string;
}

export interface PackageListData {
  list: PackageItem[];
  total: string;
}

/** 套餐内商品 */
export interface PackageGoodsItem {
  gmtCreate: string;
  gmtModified: string;
  height: string;
  intro: string;
  leftC: string;
  merchantPackageId: string;
  pkId: string;
  price: number;
  sort: string;
  topC: string;
  width: string;
  goodsImg: string;
}

/** 套餐详情（含商品列表） */
export interface PackageDetailData extends PackageItem {
  goodsList: PackageGoodsItem[];
}

export interface BizWord {
  content: string;
  gmtCreate: string;
  isShow: string;
  pkId: string;
}

export interface BizWordListData {
  list: BizWord[];
  total: string;
}

export interface BizTimeFont {
  fontLink: string;
  gmtCreate: string;
  isShow: string;
  pkId: number;
  timeImg: string;
}

/** 商户信息（含用户手机后四位） */
export interface BizMerchantInfo {
  pkId: number;
  merchantName: string;
  merchantAddress: string;
  merchantImg: string;
  merchantPhone: string;
  merchantLinkman: string;
  merchantQrcode: string;
  packageNum: number;
  status: number;
  userPhone: string;
  gmtCreate: string;
  isDelete: number;
}

/** 热门设计作品 */
export interface BizPopularDesign {
  designImg: string;
  designName: string;
  designType: string;
  gmtCreate: string;
  gmtModified: string;
  height: string;
  isShow: string;
  pkId: string;
  showNum: string;
  sort: string;
  width: string;
}

export interface BizPopularDesignListData {
  list: BizPopularDesign[];
  total: string;
}

export const productApi = {
  /** 商品列表 */
  getList(params: { page?: number; pageSize?: number; category?: string }) {
    return request<PaginatedData<Product>>({
      url: '/product/list',
      data: params,
    });
  },

  /** 获取话语列表 */
  getWordList() {
    return request<BizWordListData>({
      url: '/v1/bizWord/findPageBySearch',
      method: 'POST',
      data: { isShow: 1, pageNum: 1, pageSize: 999 },
    });
  },

  /** 获取时间戳样式列表 */
  getTimeFontList() {
    return request<BizTimeFont[]>({
      url: '/v1/bizTimeFont/findAllBySearch',
      method: 'POST',
      data: { isShow: 1, pageNum: 1, pageSize: 999 },
    });
  },

  /** 商品详情 */
  getDetail(id: string) {
    return request<ProductDetail>({
      url: `/product/detail/${id}`,
    });
  },

  /** 获取套餐订单详情（付款成功后） */
  getBundleOrder(orderId: string) {
    return request<BundleOrderInfo>({
      url: `/product/bundle/${orderId}`,
    });
  },

  /** 获取可选尺寸列表（用于额外购买） */
  getAvailableSizes() {
    return request<AvailableSize[]>({
      url: '/product/sizes',
    });
  },

  /** 查询所有上架商品 */
  getGoodsList(params?: { isShow?: number; pageNum?: number; pageSize?: number }) {
    return request<BizGoods[]>({
      url: '/v1/bizGoods/findAllBySearch',
      method: 'POST',
      data: { isShow: 1, pageNum: 1, pageSize: 999, ...params },
    });
  },

  /** 获取热门套餐列表 */
  getPackageList(params?: {
    isShow?: string;
    merchantId?: string;
    pageNum?: number;
    pageSize?: number;
  }) {
    return request<PackageListData>({
      url: '/v1/bizMerchantPackage/findPageBySearch',
      method: 'POST',
      data: { isShow: '', merchantId: '', pageNum: 1, pageSize: 999, ...params },
    });
  },

  /** 根据id查询套餐详情与商品 */
  getPackageDetail(pkId: string) {
    return request<PackageDetailData>({
      url: `/v1/bizMerchantPackage/findById/${pkId}`,
    });
  },

  /** 查询商户信息与用户手机后四位 */
  getMerchantById(pkId: string | number) {
    return request<BizMerchantInfo>({
      url: `/v1/bizMerchant/findById/${pkId}`,
    });
  },

  /** 获取热门设计作品列表 */
  getPopularDesignList(params?: { pageNum?: number; pageSize?: number }) {
    return request<BizPopularDesignListData>({
      url: '/v1/bizPopularDesign/findPageBySearch',
      method: 'POST',
      data: { pageNum: 1, pageSize: 10, ...params },
    });
  },
};
