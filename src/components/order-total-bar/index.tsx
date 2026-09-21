import type { CSSProperties } from 'react';
import { View, Text, Image } from '@tarojs/components';
import IconRedUp from '@/assets/svgs/icon_red_up.svg';

import './index.scss';

interface OrderTotalBarProps {
  /**
   * 合计金额。
   * ⚠️ 必须是「折后商品额 + 运费」（确认订单页的 `finalTotal`），
   * 页面底栏与优惠弹层底部共用本组件，两处必须传同一个值，否则会出现"差一个运费"。
   */
  totalAmount: number;
  /** 优惠金额（原价合计 − 折后合计） */
  totalDiscount: number;
  /** 商品件数 */
  totalCount: number;
  /** 点击「优惠 -¥x 明细」的回调 */
  onDetailClick: () => void;
  /** 点击支付按钮回调 */
  onPay?: () => void;
  /** 是否显示「优惠明细」入口（订单只有 1 件时为 false，此时无优惠可看） */
  showDetail?: boolean;
  /** 明细入口箭头是否朝上（优惠弹层已展开） */
  detailExpanded?: boolean;
  /** 自定义类名（弹层内用于补充 flex-shrink 等布局样式） */
  className?: string;
  style?: CSSProperties;
}

/**
 * 订单底部合计栏（合计金额 + 件数 + 优惠明细入口 + 微信支付按钮）
 *
 * 确认订单页底栏与优惠明细弹层底部共用同一份实现，保证两处金额与样式完全一致。
 */
export default function OrderTotalBar({
  totalAmount,
  totalDiscount,
  totalCount,
  onDetailClick,
  onPay,
  showDetail = true,
  detailExpanded = false,
  className = '',
  style,
}: OrderTotalBarProps) {
  return (
    <View className={`order-total-bar ${className}`} style={style}>
      <View className='order-total-bar-info'>
        <View className='order-total-bar-row'>
          <Text className='order-total-bar-label'>合计</Text>
          <Text className='order-total-bar-price'>¥ {totalAmount.toFixed(2)}</Text>
        </View>
        <View className='order-total-bar-row'>
          <Text className='order-total-bar-count'>
            共 <Text className='order-total-bar-count-num'>{totalCount}</Text> 件
          </Text>
          {showDetail && (
            <View className='order-total-bar-detail' onClick={onDetailClick}>
              <Text className='order-total-bar-detail-text'>
                优惠 -¥{totalDiscount.toFixed(2)} 明细
              </Text>
              <Image
                className={`order-total-bar-detail-arrow${
                  detailExpanded ? ' order-total-bar-detail-arrow--up' : ''
                }`}
                src={IconRedUp}
              />
            </View>
          )}
        </View>
      </View>
      {onPay && (
        <View className='order-total-bar-pay-btn' onClick={onPay}>
          <Text className='order-total-bar-pay-text'>微信支付</Text>
        </View>
      )}
    </View>
  );
}
