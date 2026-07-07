import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import BasePage from '@/components/base-page';
import IconClose from '@/assets/svgs/icon_close2.svg';
import IconStretch from '@/assets/svgs/icon_stretch.svg';
import IconRotate from '@/assets/svgs/icon_rotate.svg';
import IconLeftRotate from '@/assets/svgs/icon_left_rotate.svg';
import IconRightRotate from '@/assets/svgs/icon_right_rotate.svg';
import IconLevelRotate from '@/assets/svgs/icon_level_rotate.svg';
import IconVerticalRotate from '@/assets/svgs/icon_vertical_rotate.svg';
import IconCheck from '@/assets/svgs/icon_check.svg';
import './index.scss';

type TabType = 'zoom' | 'rotate';

interface TransformState {
  scale: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

const TABS: { id: TabType; label: string }[] = [
  { id: 'zoom', label: '缩放' },
  { id: 'rotate', label: '旋转' },
];

const ROTATE_ACTIONS = [
  { id: 'left90', label: '向左90°', icon: IconLeftRotate, rotation: -90 },
  { id: 'right90', label: '向右90°', icon: IconRightRotate, rotation: 90 },
  { id: 'flipH', label: '水平', icon: IconLevelRotate },
  { id: 'flipV', label: '垂直', icon: IconVerticalRotate },
];

export default function EditorCrop() {
  const [activeTab, setActiveTab] = useState<TabType>('zoom');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [transform, setTransform] = useState<TransformState>({
    scale: 1,
    rotation: 0,
    flipH: false,
    flipV: false,
  });

  useEffect(() => {
    const instance = Taro.getCurrentInstance();
    const url = instance.router?.params?.imageUrl;
    if (url) {
      setImageUrl(decodeURIComponent(url));
    }
  }, []);

  const handleClose = () => {
    Taro.navigateBack().catch(() => {});
  };

  const handleConfirm = () => {
    Taro.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => {
      Taro.navigateBack().catch(() => {});
    }, 800);
  };

  const handleRotateAction = (action: (typeof ROTATE_ACTIONS)[number]) => {
    setTransform((prev) => {
      if (action.rotation) {
        return { ...prev, rotation: prev.rotation + action.rotation };
      }
      if (action.id === 'flipH') {
        return { ...prev, flipH: !prev.flipH };
      }
      return { ...prev, flipV: !prev.flipV };
    });
  };

  const imageStyle: React.CSSProperties = {
    transform: `rotate(${transform.rotation}deg) scaleX(${transform.flipH ? -1 : 1}) scaleY(${transform.flipV ? -1 : 1})`,
  };

  const rulerValue = activeTab === 'zoom' ? '0.0' : '0.0';

  return (
    <BasePage
      navTitle={activeTab === 'zoom' ? '裁剪' : '旋转'}
      backgroundColor='#f6f6f6'
      navShowBack={false}
    >
      <View className='editor-crop-page'>
        {/* 裁剪画布 */}
        <View className='crop-canvas'>
          <View className='crop-frame'>
            {imageUrl ? (
              <Image className='crop-image' src={imageUrl} mode='aspectFit' style={imageStyle} />
            ) : (
              <View className='crop-empty'>
                <Text className='crop-empty-text'>暂无图片</Text>
              </View>
            )}
          </View>
          <View className='crop-btn crop-btn--stretch'>
            <Image className='crop-btn-icon' src={IconStretch} />
          </View>
          <View className='crop-btn crop-btn--rotate'>
            <Image className='crop-btn-icon' src={IconRotate} />
          </View>
        </View>

        {/* 旋转快捷操作 */}
        {activeTab === 'rotate' && (
          <View className='rotate-actions'>
            {ROTATE_ACTIONS.map((action) => (
              <View
                key={action.id}
                className='rotate-action-item'
                onClick={() => handleRotateAction(action)}
              >
                <Image className='rotate-action-icon' src={action.icon} />
                <Text className='rotate-action-label'>{action.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 刻度尺 */}
        <View className='ruler'>
          <View className='ruler-scale'>
            <View className='ruler-line' />
            <View className='ruler-marks'>
              {Array.from({ length: 25 }).map((_, index) => (
                <View
                  key={index}
                  className={`ruler-mark ${index === 12 ? 'ruler-mark--center' : ''}`}
                />
              ))}
            </View>
          </View>
          <Text className='ruler-value'>{rulerValue}</Text>
        </View>

        {/* 底部操作栏 */}
        <View className='crop-footer'>
          <View className='crop-footer-btn crop-footer-btn--close' onClick={handleClose}>
            <Image className='crop-footer-icon' src={IconClose} />
          </View>

          <View className='crop-tabs'>
            {TABS.map((tab) => (
              <View
                key={tab.id}
                className={`crop-tab ${activeTab === tab.id ? 'crop-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Text className='crop-tab-text'>{tab.label}</Text>
                {activeTab === tab.id && <View className='crop-tab-line' />}
              </View>
            ))}
          </View>

          <View className='crop-footer-btn crop-footer-btn--confirm' onClick={handleConfirm}>
            <Image className='crop-footer-icon' src={IconCheck} />
          </View>
        </View>
      </View>
    </BasePage>
  );
}
