import { useMemo, useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { ENV_TYPE, useReady } from '@tarojs/taro';
import BasePage from '@/components/base-page';
import ConfirmDialog from '@/components/confirm-dialog';
import EmptyIcon from '@/assets/svgs/icon_default.svg';
import IconHint from '@/assets/svgs/icon_black_hint.svg';
import { useMyPromotionLogic } from './index.logic';
import './index.scss';

export default function MyPromotion() {
  const {
    stats,
    list,
    loading,
    hasMore,
    loadingMore,
    formatAmount,
    hintVisible,
    openHint,
    closeHint,
  } = useMyPromotionLogic();

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
            <View className='stats-item'>
              <Text className='stats-label'>累计已到账(元)</Text>
              <Text className='stats-value'>
                <Text className='stats-symbol'>¥</Text>
                {formatAmount(stats.creditedCommission)}
              </Text>
            </View>
            <View className='stats-item'>
              <Text className='stats-label'>待入账(元)</Text>
              <Text className='stats-value'>
                <Text className='stats-symbol'>¥</Text>
                {formatAmount(stats.pendingCommission)}
              </Text>
            </View>
            <View className='stats-item'>
              <Text className='stats-label'>累计分佣次数</Text>
              <Text className='stats-value'>{stats.commissionCount}</Text>
            </View>
          </View>
          <View className='detail-title-row'>
            <Text className='detail-title'>佣金明细</Text>
            <Image className='detail-title-hint' src={IconHint} onClick={openHint} />
          </View>
        </View>

        {/* 固定头部占位，避免列表被遮挡 */}
        <View className='promotion-placeholder' style={{ height: `${headerHeight}px` }} />

        {loading && list.length === 0 ? (
          <View className='loading-wrap'>
            <Text className='loading-text'>加载中...</Text>
          </View>
        ) : !loading && list.length === 0 ? (
          <View className='detail-empty'>
            <Image className='detail-empty-icon' src={EmptyIcon} mode='aspectFit' />
            <Text className='detail-empty-text'>暂无数据</Text>
          </View>
        ) : (
          <View className='detail-list'>
            {list.map((item) => (
              <View className='detail-card' key={item.id}>
                <View className='detail-header'>
                  <Text className='detail-order'>订单：{item.orderNo}</Text>
                  <View className='detail-amount-wrap'>
                    <Text className='detail-amount'>+¥{formatAmount(item.amount)}</Text>
                    {item.pending && <Text className='detail-pending'>(待入账)</Text>}
                  </View>
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

      <ConfirmDialog
        visible={hintVisible}
        title='佣金到账规则'
        content={'1、用户确认收货后，佣金即到账；\n2、用户未确认收货前为「待入账」状态'}
        confirmText='我知道了'
        showIcon={false}
        onConfirm={closeHint}
      />
    </BasePage>
  );
}
