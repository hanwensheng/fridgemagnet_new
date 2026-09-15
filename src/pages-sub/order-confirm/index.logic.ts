import { useMemo, useRef, useState, useCallback } from 'react';
import Taro, { useDidShow, useUnload } from '@tarojs/taro';
import { addressApi } from '@/api/modules/address';
import { orderApi, type PriceInfo } from '@/api/modules/order';
import { productApi } from '@/api/modules/product';
import { useAppStore } from '@/store';
import type { AddressItem } from '@/api/modules/address';
import type { SpecItem } from '@/pages-sub/editor/index.logic';
import ProductImg from '@/assets/images/8.5_4cm.png';

export interface OrderItem {
  id: string;
  name: string;
  spec: string;
  quantity: number;
  price: number;
  originalPrice: number;
  discountAmount: number;
  discountTag?: string;
  image: string;
}

interface OrderData {
  specs: SpecItem[];
  uploadMap: Record<number, string>;
  uploadFileMap: Record<number, string>;
}

function parseOrderData(): OrderData | null {
  try {
    const raw = Taro.getStorageSync('orderData');
    console.log(
      '[confirm] parseOrderData raw:',
      raw
        ? { specsCount: raw.specs?.length, prices: raw.specs?.map((s: SpecItem) => s.price) }
        : null,
    );
    return raw || null;
  } catch (e) {
    console.error('[confirm] parseOrderData 失败:', e);
    return null;
  }
}

/** 促销规则：订单 ≥2 件时，最低价那件保持原价，其余按 8 折 */
const DISCOUNT_RATE = 0.8;
/** 满多少元包邮 */
const FREE_SHIPPING_AMOUNT = 40;
/** 运费兜底：接口废弃 / 取不到值时按 10 元 */
const DELIVERY_FEE_FALLBACK = 10;

/**
 * 取运费：优先用 getPrice 的 deliveryPrice；
 * 接口废弃、请求失败、字段为空或非法值时兜底 10 元（接口明确返回 0 则按 0 处理）。
 */
function resolveDeliveryFee(priceInfo: PriceInfo | null): number {
  const raw = priceInfo?.deliveryPrice;
  const fee = Number(raw);
  if (raw === null || raw === undefined || raw === '' || !Number.isFinite(fee)) {
    return DELIVERY_FEE_FALLBACK;
  }
  return fee;
}

/** pkId -> 线上最新价格 */
type FreshPriceMap = Record<string, number>;

/**
 * 取规格的实际单价：以线上最新价格为准，下单时快照价只作兜底。
 * - 拉到最新价（商品仍在售）→ 用最新价，出现差异时打日志便于排查
 * - 拉不到（接口失败 / 商品已下架）→ 回退到选择时的快照价，避免金额变 0
 */
function resolveEffectivePrice(spec: SpecItem, freshPrices: FreshPriceMap | null): number {
  const snapshot = Number(spec.price);
  const raw = freshPrices ? freshPrices[spec.id] : undefined;
  const fresh = Number(raw);

  if (Number.isFinite(fresh)) {
    if (Number.isFinite(snapshot) && Math.abs(fresh - snapshot) > 0.001) {
      console.warn(
        `[confirm] 商品 ${spec.id} 价格已更新，按最新价展示：快照 ${snapshot} → 最新 ${fresh}`,
      );
    }
    return fresh;
  }
  return Number.isFinite(snapshot) ? snapshot : 0;
}

/**
 * 构建商品列表：价格取商品价格（不再走 getPrice 的阶梯价）。
 * 规则：≥2 件时先遍历找出最低价（价格相同取遍历到的第一个）保持原价，其余按 8 折。
 * 注：getPrice 接口现在只用于取运费 deliveryPrice。
 */
