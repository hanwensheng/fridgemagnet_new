import { useMemo, useRef, useState } from 'react';
import Taro, { useDidShow, useUnload } from '@tarojs/taro';
import { addressApi } from '@/api/modules/address';
import { orderApi, type PriceInfo } from '@/api/modules/order';
import type { AddressItem } from '@/api/modules/address';
import type { SpecItem } from '@/pages/editor/index.logic';
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

/** 构建商品列表，价格来自 orderApi 阶梯定价 */
function buildOrderItems(data: OrderData, priceInfo: PriceInfo | null): OrderItem[] {
  const count = data.specs.length;
  const applyTiered = count > 1 && priceInfo;
  const firstPrice = applyTiered ? Number(priceInfo.firstPrice) : 0;
  const secondPrice = applyTiered ? Number(priceInfo.secondPrice) : 0;
  const otherPrice = applyTiered ? Number(priceInfo.otherPrice) : 0;
  // 参考原价均使用 orderApi.firstPrice
  const refPrice = priceInfo ? Number(priceInfo.firstPrice) : data.specs[0]?.price || 0;

  const items = data.specs.map((spec, i) => {
    let price: number;
    let discountAmount = 0;
    let discountTag: string | undefined;

    if (applyTiered) {
      if (i === 0) {
        price = firstPrice;
      } else if (i === 1) {
        price = secondPrice;
        discountAmount = refPrice - secondPrice;
        discountTag = `第2件，${price}元`;
      } else {
        price = otherPrice;
        discountAmount = refPrice - otherPrice;
        discountTag = `第${i + 1}件，${price}元`;
      }
    } else {
      price = refPrice;
    }

    return {
      id: spec.id,
      name: spec.intro || spec.name,
      spec: spec.name,
      quantity: 1,
      price,
      originalPrice: refPrice,
      discountAmount,
      discountTag,
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
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
  const mounted = useRef(false);

  const orderData = useMemo(() => parseOrderData(), []);

  // 商品列表：priceInfo 就绪后应用阶梯定价
  const orderItems: OrderItem[] = useMemo(() => {
    if (!orderData) return [];
    return buildOrderItems(orderData, priceInfo);
  }, [orderData, priceInfo]);

  const uploadFileMap = orderData?.uploadFileMap || {};

  const totalCount = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.quantity, 0),
    [orderItems],
  );

  // 商品总价（阶梯价之和）
  const totalPrice = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [orderItems],
  );

  const originalTotal = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0),
    [orderItems],
  );

  // 优惠 = 原价总计 - 阶梯价总计
  const totalDiscount = useMemo(() => originalTotal - totalPrice, [originalTotal, totalPrice]);

  const isGroup = orderItems.length > 1;

  // 运费：1件收 deliveryPrice，>1件免运费
  const shippingFee = useMemo(() => {
    if (orderItems.length >= 2) return 0;
    return priceInfo ? Number(priceInfo.deliveryPrice) : 0;
  }, [orderItems.length, priceInfo]);

  // 应付 = 商品总价 + 运费
  const finalTotal = useMemo(() => totalPrice + shippingFee, [totalPrice, shippingFee]);

  useDidShow(() => {
    if (!mounted.current) {
      mounted.current = true;
      Taro.removeStorageSync('orderData');

      orderApi
        .getPrice()
        .then(setPriceInfo)
        .catch(() => {});

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
    Taro.navigateTo({ url: '/pages/address/index?from=order-confirm' });
  };

  const handlePay = () => {
    if (!address) {
      Taro.showToast({ title: '请先添加地址', icon: 'none' });
      return;
    }
    setPayPopupVisible(true);
  };

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
    payPopupVisible,
    couponPopupVisible,
    handleAddressClick,
    handlePay,
    toggleCouponPopup,
    closePayPopup,
    closeCouponPopup,
  };
}
