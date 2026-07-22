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
import {
  getCropResult,
  setCropResult,
  getCropState,
  removeCropState,
  clearAllCropState,
} from './crop-state';

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
  const direct = SIZE_OPTIONS.find((opt) => opt.label === name);
  if (direct) return direct;
  // 后端返回的宽高可能互换（如 55x70 vs 70x55），尝试反转后匹配
  try {
    const match = name.match(/^([\d.]+)\*([\d.]+)cm$/);
    if (match) {
      const reversed = `${parseFloat(match[2])}*${parseFloat(match[1])}cm`;
      return SIZE_OPTIONS.find((opt) => opt.label === reversed);
    }
  } catch {}
  return undefined;
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

/** 上传区尺寸（设计稿 px），用于传递给裁剪页 */
const UPLOAD_AREA_SIZE: Record<string, { w: number; h: number }> = {
  '85x4': { w: 299, h: 202 },
  '75x55': { w: 235, h: 299 },
  '34x45': { w: 200, h: 299 },
};

/** 预览图显示尺寸，用于生成花边框贴合用的预览图 */
const PREVIEW_IMG_SIZE: Record<string, { w: number; h: number }> = {
  '85x4': { w: 250, h: 155 },
  '75x55': { w: 182, h: 250 },
  '34x45': { w: 154, h: 250 },
};

export function getUploadAreaSize(name: string) {
  const cls = getPreviewClass(name);
  return UPLOAD_AREA_SIZE[cls] || { w: 299, h: 202 };
}

function getPreviewImgSize(name: string) {
  const cls = getPreviewClass(name);
  return PREVIEW_IMG_SIZE[cls] || { w: 250, h: 155 };
}

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
    const result = parsed.map((item, index) => ({ ...item, index }));
    console.log(
      '[editor] parseSpecsFromRouter 价格:',
      result.map((s) => s.price),
    );
    return result;
  } catch (e) {
    console.error('[editor] parseSpecsFromRouter 失败:', e);
    return [];
  }
}

/** 从 storage 读取草稿完整数据 */
function loadDraftData(): Record<string, any> | null {
  try {
    const instance = Taro.getCurrentInstance();
    const draftId = instance.router?.params?.draftId;
    if (!draftId) return null;
    const drafts = Taro.getStorageSync('fridge_magnet_editor_drafts');
    if (!Array.isArray(drafts)) return null;
    return drafts.find((d: any) => d && d.id === draftId) || null;
  } catch {
    return null;
  }
}