function buildOrderItems(data: OrderData, freshPrices: FreshPriceMap | null): OrderItem[] {
  const specs = data.specs || [];
  // 先算出每条规格的实际单价（线上最新价优先），折扣与合计都基于它
  const basePrices = specs.map((spec) => resolveEffectivePrice(spec, freshPrices));

  // 最低价下标（单件时即 0，等于不参与折扣）
  const cheapestIndex = basePrices.reduce(
    (minIdx, price, i) => (price < basePrices[minIdx] ? i : minIdx),
    0,
  );

  const items = specs.map((spec, i) => {
    const originalPrice = basePrices[i];
    const discounted = i !== cheapestIndex;
    const price = discounted ? Number((originalPrice * DISCOUNT_RATE).toFixed(2)) : originalPrice;

    return {
      id: spec.id,
      name: spec.intro || spec.name,
      spec: spec.name,
      quantity: 1,
      price,
      originalPrice,
      discountAmount: Number((originalPrice - price).toFixed(2)),
      discountTag: discounted ? '8折' : undefined,
      image: data.uploadFileMap[spec.index] || ProductImg,
    };
  });

  console.log(
    '[confirm] buildOrderItems 价格:',
    items.map((i) => i.price),
  );
  return items;
}

export function useOrderConfirmLogic() {
  const [address, setAddress] = useState<AddressItem | null>(null);
  const [payPopupVisible, setPayPopupVisible] = useState(false);
  const [couponPopupVisible, setCouponPopupVisible] = useState(false);
  // getPrice 现在只用来取运费 deliveryPrice
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
  // 线上最新价格表：未拿到之前为 null（先用快照价渲染，拿到后自动刷新）
  const [freshPrices, setFreshPrices] = useState<FreshPriceMap | null>(null);
  const mounted = useRef(false);
  const paying = useRef(false);

  const orderData = useMemo(() => parseOrderData(), []);

  // 商品列表：价格取线上最新价（拉不到时回退快照价），≥2 件应用“最低价原价 + 其余 8 折”
  const orderItems: OrderItem[] = useMemo(() => {
    if (!orderData) return [];
    return buildOrderItems(orderData, freshPrices);
  }, [orderData, freshPrices]);

  const uploadFileMap = orderData?.uploadFileMap || {};

  const totalCount = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.quantity, 0),
    [orderItems],
  );

  // 商品实付合计（原价 + 8 折后价）
  const totalPrice = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [orderItems],
  );

  const originalTotal = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0),
    [orderItems],
  );

  // 优惠 = 原价总计 - 实付总计
  const totalDiscount = useMemo(
    () => Number((originalTotal - totalPrice).toFixed(2)),
    [originalTotal, totalPrice],
  );

  const isGroup = orderItems.length > 1;

  // 运费：满 40 元包邮（按折后商品金额判断），未满收接口返回的 deliveryPrice（取不到则兜底 10 元）
  const shippingFee = useMemo(() => {
    if (orderItems.length === 0) return 0;
    if (totalPrice >= FREE_SHIPPING_AMOUNT) return 0;
    return resolveDeliveryFee(priceInfo);
  }, [orderItems.length, totalPrice, priceInfo]);

  // 应付 = 商品总价 + 运费
  const finalTotal = useMemo(
    () => Number((totalPrice + shippingFee).toFixed(2)),
    [totalPrice, shippingFee],
  );

  // 配送服务文案
  const deliveryInfo = useMemo(() => {
    const isFreeShipping = shippingFee === 0;
    const now = new Date();
    const hour = now.getHours();
    const shipDay = hour >= 16 ? '明天' : '今天';

    let prefix = '京东 ';
    if (isFreeShipping) {
      prefix += '包邮 ';
    }
    return { prefix, shipText: `预计${shipDay}发货` };
  }, [shippingFee]);

  useDidShow(() => {
    if (!mounted.current) {
      mounted.current = true;
      Taro.removeStorageSync('orderData');

      // 只取运费：deliveryPrice（阶梯价 firstPrice/secondPrice/otherPrice 已废弃）
      orderApi
        .getPrice()
        .then(setPriceInfo)
        .catch(() => {});

      // 价格以线上为准：编辑器/草稿里存的 price 只是“选择时的快照”，
      // 草稿可能存了很久，后台调价后必须按最新价展示；取不到则沿用快照价。
      // 静默调用：不显示 loading、失败不弹网络提示。
      productApi
        .getGoodsList(undefined, { showLoading: false, showError: false })
        .then((goodsList) => {
          const map: FreshPriceMap = {};
          (goodsList || []).forEach((goods) => {
            const price = Number(goods?.price);
            if (goods?.pkId && Number.isFinite(price)) map[goods.pkId] = price;
          });
          console.log('[confirm] 线上最新价:', map);
          setFreshPrices(map);
        })
        .catch((err) => {
          console.warn('[confirm] 拉取最新价格失败，沿用快照价:', err);
        });

      Taro.removeStorageSync('selectedAddress');
      addressApi
        .findDefault(false)
        .then((data) => {
          if (data) setAddress(data);
        })
        .catch(() => {});
      return;
    }

    try {
      const stored = Taro.getStorageSync('selectedAddress');
      if (stored) {
        setAddress(stored as AddressItem);
      }
    } catch {}
  });

  useUnload(() => {
    Taro.removeStorageSync('selectedAddress');
  });

  const handleAddressClick = () => {
    Taro.navigateTo({ url: '/pages-sub/address/index?from=order-confirm' });
  };

  const handlePay = useCallback(async () => {
    if (paying.current) return;
    if (!address) {
      Taro.showToast({ title: '请先添加地址', icon: 'none' });
      return;
    }
    if (!orderData) return;

    paying.current = true;
    const { specs, uploadFileMap: fileMap } = orderData;

    // 收集已上传图片的文件路径和对应商品ID
    const filePaths: string[] = [];
    const goodsIds: string[] = [];
    specs.forEach((spec) => {
      const fp = fileMap[spec.index];
      if (fp) {
        filePaths.push(fp);
        goodsIds.push(spec.id);
      }
    });

    if (filePaths.length === 0) {
      Taro.showToast({ title: '请先上传图片', icon: 'none' });
      return;
    }

    Taro.showLoading({ title: '上传中...', mask: true });
    try {
      const uploadedUrls = await orderApi.uploadImages(filePaths);

      const imgList: { goodsId: string; imgLink: string }[] = goodsIds.map((id, i) => ({
        goodsId: id,
        imgLink: uploadedUrls[i],
      }));

      const fullAddress = `${address.province} ${address.city} ${address.district} ${address.detailAddress}`;

      Taro.showLoading({ title: '发起支付...', mask: true });

      // 扫码推广入口 → saveAppend，普通入口 → saveSingle
      const { merchantId, merchantPromoterId, merchantPackageId } = useAppStore.getState();
      const payResult = merchantId
        ? await orderApi.saveAppend({
            imgList,
            merchantId,
            merchantPackageId: merchantPackageId || '1',
            ...(merchantPromoterId ? { merchantPromoterId } : {}),
            address: fullAddress,
            recipient: address.recipient,
            recipientPhone: address.recipientPhone,
          })
        : await orderApi.saveSingle({
            imgList,
            address: fullAddress,
            recipient: address.recipient,
            recipientPhone: address.recipientPhone,
          });

      // 订单已生成，清除存储数据
      Taro.removeStorageSync('orderData');

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
      setPayPopupVisible(true);
      paying.current = false;
    } catch (err: any) {
      Taro.hideLoading();
      paying.current = false;
      const msg = err?.errMsg?.includes('cancel') ? '支付已取消' : err?.message || '支付失败';
      Taro.showToast({ title: msg, icon: 'none', duration: 1000 });
      setTimeout(() => {
        Taro.reLaunch({ url: '/pages-sub/my-orders/index?from=cancel-pay' }).catch(() => {});
      }, 1100);
    }
  }, [address, orderData]);

  const toggleCouponPopup = () => setCouponPopupVisible((prev) => !prev);
  const closePayPopup = () => setPayPopupVisible(false);
  const closeCouponPopup = () => setCouponPopupVisible(false);

  return {
    address,
    orderItems,
    uploadFileMap,
    totalCount,
    totalPrice,
    totalDiscount,
    originalTotal,
    finalTotal,
    isGroup,
    shippingFee,
    deliveryInfo,
    payPopupVisible,
    couponPopupVisible,
    handleAddressClick,
    handlePay,
    toggleCouponPopup,
    closePayPopup,
    closeCouponPopup,
  };
}
