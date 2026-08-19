import { useMemo, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { ENV_TYPE, useReady } from '@tarojs/taro';
import BasePage from '@/components/base-page';
import { useMyPromotionLogic } from './index.logic';
import './index.scss';

export default function MyPromotion() {
  const { stats, list, loading, hasMore, loadingMore, formatAmount } = useMyPromotionLogic();

  /** 计算导航栏高度，用于固定定位 */
  const navBarHeight = useMemo(() => {
    const systemInfo = Taro.getSystemInfoSync();
    const statusBarH = systemInfo.statusBarHeight || 0;
    const isWeapp = Taro.getEnv() === ENV_TYPE.WEAPP;

    let menuButtonInfo: { top: number; height: number };
    if (isWeapp) {
      try {
        menuButtonInfo = Taro.getMenuButtonBoundingClientRect();
      } catch {
        menuButtonInfo = { top: statusBarH + 4, height: 32 };
      }
    } else {
      menuButtonInfo = { top: statusBarH + 4, height: 32 };
    }

    const gap = menuButtonInfo.top - statusBarH;
    return statusBarH + menuButtonInfo.height + gap * 2;
  }, []);

  /** 顶部固定区高度，用于占位 */
  const [headerHeight, setHeaderHeight] = useState(0);

  useReady(() => {
    const query = Taro.createSelectorQuery();
    query
      .select('.promotion-header')
      .boundingClientRect((rect: any) => {
        if (rect) {
          setHeaderHeight(rect.height);
        }
      })
      .exec();
  });

  return (
    <BasePage navTitle='我的推广'>
      <View className='my-promotion-page'>
        <View className='promotion-header' style={{ top: `${navBarHeight}px` } as any}>
          <View className='stats-card'>
            <View className='stats-item w-[152px]'>
              <Text className='stats-label'>累计佣金(元)</Text>
              <Text className='stats-value'>
                <Text className='stats-symbol'>¥</Text>
                {formatAmount(stats.totalCommission)}
              </Text>
            </View>
            <View className='stats-divider' />
            <View className='stats-item text-right'>
              <Text className='stats-label'>累计分佣次数</Text>
              <Text className='stats-value'>{stats.commissionCount}</Text>
            </View>
          </View>
          <Text className='detail-title'>佣金明细</Text>
        </View>

        {/* 固定头部占位，避免列表被遮挡 */}
        <View className='promotion-placeholder' style={{ height: `${headerHeight}px` }} />

        {loading && list.length === 0 ? (
          <View className='loading-wrap'>
            <Text className='loading-text'>加载中...</Text>
          </View>
        ) : (
          <View className='detail-list'>
            {list.map((item) => (
              <View className='detail-card' key={item.id}>
                <View className='detail-header'>
                  <Text className='detail-order'>订单：{item.orderNo}</Text>
                  <Text className='detail-amount'>+¥{formatAmount(item.amount)}</Text>
                </View>
                <View className='detail-body'>
                  <Text className='detail-source'>来源：{item.source}</Text>
                  <View className='detail-tags'>
                    {item.tags.map((tag) => (
                      <Text key={tag.name} className={`detail-tag detail-tag--${tag.type}`}>
                        {tag.name}
                      </Text>
                    ))}
                  </View>
                </View>
                <Text className='detail-time'>{item.time}</Text>
              </View>
            ))}
            {!loading && list.length > 0 && (
              <View className='list-footer'>
                {loadingMore ? (
                  <Text className='list-footer-text'>加载中...</Text>
                ) : !hasMore ? (
                  <Text className='list-footer-text'>没有更多了</Text>
                ) : (
                  <Text className='list-footer-text'>上拉加载更多</Text>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </BasePage>
  );
}
