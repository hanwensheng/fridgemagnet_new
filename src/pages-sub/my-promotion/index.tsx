import { View, Text } from '@tarojs/components';
import BasePage from '@/components/base-page';
import { useMyPromotionLogic } from './index.logic';
import './index.scss';

export default function MyPromotion() {
  const { stats, list, loading, hasMore, loadingMore, formatAmount } = useMyPromotionLogic();

  return (
    <BasePage navTitle='我的推广'>
      <View className='my-promotion-page'>
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

        <View className='detail-section'>
          <Text className='detail-title'>佣金明细</Text>
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
            </View>
          )}
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
      </View>
    </BasePage>
  );
}
