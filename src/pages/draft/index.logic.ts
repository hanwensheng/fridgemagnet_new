import Taro, { useDidShow } from '@tarojs/taro';
import { useState, useCallback } from 'react';
import { getPreviewBg } from '@/pages/editor/index.logic';
import type { SpecItem } from '@/pages/editor/index.logic';

const DRAFT_STORAGE_KEY = 'fridge_magnet_editor_drafts';

export interface DraftItem {
  /** 草稿唯一 id */
  id: string;
  /** 规格列表 */
  specList: SpecItem[];
  /** 缩略图：取首张已上传图片，否则为规格预览背景 */
  thumbnail: string;
  /** 草稿标题：取首条规格的 intro，无则用默认文案 */
  title: string;
  /** 规格尺寸拼接，例：8*5.4cm / 7*5.5cm */
  sizes: string;
  /** 格式化时间 2026-06-27 11:41 */
  savedAt: string;
  /** 毫秒时间戳，用于排序 */
  createdAt: number;
}

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function toDraftItem(raw: any): DraftItem | null {
  if (!raw || !Array.isArray(raw.specList) || raw.specList.length === 0) {
    return null;
  }
  const specList: SpecItem[] = raw.specList;
  const firstSpec = specList[0];

  // 缩略图：取任一已上传图片
  let thumbnail = '';
  const uploadMap: Record<number, string> = raw.uploadMap || {};
  for (const spec of specList) {
    if (uploadMap[spec.index]) {
      thumbnail = uploadMap[spec.index];
      break;
    }
  }
  if (!thumbnail) {
    thumbnail = getPreviewBg(firstSpec.name);
  }

  const sizes = specList.map((s) => s.name).join(' / ');
  const createdAt = typeof raw.createdAt === 'number' ? raw.createdAt : Date.now();
  const savedAt = raw.savedAt || formatDateTime(createdAt);

  return {
    id: raw.id || `${createdAt}`,
    specList,
    thumbnail,
    title: firstSpec.intro || '创作草稿',
    sizes,
    savedAt,
    createdAt,
  };
}

export function useDraftLogic() {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);

  const loadDrafts = useCallback(() => {
    try {
      const raw = Taro.getStorageSync(DRAFT_STORAGE_KEY);
      if (!Array.isArray(raw)) {
        setDrafts([]);
        return;
      }
      const list = raw.map(toDraftItem).filter((d): d is DraftItem => !!d);
      list.sort((a, b) => b.createdAt - a.createdAt);
      setDrafts(list);
    } catch {
      setDrafts([]);
    }
  }, []);

  useDidShow(() => {
    loadDrafts();
  });

  const handleEdit = (draft: DraftItem) => {
    const specsJson = encodeURIComponent(JSON.stringify(draft.specList));
    Taro.navigateTo({
      url: `/pages/editor/index?specs=${specsJson}&draftId=${draft.id}`,
    });
  };

  const handleDelete = (id: string) => {
    Taro.showModal({
      title: '提示',
      content: '确定删除该草稿吗？',
      success: (res) => {
        if (!res.confirm) return;
        try {
          const raw = Taro.getStorageSync(DRAFT_STORAGE_KEY);
          if (!Array.isArray(raw)) return;
          const next = raw.filter((d: any) => d && d.id !== id);
          Taro.setStorageSync(DRAFT_STORAGE_KEY, next);
        } catch {
          // ignore
        }
        setDrafts((prev) => {
          const next = prev.filter((d) => d.id !== id);
          if (next.length === 0) {
            setTimeout(() => {
              Taro.switchTab({ url: '/pages/index/index' });
            }, 500);
          }
          return next;
        });
        Taro.showToast({ title: '删除成功', icon: 'success' });
      },
    });
  };

  return {
    drafts,
    handleEdit,
    handleDelete,
  };
}
