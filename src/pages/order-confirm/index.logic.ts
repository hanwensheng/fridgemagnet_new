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

/** 构建商品列表，价格均来自首页传递的规格单价 */
function buildOrderItems(data: OrderData): OrderItem[] {
  const items = data.specs.map((spec) => ({
    id: spec.id,
    name: spec.intro || spec.name,
    spec: spec.name,
    quantity: 1,
    price: spec.price || 0,
    originalPrice: spec.price || 0,
    discountAmount: 0,
    image: data.uploadFileMap[spec.index] || ProductImg,
  }));
  console.log(
    '[confirm] buildOrderItems 价格:',
    items.map((i) => i.price),
  );
  return items;
}

/** 为优惠弹层生成阶梯定价明细 */
function buildCouponItems(orderItems: OrderItem[], info: PriceInfo): OrderItem[] {
  const firstPrice = Number(info.firstPrice);
  const secondPrice = Number(info.secondPrice);
  const otherPrice = Number(info.otherPrice);

  if (!firstPrice || orderItems.length <= 1) return orderItems;

  return orderItems.map((item, i) => {
    if (i === 0) {
      return {
        ...item,
        price: firstPrice,
        discountAmount: item.originalPrice - firstPrice,
      };
    }
    if (i === 1) {
      const price = secondPrice || firstPrice;
      return {
        ...item,
        price,
        discountAmount: item.originalPrice - price,
        discountTag: `第2件，${price}元`,
      };
    }
    const price = otherPrice || firstPrice;
    return {
      ...item,
      price,
      discountAmount: item.originalPrice - price,
      discountTag: `第${i + 1}件，${price}元`,
    };
  });
}

export function useOrderConfirmLogic() {
  const [address, setAddress] = useState<AddressItem | null>(null);
  const [payPopupVisible, setPayPopupVisible] = useState(false);
  const [couponPopupVisible, setCouponPopupVisible] = useState(false);
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
  const mounted = useRef(false);

  const orderData = useMemo(() => parseOrderData(), []);

  // 商品列表：始终使用首页传递的原始价格
  const orderItems: OrderItem[] = useMemo(() => {
    if (!orderData) return [];
    return buildOrderItems(orderData);
  }, [orderData]);

  const uploadFileMap = orderData?.uploadFileMap || {};

  // 优惠弹层明细：应用 getPrice 阶梯价格
  const couponItems: OrderItem[] = useMemo(() => {
    if (!priceInfo || orderItems.length <= 1) return [];
    return buildCouponItems(orderItems, priceInfo);
  }, [orderItems, priceInfo]);

  const totalCount = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.quantity, 0),
    [orderItems],
  );

  // 总计 = 首页价格之和
  const totalPrice = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [orderItems],
  );

  // 优惠弹层总计 = 阶梯价格之和
  const couponTotalPrice = useMemo(
    () => couponItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [couponItems],
  );

  // 优惠金额 = 首页总计 - 阶梯总计
  const totalDiscount = useMemo(() => {
    if (couponItems.length === 0) return 0;
    return totalPrice - couponTotalPrice;
  }, [totalPrice, couponTotalPrice, couponItems.length]);

  const originalTotal = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0),
    [orderItems],
  );

  const isGroup = orderItems.length > 1;

  const shippingFee = useMemo(() => {
    if (orderItems.length >= 2) return 0;
    return priceInfo ? Number(priceInfo.deliveryPrice) : 0;
  }, [orderItems.length, priceInfo]);

  // 底部栏应付总计 = 商品总价 - 优惠 + 运费
  const finalTotal = useMemo(
    () => totalPrice - totalDiscount + shippingFee,
    [totalPrice, totalDiscount, shippingFee],
  );

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
    couponItems,
    uploadFileMap,
    totalCount,
    totalPrice,
    couponTotalPrice,
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
