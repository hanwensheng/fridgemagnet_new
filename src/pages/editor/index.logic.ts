import Taro, { useDidShow } from '@tarojs/taro';
import { useState, useMemo, useCallback } from 'react';
import Tab7Img from '@/assets/images/tab_7_5.5.png';
import Tab8Img from '@/assets/images/tab_8.5_4.png';
import Tab4Img from '@/assets/images/tab_4.5_3.png';
import Tab7ImgA from '@/assets/images/tab_7_5.5_active.png';
import Tab8ImgA from '@/assets/images/tab_8.5_4_active.png';
import Tab4ImgA from '@/assets/images/tab_4.5_3_active.png';
import IconCopy from '@/assets/svgs/icon_copy.svg';
import IconNew from '@/assets/svgs/icon_new.svg';
import IconDel from '@/assets/svgs/icon_del.svg';
import PreviewBg85 from '@/assets/svgs/icon_preview_bg_8.5_4.svg';
import PreviewBg75 from '@/assets/svgs/icon_preview_bg_7_5.5.svg';
import PreviewBg34 from '@/assets/svgs/icon_preview_bg_3_4.5.svg';
import type { SelectedSpec } from '@/components/spec-select-popup';

export interface SizeOption {
  id: string;
  label: string;
  image: string;
  activeImage: string;
  displayWidth: number;
  displayHeight: number;
}

export const SIZE_OPTIONS: SizeOption[] = [
  {
    id: '7x5.5',
    label: '7*5.5cm',
    image: Tab7Img,
    activeImage: Tab7ImgA,
    displayWidth: 36,
    displayHeight: 34,
  },
  {
    id: '8.5x4',
    label: '8.5*4cm',
    image: Tab8Img,
    activeImage: Tab8ImgA,
    displayWidth: 59,
    displayHeight: 34,
  },
  {
    id: '4.5x3',
    label: '3*4.5cm',
    image: Tab4Img,
    activeImage: Tab4ImgA,
    displayWidth: 23,
    displayHeight: 34,
  },
];

/** 尺寸名 -> SIZE_OPTIONS 映射，用于匹配 tab 图片 */
export function findSizeOption(name: string): SizeOption | undefined {
  return SIZE_OPTIONS.find((opt) => opt.label === name);
}

/** 规格名 -> 预览花边背景图 */
const PREVIEW_BG_MAP: Record<string, string> = {
  '8.5*4cm': PreviewBg85,
  '7*5.5cm': PreviewBg75,
  '3*4.5cm': PreviewBg34,
};

export function getPreviewBg(name: string): string {
  return PREVIEW_BG_MAP[name] || PREVIEW_BG_MAP[findSizeOption(name)?.label || ''] || PreviewBg85;
}

/** 规格名 -> class 后缀，SCSS 中 px 值会被 Taro 转为 rpx 随屏缩放 */
const PREVIEW_CLASS_MAP: Record<string, string> = {
  '8.5*4cm': '85x4',
  '7*5.5cm': '75x55',
  '3*4.5cm': '34x45',
};

export function getPreviewClass(name: string): string {
  return PREVIEW_CLASS_MAP[name] || PREVIEW_CLASS_MAP[findSizeOption(name)?.label || ''] || '85x4';
}

/** 裁剪结果临时存储 key */
const CROP_RESULT_KEY = 'editor_crop_result';

export interface SpecItem {
  index: number;
  id: string;
  name: string;
  price: number;
  intro: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 'copy', label: '复制这个', icon: IconCopy },
  { id: 'new', label: '新建一个', icon: IconNew },
  { id: 'delete', label: '删除这个', icon: IconDel },
];

function parseSpecsFromRouter(): SpecItem[] {
  try {
    const instance = Taro.getCurrentInstance();
    const raw = instance.router?.params?.specs;
    if (!raw) return [];
    const parsed: { id: string; name: string; price: number; intro: string }[] = JSON.parse(
      decodeURIComponent(raw),
    );
    return parsed.map((item, index) => ({ ...item, index }));
  } catch {
    return [];
  }
}