export function useEditorLogic() {
  const draftData = useMemo(() => loadDraftData(), []);
  /** 编辑已有草稿时的草稿 id；从首页进入时为 null */
  const editingDraftId = useMemo(() => {
    try {
      return Taro.getCurrentInstance().router?.params?.draftId || null;
    } catch {
      return null;
    }
  }, []);
  // 非草稿恢复场景：清除模块级裁剪状态，防止上一轮编辑的变换/原图污染新会话
  // cropStateMap 是模块级 Map，跨页面跳转持久存在，但 itemIndex 会重新分配导致复用冲突
  if (!draftData) {
    clearAllCropState();
  }
  const initialList = useMemo(() => {
    if (draftData) return (draftData.specList as SpecItem[]) || [];
    return parseSpecsFromRouter();
  }, [draftData]);

  const [activeIndex, setActiveIndex] = useState<number>(
    draftData ? (draftData.activeIndex as number) || 0 : 0,
  );
  const [uploadMap, setUploadMap] = useState<Record<number, string>>(
    draftData ? (draftData.uploadMap as Record<number, string>) || {} : {},
  );
  /** 上传用图（工作区实物比例），区别于 uploadMap 的预览图 */
  const [uploadFileMap, setUploadFileMap] = useState<Record<number, string>>(
    draftData ? (draftData.uploadFileMap as Record<number, string>) || {} : {},
  );
  const [completedMap, setCompletedMap] = useState<Record<number, boolean>>(
    draftData ? (draftData.completedMap as Record<number, boolean>) || {} : {},
  );
  const [menuVisible, setMenuVisible] = useState(false);
  const [exitPopupVisible, setExitPopupVisible] = useState(false);
  const [specList, setSpecList] = useState<SpecItem[]>(initialList);
  const [nextIndex, setNextIndex] = useState<number>(() => {
    if (draftData) {
      const list = (draftData.specList as SpecItem[]) || [];
      return list.length > 0 ? Math.max(...list.map((s) => s.index)) + 1 : initialList.length;
    }
    return initialList.length;
  });
  const [specPopupVisible, setSpecPopupVisible] = useState(false);
  const [specPopupKey, setSpecPopupKey] = useState(0);

  const activeItem = specList[activeIndex] || null;
  const isSingle = specList.length === 1;
  const shouldCenter = specList.length <= 2;
  const allUploaded = specList.every((item) => uploadMap[item.index]);
  const currentHasImage = activeItem ? !!uploadMap[activeItem.index] : false;

  /** 跳转裁剪页 */
  const navigateToCrop = (itemIndex: number, imageUrl: string, specName: string) => {
    const size = getUploadAreaSize(specName);
    const preview = getPreviewImgSize(specName);
    Taro.navigateTo({
      url: `/pages-sub/editor-crop/index?imageUrl=${encodeURIComponent(imageUrl)}&itemIndex=${itemIndex}&width=${size.w}&height=${size.h}&previewW=${preview.w}&previewH=${preview.h}`,
    });
  };

  const handleChooseImage = (itemIndex: number) => {
    const specItem = specList.find((s) => s.index === itemIndex);
    const specName = specItem?.name || '8.5*4cm';
    const existingImage = uploadMap[itemIndex];
    if (existingImage) {
      // 已有图片 → 进入编辑页，优先使用保存的原图 URL 以便用户继续编辑
      const saved = getCropState(itemIndex);
      const editUrl = saved?.originalImageUrl || existingImage;
      navigateToCrop(itemIndex, editUrl, specName);
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
        setUploadFileMap((prev) => ({ ...prev, [itemIndex]: imageUrl }));
        navigateToCrop(itemIndex, imageUrl, specName);
      },
    });
  };

  // 从裁剪页返回时接收结果
  useDidShow(() => {
    const result = getCropResult();
    if (!result) return;
    setCropResult(null);
    const { itemIndex, imageUrl, uploadUrl, clear } = result;
    if (clear) {
      setUploadMap((prev) => {
        const next = { ...prev };
        delete next[itemIndex];
        return next;
      });
      setUploadFileMap((prev) => {
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
      if (uploadUrl) setUploadFileMap((prev) => ({ ...prev, [itemIndex]: uploadUrl }));
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
        if (uploadFileMap[activeItem.index]) {
          setUploadFileMap((prev) => ({ ...prev, [newIndex]: prev[activeItem.index] }));
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
        setUploadFileMap((prev) => {
          const next = { ...prev };
          delete next[activeItem.index];
          return next;
        });
        setCompletedMap((prev) => {
          const next = { ...prev };
          delete next[activeItem.index];
          return next;
        });
        // 清理裁剪状态存储
        removeCropState(activeItem.index);
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

    // 自动切换至下一个未编辑（无图片）的 tab
    let nextIdx = -1;
    // 优先相邻下一个
    for (let i = activeIndex + 1; i < specList.length; i++) {
      if (!uploadMap[specList[i].index]) {
        nextIdx = i;
        break;
      }
    }
    // 若无，全局遍历从头找
    if (nextIdx < 0) {
      for (let i = 0; i < activeIndex; i++) {
        if (!uploadMap[specList[i].index]) {
          nextIdx = i;
          break;
        }
      }
    }
    if (nextIdx >= 0) {
      setActiveIndex(nextIdx);
    }
  };

  const handleSubmit = () => {
    console.log(
      '[editor] handleSubmit specList 价格:',
      specList.map((s) => s.price),
    );
    Taro.setStorageSync('orderData', {
      specs: specList,
      uploadMap,
      uploadFileMap,
    });
    Taro.navigateTo({ url: '/pages-sub/order-confirm/index' });
  };

  const hasDraftData = Object.keys(uploadMap).length > 0;

  /** 保存草稿：从草稿箱进入时更新已有记录，从首页进入时新增记录 */
  const saveDraft = () => {
    const now = Date.now();
    const d = new Date(now);
    const savedAt = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const existing = Taro.getStorageSync('fridge_magnet_editor_drafts');
    const list = Array.isArray(existing) ? existing : [];

    if (editingDraftId) {
      // 从草稿箱进入 → 更新已有草稿
      const idx = list.findIndex((item: any) => item && item.id === editingDraftId);
      const draft = {
        id: editingDraftId,
        specList,
        uploadMap,
        uploadFileMap,
        completedMap,
        activeIndex,
        createdAt: idx >= 0 ? (list[idx].createdAt as number) || now : now,
        savedAt,
      };
      if (idx >= 0) {
        list[idx] = draft;
      } else {
        // 兼容：草稿 id 在 storage 中不存在时仍追加
        list.unshift(draft);
      }
      Taro.setStorageSync('fridge_magnet_editor_drafts', list);
    } else {
      // 从首页进入 → 新增草稿
      const draft = {
        id: `${now}_${Math.random().toString(36).slice(2, 8)}`,
        specList,
        uploadMap,
        uploadFileMap,
        completedMap,
        activeIndex,
        createdAt: now,
        savedAt,
      };
      Taro.setStorageSync('fridge_magnet_editor_drafts', [draft, ...list]);
    }
  };

  const closeExitPopup = () => {
    setExitPopupVisible(false);
  };

  const handleSaveDraftAndExit = () => {
    saveDraft();
    closeExitPopup();
    Taro.navigateBack().catch(() => {});
  };

  const handleDirectExit = () => {
    closeExitPopup();
    Taro.navigateBack().catch(() => {});
  };

  /** 导航栏返回：有数据时弹窗提示，无数据直接返回 */
  const handleNavLeftClick = () => {
    if (hasDraftData) {
      setExitPopupVisible(true);
    } else {
      Taro.navigateBack().catch(() => {});
    }
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
    uploadFileMap,
    completedMap,
    menuVisible,
    closeMenu,
    specList,
    specPopupVisible,
    specPopupKey,
    activeItem,
    isSingle,
    shouldCenter,
    allUploaded,
    currentHasImage,
    hasDraftData,
    exitPopupVisible,
    handleChooseImage,
    handleMenuClick,
    handleSpecAdd,
    handleSpecPopupClose,
    handleConfirm,
    handleSubmit,
    toggleMenu,
    handleNavLeftClick,
    closeExitPopup,
    handleSaveDraftAndExit,
    handleDirectExit,
  };
}
