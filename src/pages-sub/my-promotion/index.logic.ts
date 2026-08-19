import { useCallback, useEffect, useRef, useState } from 'react';
import { useReachBottom } from '@tarojs/taro';
import { orderApi } from '@/api/modules/order';
import type { ShareDetailItem } from '@/api/modules/order';

export type CommissionTagType = 'merchant' | 'promoter';

export interface CommissionTag {
  name: string;
  type: CommissionTagType;
}

/** 佣金明细项（视图结构） */
export interface CommissionItem {
  id: string;
  orderNo: string;
  source: string;
  time: string;
  amount: number;
  tags: CommissionTag[];
}

export interface PromotionStats {
  totalCommission: number;
  commissionCount: number;
}

/** 分页大小 */
export const PAGE_SIZE = 10;

/** type 字段映射：1=商户佣金 2=推广员佣金 3=两者都有 */
function mapTypeToTags(type: string): CommissionTag[] {
  switch (type) {
    case '1':
      return [{ name: '商户佣金', type: 'merchant' }];
    case '2':
      return [{ name: '推广员佣金', type: 'promoter' }];
    case '3':
      return [
        { name: '商户佣金', type: 'merchant' },
        { name: '推广员佣金', type: 'promoter' },
      ];
    default:
      return [];
  }
}

function toCommissionItem(item: ShareDetailItem, index: number): CommissionItem {
  return {
    id: `${item.gmtCreate}-${item.orderNo}-${index}`,
    orderNo: item.orderNo,
    source: item.phone,
    time: item.gmtCreate,
    amount: Number(item.shareAmount) || 0,
    tags: mapTypeToTags(item.type),
  };
}

export function useMyPromotionLogic() {
  const [stats, setStats] = useState<PromotionStats>({
    totalCommission: 0,
    commissionCount: 0,
  });
  const [list, setList] = useState<CommissionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  /** 用 ref 保存最新状态，避免 useReachBottom 回调闭包过期 */
  const hasMoreRef = useRef(hasMore);
  const listLengthRef = useRef(list.length);
  const loadingMoreRef = useRef(loadingMore);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  useEffect(() => {
    listLengthRef.current = list.length;
  }, [list.length]);
  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await orderApi.findShareTotal();
      setStats({
        totalCommission: Number(res?.shareAmount ?? 0),
        commissionCount: Number(res?.shareCount ?? 0),
      });
    } catch {
      setStats({ totalCommission: 0, commissionCount: 0 });
    }
  }, []);

  const fetchList = useCallback(async (pageNum: number) => {
    const res = await orderApi.findShareDetail({ pageNum, pageSize: PAGE_SIZE });
    const rawList = res?.list ?? [];
    return rawList.map((item, index) => toCommissionItem(item, index));
  }, []);

  /** 首次加载统计 + 第一页明细 */
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchList(1)])
      .then(([, firstPage]) => {
        setList(firstPage);
        setHasMore(firstPage.length >= PAGE_SIZE);
      })
      .catch(() => {
        setList([]);
        setHasMore(false);
      })
      .finally(() => setLoading(false));
  }, [fetchStats, fetchList]);

  /** 滚动到底部加载更多 */
  const loadMore = useCallback(async () => {
    if (!hasMoreRef.current || loadingMoreRef.current) return;
    setLoadingMore(true);
    const nextPage = Math.floor(listLengthRef.current / PAGE_SIZE) + 1;
    try {
      const newItems = await fetchList(nextPage);
      if (newItems.length === 0) {
        setHasMore(false);
        return;
      }
      setList((prev) => [...prev, ...newItems]);
      setHasMore(newItems.length >= PAGE_SIZE);
    } catch {
      // 加载失败不阻断，保留 hasMore 状态供下次重试
    } finally {
      setLoadingMore(false);
    }
  }, [fetchList]);

  useReachBottom(() => {
    loadMore();
  });

  const formatAmount = (amount: number) => amount.toFixed(2);

  return {
    stats,
    list,
    loading,
    hasMore,
    loadingMore,
    formatAmount,
  };
}
