import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import { useCallback, useMemo, useState } from 'react';
import { addressApi } from '@/api/modules/address';
import type { AddressItem } from '@/api/modules/address';

function getStoredSelectedAddress(): AddressItem | null {
  try {
    const stored = Taro.getStorageSync('selectedAddress');
    return stored || null;
  } catch {
    return null;
  }
}

export function useAddressLogic() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressItem | null>(() =>
    getStoredSelectedAddress(),
  );

  const isSelectable = useMemo(() => {
    return router.params.from === 'order-confirm' || router.params.selectable === '1';
  }, [router.params]);

  const fetchAddresses = useCallback(async (showLoading = true) => {
    try {
      const data = await addressApi.findAllBySearch(showLoading);
      setAddresses(data || []);
    } catch (error) {
      console.error('获取地址列表失败:', error);
    }
  }, []);

  const handleBack = useCallback(() => {
    Taro.navigateBack().catch(() => {});
  }, []);

  const handleSelectAddress = useCallback(
    (address: AddressItem) => {
      if (!isSelectable) return;
      Taro.setStorageSync('selectedAddress', address);
      setSelectedAddress(address);
      // 延迟返回，留一帧让 React 渲染红对号后再跳走
      setTimeout(() => {
        Taro.navigateBack();
      }, 150);
    },
    [isSelectable],
  );

  const handleAdd = useCallback(() => {
    Taro.navigateTo({ url: '/pages/add-address/index' });
  }, []);

  const handleEdit = useCallback((pkId: string) => {
    Taro.navigateTo({ url: `/pages/add-address/index?id=${pkId}` });
  }, []);

  const handleDelete = useCallback(async (pkId: string) => {
    Taro.showModal({
      title: '提示',
      content: '确定删除该地址吗？',
    }).then(async (res) => {
      if (!res.confirm) return;
      try {
        await addressApi.deleteAddress(pkId);
        setAddresses((prev) => prev.filter((addr) => addr.pkId !== pkId));
        Taro.showToast({ title: '删除成功', icon: 'success' });
      } catch {
        Taro.showToast({ title: '删除失败', icon: 'none' });
      }
    });
  }, []);

  const handleCopy = useCallback((address: AddressItem) => {
    const text = `${address.province} ${address.city} ${address.district} ${address.detailAddress} ${address.recipient} ${address.recipientPhone}`;
    Taro.setClipboardData({ data: text }).then(() => {
      Taro.showToast({ title: '复制成功', icon: 'none' });
    });
  }, []);

  const handleSetDefault = useCallback(
    async (pkId: string) => {
      const address = addresses.find((addr) => addr.pkId === pkId);
      if (!address) return;

      const newIsDefault = address.isDefault === '1' ? '0' : '1';
      try {
        await addressApi.update(
          {
            pkId,
            recipient: address.recipient,
            recipientPhone: address.recipientPhone,
            country: 86,
            province: address.province,
            city: address.city,
            district: address.district,
            detailAddress: address.detailAddress,
            isDefault: newIsDefault,
            addressType: address.addressType,
          },
          false,
        );
        await fetchAddresses(false);
        Taro.showToast({
          title: newIsDefault === '1' ? '设置成功' : '取消成功',
          icon: 'success',
        });
      } catch {
        Taro.showToast({ title: '设置失败', icon: 'none' });
      }
    },
    [addresses, fetchAddresses],
  );

  useDidShow(() => {
    fetchAddresses();
  });

  const isSelected = useCallback(
    (pkId: string) => selectedAddress?.pkId === pkId,
    [selectedAddress],
  );

  return {
    addresses,
    isSelectable,
    selectedAddress,
    isSelected,
    handleBack,
    handleAdd,
    handleEdit,
    handleDelete,
    handleCopy,
    handleSetDefault,
    handleSelectAddress,
  };
}
