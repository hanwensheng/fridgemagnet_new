import { View, Text, Image } from '@tarojs/components';
import IconWarn from '@/assets/svgs/icon_warning2.svg';
import './index.scss';

interface ConfirmDialogProps {
  visible: boolean;
  /** 标题（warn 图标右侧） */
  title: string;
  /** 正文一句话说明 */
  content: string;
  /** 按钮文案，默认「确认」 */
  confirmText?: string;
  /** 是否展示标题前的 warn 图标，默认展示 */
  showIcon?: boolean;
  /** 唯一出口：点按钮关闭 */
  onConfirm: () => void;
}

/**
 * 告知型确认弹窗（warn 图标 + 标题 + 一句话 + 单个黑色按钮）。
 * 布局与样式照搬 keaiji_miniprogram 的 confirm-dialog，只是去掉了这里用不到的分支：
 * 没有左「取消」按钮、没有右上角 ✕，点遮罩也不关闭 —— 出口只有按钮。
 */
export default function ConfirmDialog({
  visible,
  title,
  content,
  confirmText = '确认',
  showIcon = true,
  onConfirm,
}: ConfirmDialogProps) {
  if (!visible) return null;

  return (
    <View className='confirm-dialog-mask' catchMove>
      <View className='confirm-dialog'>
        <View className='confirm-dialog-head'>
          {showIcon && <Image className='confirm-dialog-warn' src={IconWarn} />}
          <Text
            className={`confirm-dialog-title${showIcon ? '' : ' confirm-dialog-title--no-icon'}`}
          >
            {title}
          </Text>
        </View>

        <Text className='confirm-dialog-text'>{content}</Text>

        <View className='confirm-dialog-actions'>
          <View className='confirm-dialog-btn' onClick={onConfirm}>
            <Text className='confirm-dialog-btn-text'>{confirmText}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