export function useEditorLogic() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [uploadMap, setUploadMap] = useState<Record<number, string>>({});
  const [completedMap, setCompletedMap] = useState<Record<number, boolean>>({});
  const [menuVisible, setMenuVisible] = useState(false);
  const initialList = useMemo(() => parseSpecsFromRouter(), []);
  const [specList, setSpecList] = useState<SpecItem[]>(initialList);
  const [nextIndex, setNextIndex] = useState<number>(initialList.length);
  const [specPopupVisible, setSpecPopupVisible] = useState(false);
  const [specPopupKey, setSpecPopupKey] = useState(0);

  const activeItem = specList[activeIndex] || null;
  const isSingle = specList.length === 1;
  const allUploaded = specList.every((item) => uploadMap[item.index]);
  const currentHasImage = activeItem ? !!uploadMap[activeItem.index] : false;

  /** 跳转裁剪页 */
  const navigateToCrop = (itemIndex: number, imageUrl: string) => {
    Taro.navigateTo({
      url: `/pages/editor-crop/index?imageUrl=${encodeURIComponent(imageUrl)}&itemIndex=${itemIndex}`,
    });
  };

  const handleChooseImage = (itemIndex: number) => {
    const existingImage = uploadMap[itemIndex];
    if (existingImage) {
      // 已有图片 → 直接进入编辑页
      navigateToCrop(itemIndex, existingImage);
      return;
    }
    // 无图片 → 先选择再进入编辑页
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const imageUrl = res.tempFilePaths[0];
        setUploadMap((prev) => ({ ...prev, [itemIndex]: imageUrl }));
        navigateToCrop(itemIndex, imageUrl);
      },
    });
  };

  // 从裁剪页返回时接收结果
  useDidShow(() => {
    const result = Taro.getStorageSync(CROP_RESULT_KEY);
    if (!result) return;
    Taro.removeStorageSync(CROP_RESULT_KEY);
    const { itemIndex, imageUrl, clear } = result;
    if (clear) {
      setUploadMap((prev) => {
        const next = { ...prev };
        delete next[itemIndex];
        return next;
      });
      setCompletedMap((prev) => {
        const next = { ...prev };
        delete next[itemIndex];
        return next;
      });
    } else if (imageUrl) {
      setUploadMap((prev) => ({ ...prev, [itemIndex]: imageUrl }));
    }
  });

  const handleMenuClick = (id: string) => {
    setMenuVisible(false);
    if (id === 'copy') {
      if (activeItem) {
        const newIndex = nextIndex;
        const copyItem: SpecItem = { ...activeItem, index: newIndex };
        setNextIndex(newIndex + 1);
        const newList = [...specList];
        newList.splice(activeIndex + 1, 0, copyItem);
        setSpecList(newList);
        setActiveIndex(activeIndex + 1);
        if (uploadMap[activeItem.index]) {
          setUploadMap((prev) => ({ ...prev, [newIndex]: prev[activeItem.index] }));
        }
      }
      Taro.showToast({ title: '已复制', icon: 'none' });
    } else if (id === 'new') {
      setSpecPopupVisible(true);
    } else if (id === 'delete') {
      if (activeItem && specList.length > 1) {
        setUploadMap((prev) => {
          const next = { ...prev };
          delete next[activeItem.index];
          return next;
        });
        setCompletedMap((prev) => {
          const next = { ...prev };
          delete next[activeItem.index];
          return next;
        });
        const newList = [...specList];
        newList.splice(activeIndex, 1);
        setSpecList(newList);
        setActiveIndex(Math.min(activeIndex, newList.length - 1));
        Taro.showToast({ title: '已删除', icon: 'none' });
      } else {
        Taro.showToast({ title: '至少保留一个规格', icon: 'none' });
      }
    }
  };

  const closeSpecPopup = () => {
    setSpecPopupVisible(false);
    setSpecPopupKey((prev) => prev + 1);
  };

  const handleSpecAdd = useCallback(
    (selectedItems: SelectedSpec[]) => {
      if (selectedItems.length === 0) return;
      const expanded: SpecItem[] = [];
      let idx = nextIndex;
      selectedItems.forEach((item) => {
        for (let i = 0; i < item.quantity; i++) {
          expanded.push({
            index: idx,
            id: item.id,
            name: item.name,
            price: item.price,
            intro: item.intro,
          });
          idx++;
        }
      });
      setNextIndex(idx);
      setSpecList((prev) => [...prev, ...expanded]);
      closeSpecPopup();
    },
    [nextIndex],
  );

  const handleSpecPopupClose = () => {
    closeSpecPopup();
  };

  const handleConfirm = () => {
    if (!activeItem || !uploadMap[activeItem.index]) {
      Taro.showToast({ title: '请先上传图片', icon: 'none' });
      return;
    }
    setCompletedMap((prev) => ({ ...prev, [activeItem.index]: true }));
    Taro.showToast({ title: '保存成功', icon: 'success' });
  };

  const handleSubmit = () => {
    Taro.navigateTo({ url: '/pages/order-confirm/index' });
  };

  const toggleMenu = (e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    setMenuVisible((prev) => !prev);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  return {
    activeIndex,
    setActiveIndex,
    uploadMap,
    completedMap,
    menuVisible,
    closeMenu,
    specList,
    specPopupVisible,
    specPopupKey,
    activeItem,
    isSingle,
    allUploaded,
    currentHasImage,
    handleChooseImage,
    handleMenuClick,
    handleSpecAdd,
    handleSpecPopupClose,
    handleConfirm,
    handleSubmit,
    toggleMenu,
  };
}
