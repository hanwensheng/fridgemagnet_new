import { useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import BasePage from '@/components/base-page';
import IconSingle from '@/assets/svgs/icon_single.svg';
import IconGroup from '@/assets/svgs/icon_group.svg';
import IconLocation from '@/assets/svgs/icon_location.svg';
import IconJdlLogo from '@/assets/svgs/icon_jdl_logo.svg';
import IconDown from '@/assets/svgs/icon_down.svg';
import { useLogisticsDetailLogic } from './index.logic';
import './index.scss';

export default function LogisticsDetail() {
  const [expanded, setExpanded] = useState(false);
  const { data } = useLogisticsDetailLogic();

  if (!data) {
    return (
      <BasePage navTitle='查看物流'>
        <View className='logistics-page'>
          <Text>数据加载失败</Text>
        </View>
      </BasePage>
    );
  }

  const visibleTimeline = expanded ? data.timeline : data.timeline.slice(0, 3);

  const handleCopyTrackingNumber = () => {
    Taro.setClipboardData({
      data: data.trackingNumber,
      success: () => Taro.showToast({ title: '快递单号已复制', icon: 'none' }),
    });
  };

  const handleCopyOrderNo = () => {
    Taro.setClipboardData({
      data: data.orderNo,
      success: () => Taro.showToast({ title: '订单编号已复制', icon: 'none' }),
    });
  };

  return (
    <BasePage navTitle='查看物流' onNavLeftClick={() => Taro.navigateBack().catch(() => {})}>
      <ScrollView className='logistics-page' scrollY>
        {/* 物流 + 地址卡片 */}
        <View className='logistics-card'>
          <View className='logistics-header'>
            <Image className='logistics-courier-icon' src={IconJdlLogo} />
            <Text className='logistics-courier-text'>
              {data.courierName} {data.trackingNumber}
            </Text>
            <Text className='logistics-copy' onClick={handleCopyTrackingNumber}>
              复制
            </Text>
          </View>

          <View className='logistics-timeline'>
            {visibleTimeline.map((item, index) => (
              <View key={index} className='logistics-timeline-item'>
                <View className='logistics-timeline-line'>
                  <View
                    className={`logistics-timeline-dot ${
                      item.active ? 'logistics-timeline-dot--active' : ''
                    }`}
                  />
                  {index < visibleTimeline.length - 1 && (
                    <View className='logistics-timeline-connector' />
                  )}
                </View>
                <View className='logistics-timeline-content'>
                  {item.active ? (
                    <View className='logistics-timeline-status-row'>
                      <Text className='logistics-timeline-status logistics-timeline-status--active'>
                        {item.statusText}
                      </Text>
                      <Text className='logistics-timeline-time-full'>{item.operationTime}</Text>
                    </View>
                  ) : (
                    <Text className='logistics-timeline-status'>{item.content}</Text>
                  )}
                  {item.active && <Text className='logistics-timeline-desc'>{item.content}</Text>}
                </View>
              </View>
            ))}
          </View>

          {data.timeline.length > 3 && (
            <View className='logistics-expand' onClick={() => setExpanded(!expanded)}>
              <Text className='logistics-expand-text'>
                {expanded ? '收起物流明细' : '展开更多物流明细'}
              </Text>
              <Image
                className={`logistics-expand-arrow ${expanded ? 'logistics-expand-arrow--up' : ''}`}
                src={IconDown}
              />
            </View>
          )}

          <View className='logistics-divider' />

          <View className='logistics-address-section'>
            <View className='logistics-address-icon-wrap'>
              <Image className='logistics-address-icon' src={IconLocation} />
            </View>
            <View className='logistics-address-main'>
              <Text className='logistics-address-text'>送至 {data.address}</Text>
              <View className='logistics-address-user'>
                <Text className='logistics-address-name'>{data.recipient}</Text>
                <Text className='logistics-address-phone'>{data.recipientPhone}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 商品 + 订单信息卡片 */}
        <View className='logistics-goods-card'>
          <View className='logistics-goods-header'>
            <View className='logistics-goods-type'>
              <Image
                className='logistics-goods-type-icon'
                src={data.isGroup ? IconGroup : IconSingle}
              />
              <Text className='logistics-goods-type-text'>{data.isGroup ? '组合' : '单品'}</Text>
            </View>
          </View>

          {data.isGroup ? (
            <View className='logistics-images-row'>
              <ScrollView className='logistics-images-scroll' scrollX showScrollbar={false}>
                <View className='logistics-images-scroll-inner'>
                  {data.imgList.map((img, idx) => (
                    <View key={img.pkId || idx} className='logistics-image-wrap'>
                      <Image className='logistics-image' src={img.imgLink} mode='aspectFill' />
                      <View className='logistics-image-badge'>
                        <Text className='logistics-image-badge-text'>x1</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
              <View className='logistics-total-info'>
                <Text className='logistics-total-count-text'>共 {data.goodsNum} 件</Text>
              </View>
            </View>
          ) : (
            <View className='logistics-goods-body'>
              <Image className='logistics-goods-image' src={data.goodsImage} mode='aspectFill' />
              <View className='logistics-goods-info'>
                <Text className='logistics-goods-name'>{data.goodsName}</Text>
                {data.goodsSpec && <Text className='logistics-goods-spec'>{data.goodsSpec}</Text>}
                <Text className='logistics-goods-count'>共 {data.goodsNum} 件</Text>
              </View>
            </View>
          )}

          <View className='logistics-goods-summary'>
            <View className='logistics-info-row logistics-info-row--strong'>
              <Text className='logistics-info-label'>实付款</Text>
              <Text className='logistics-info-value'>¥{data.payPrice.toFixed(2)}</Text>
            </View>
            <View className='logistics-info-row'>
              <Text className='logistics-info-label'>运费</Text>
              <Text className='logistics-info-value'>¥{data.deliveryPrice.toFixed(2)}</Text>
            </View>
            <View className='logistics-info-row'>
              <Text className='logistics-info-label'>订单编号</Text>
              <View className='logistics-info-no-wrap'>
                <Text className='logistics-info-no'>{data.orderNo}</Text>
                <View className='logistics-info-divider' />
                <Text className='logistics-info-copy' onClick={handleCopyOrderNo}>
                  复制
                </Text>
              </View>
            </View>
            <View className='logistics-info-row'>
              <Text className='logistics-info-label'>下单时间</Text>
              <Text className='logistics-info-value logistics-info-value-time'>
                {data.createTime}
              </Text>
            </View>
          </View>
        </View>

        <View className='logistics-safe-bottom' />
      </ScrollView>
    </BasePage>
  );
}
