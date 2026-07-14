import Taro, { useLoad } from '@tarojs/taro';
import { useCallback, useMemo, useState } from 'react';
import { buildRegionTree } from '@/api/modules/region-tree';
import { addressApi } from '@/api/modules/address';
import type { CascaderValue } from '@nutui/nutui-react-taro';

export interface AddressForm {
  name: string;
  phone: string;
  region: string;
  regionValue: CascaderValue;
  detail: string;
  isDefault: boolean;
}

export function useAddAddressLogic() {
  const [form, setForm] = useState<AddressForm>({
    name: '',
    phone: '',
    region: '',
    regionValue: [],
    detail: '',
    isDefault: false,
  });
  const [pkId, setPkId] = useState<string>('');
  const [isEdit, setIsEdit] = useState(false);
  const [cascaderVisible, setCascaderVisible] = useState(false);

  const regionOptions = useMemo(() => buildRegionTree(), []);

  useLoad((options: any) => {
    if (options?.id) {
      setIsEdit(true);
      setPkId(options.id);
      fetchAddressDetail(options.id);
    } else {
      checkAndSetDefault();
    }
  });

  const checkAndSetDefault = useCallback(async () => {
    try {
      const addresses = await addressApi.findAllBySearch(false);
      const hasNoAddress = !addresses || addresses.length === 0;
      setForm((prev) => ({ ...prev, isDefault: hasNoAddress }));
    } catch (error) {
      console.error('检查地址列表失败:', error);
    }
  }, []);

  const fetchAddressDetail = useCallback(async (id: string) => {
    try {
      const addresses = await addressApi.findAllBySearch();
      const address = addresses.find((addr) => addr.pkId === id);
      if (address) {
        setForm({
          name: address.recipient,
          phone: address.recipientPhone,
          region: `${address.province} ${address.city} ${address.district}`,
          regionValue: [address.province, address.city, address.district],
          detail: address.detailAddress,
          isDefault: address.isDefault === '1',
        });
      }
    } catch (error) {
      console.error('获取地址详情失败:', error);
    }
  }, []);

  const handleBack = useCallback(() => {
    Taro.navigateBack();
  }, []);

  const handleNameChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, name: value }));
  }, []);

  const handlePhoneChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, phone: value.replace(/\D/g, '').slice(0, 11) }));
  }, []);

  const handleRegionClick = useCallback(() => {
    setCascaderVisible(true);
  }, []);

  const handleCascaderClose = useCallback(() => {
    setCascaderVisible(false);
  }, []);

  const handleCascaderChange = useCallback((value: CascaderValue) => {
    const regionText = (value as string[]).join(' ');
    setForm((prev) => ({ ...prev, region: regionText, regionValue: value }));
    setCascaderVisible(false);
  }, []);

  const handleDetailChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, detail: value }));
  }, []);

  const handleDefaultToggle = useCallback(() => {
    setForm((prev) => ({ ...prev, isDefault: !prev.isDefault }));
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const { data } = await Taro.getClipboardData();
      if (!data) {
        Taro.showToast({ title: '剪贴板为空', icon: 'none' });
        return;
      }
      Taro.showLoading({ title: '识别中...' });
      try {
        const parsed = await addressApi.addressParse(data);
        Taro.hideLoading();
        if (!parsed) {
          Taro.showToast({ title: '未识别到地址信息', icon: 'none' });
          setForm((prev) => ({ ...prev, detail: data }));
          return;
        }
        const regionValue =
          parsed.province && parsed.city && parsed.district
            ? [parsed.province, parsed.city, parsed.district]
            : [];
        setForm((prev) => ({
          ...prev,
          name: parsed.name || prev.name,
          phone: String(parsed.phone || prev.phone)
            .replace(/\D/g, '')
            .slice(0, 11),
          region: regionValue.length > 0 ? regionValue.join(' ') : prev.region,
          regionValue: regionValue.length > 0 ? regionValue : prev.regionValue,
          detail: parsed.detail || data,
        }));
        Taro.showToast({ title: '已识别并填充', icon: 'success' });
      } catch {
        Taro.hideLoading();
        // 识别失败兜底：粘贴到详细地址
        setForm((prev) => ({ ...prev, detail: data }));
        Taro.showToast({ title: '未识别到地址信息', icon: 'none' });
      }
    } catch {
      Taro.showToast({ title: '读取剪贴板失败', icon: 'none' });
    }
  }, []);

  const handleUseWechatAddress = useCallback(() => {
    Taro.chooseAddress({
      success(res) {
        const regionValue = [res.provinceName, res.cityName, res.countyName];
        setForm((prev) => ({
          ...prev,
          name: res.userName,
          phone: res.telNumber.replace(/\D/g, '').slice(0, 11),
          region: regionValue.join(' '),
          regionValue,
          detail: res.detailInfo,
        }));
      },
      fail(err) {
        if (err.errMsg?.includes('deny') || err.errMsg?.includes('cancel')) {
          Taro.showToast({ title: '请授权获取地址', icon: 'none' });
        }
      },
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!form.name) {
      Taro.showToast({ title: '请输入收货人姓名', icon: 'none' });
      return;
    }
    if (!form.phone) {
      Taro.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (!/^1\d{10}$/.test(form.phone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    if (!form.region) {
      Taro.showToast({ title: '请选择所在地区', icon: 'none' });
      return;
    }
    if (!form.detail) {
      Taro.showToast({ title: '请输入详细地址', icon: 'none' });
      return;
    }

    const [province, city, district] = form.regionValue as string[];

    try {
      const params = {
        recipient: form.name,
        recipientPhone: form.phone,
        country: 86,
        province,
        city,
        district,
        detailAddress: form.detail,
        isDefault: form.isDefault ? '1' : '0',
        addressType: '家',
      };

      if (isEdit) {
        await addressApi.update({ ...params, pkId });
        Taro.showToast({ title: '修改成功', icon: 'success' });
      } else {
        await addressApi.save(params);
        Taro.showToast({ title: '添加成功', icon: 'success' });
      }
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch {
      Taro.showToast({ title: isEdit ? '修改失败，请重试' : '添加失败，请重试', icon: 'none' });
    }
  }, [form, isEdit, pkId]);

  const isValid = useMemo(() => {
    return !!(form.name && /^1\d{10}$/.test(form.phone) && form.region && form.detail);
  }, [form]);

  return {
    form,
    isEdit,
    cascaderVisible,
    regionOptions,
    isValid,
    handleBack,
    handleNameChange,
    handlePhoneChange,
    handleRegionClick,
    handleCascaderClose,
    handleCascaderChange,
    handleDetailChange,
    handleDefaultToggle,
    handlePaste,
    handleUseWechatAddress,
    handleSubmit,
  };
}
