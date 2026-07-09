import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import BasePage from '@/components/base-page';
import IconClose from '@/assets/svgs/icon_close2.svg';
import IconStretch from '@/assets/svgs/icon_stretch.svg';
import IconRotate from '@/assets/svgs/icon_rotate.svg';
import IconLeftRotate from '@/assets/svgs/icon_left_rotate.svg';
import IconRightRotate from '@/assets/svgs/icon_right_rotate.svg';
import IconLevelRotate from '@/assets/svgs/icon_level_rotate.svg';
import IconVerticalRotate from '@/assets/svgs/icon_vertical_rotate.svg';
import IconCheck from '@/assets/svgs/icon_check.svg';
import { useGestureHandler } from './useGestureHandler';
import './index.scss';

type TabType = 'zoom' | 'rotate';

interface TransformState {
  scale: number;
  translateX: number;
  translateY: number;
  rotate: number;
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

const CROP_RESULT_KEY = 'editor_crop_result';

export default function EditorCrop() {
  const [activeTab, setActiveTab] = useState<TabType>('zoom');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [itemIndex, setItemIndex] = useState<number>(0);
  const [cropW, setCropW] = useState<number>(299);
  const [cropH, setCropH] = useState<number>(202);

  // 图片自然尺寸（经 onLoad 获取并 cap 到合理范围）
  const [imgW, setImgW] = useState<number>(0);
  const [imgH, setImgH] = useState<number>(0);

  const [transform, setTransform] = useState<TransformState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    rotate: 0,
    flipH: false,
    flipV: false,
  });

  const handleGestureUpdate = useCallback((partial: Partial<TransformState>) => {
    setTransform((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleGestureEnd = useCallback((_state: TransformState) => {}, []);

  const { handlers, showVGuide, showHGuide } = useGestureHandler(
    {
      scale: transform.scale,
      translateX: transform.translateX,
      translateY: transform.translateY,
      rotate: transform.rotate,
    },
    { onUpdate: handleGestureUpdate, onEnd: handleGestureEnd },
  );

  useEffect(() => {
    const instance = Taro.getCurrentInstance();
    const url = instance.router?.params?.imageUrl;
    const idx = instance.router?.params?.itemIndex;
    const w = instance.router?.params?.width;
    const h = instance.router?.params?.height;
    if (url) {
      setImageUrl(decodeURIComponent(url));
      // 新图片加载时重置尺寸和变换
      setImgW(0);
      setImgH(0);
      setTransform({
        scale: 1,
        translateX: 0,
        translateY: 0,
        rotate: 0,
        flipH: false,
        flipV: false,
      });
    }
    if (idx) setItemIndex(Number(idx));
    if (w) setCropW(Number(w));
    if (h) setCropH(Number(h));
  }, []);

  /** 图片加载完成：获取自然尺寸，按最大 crop 维度 cap 到合理 CSS px 值 */
  const handleImageLoad = useCallback(
    (e: any) => {
      const natW = e.detail?.width || 0;
      const natH = e.detail?.height || 0;
      if (!natW || !natH) return;
      const maxDim = Math.max(cropW, cropH);
      let w = natW,
        h = natH;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      setImgW(w);
      setImgH(h);
    },
    [cropW, cropH],
  );

  // ========== 变换计算（参考 design 页面模式） ==========
  const { scale, translateX, translateY, rotate, flipH, flipV } = transform;

  /** 图片渲染尺寸（加载中时临时用 cropW×cropH） */
  const displayW = imgW || cropW;
  const displayH = imgH || cropH;

  /** 图片变换（参考 design：left+marginLeft 居中 + transform） */
  const imageStyle = useMemo<React.CSSProperties>(
    () => ({
      position: 'absolute' as const,
      width: `${displayW}px`,
      height: `${displayH}px`,
      left: '50%',
      top: '50%',
      marginLeft: `${-displayW / 2}px`,
      marginTop: `${-displayH / 2}px`,
      transform: `translate3d(${translateX}px, ${translateY}px, 0) rotate(${rotate}deg) scale(${scale}) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
      transformOrigin: 'center center',
    }),
    [displayW, displayH, scale, translateX, translateY, rotate, flipH, flipV],
  );

  /** crop-frame 包围盒（考虑 90° 旋转时宽高互换） */
  const frameSize = useMemo(() => {
    const absRot = ((rotate % 360) + 360) % 360;
    const swapped = Math.abs(absRot - 90) < 1 || Math.abs(absRot - 270) < 1;
    return {
      w: (swapped ? displayH : displayW) * scale,
      h: (swapped ? displayW : displayH) * scale,
    };
  }, [displayW, displayH, scale, rotate]);

  /** 边框 + 按钮组：跟随图片中心、偏移、旋转 */
  const frameGroupStyle = useMemo<React.CSSProperties>(
    () => ({
      position: 'absolute' as const,
      left: '50%',
      top: '50%',
      width: `${frameSize.w}px`,
      height: `${frameSize.h}px`,
      transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) rotate(${rotate}deg)`,
      pointerEvents: 'none' as const,
    }),
    [translateX, translateY, frameSize, rotate],
  );

  // ========== 按钮操作 ==========

  const handleClose = () => {
    Taro.setStorageSync(CROP_RESULT_KEY, { itemIndex, clear: true });
    Taro.navigateBack().catch(() => {});
  };

  const handleConfirm = () => {
    Taro.setStorageSync(CROP_RESULT_KEY, { itemIndex, imageUrl, clear: false });
    Taro.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => Taro.navigateBack().catch(() => {}), 800);
  };

  const handleRotateAction = (action: (typeof ROTATE_ACTIONS)[number]) => {
    setTransform((prev) => {
      if (action.rotation) return { ...prev, rotate: prev.rotate + action.rotation };
      if (action.id === 'flipH') return { ...prev, flipH: !prev.flipH };
      return { ...prev, flipV: !prev.flipV };
    });
  };

  // 刻度尺滑动控制
  const rulerDragRef = useRef({ startX: 0, startVal: 0, isDragging: false });

  // 刻度尺参数：201 条刻度，间距 4px，总宽 800px，每侧可用 400px
  const MARK_COUNT = 201;
  const MARK_GAP = 4;
  const HALF_WIDTH = ((MARK_COUNT - 1) * MARK_GAP) / 2; // 400px

  // 缩放：pxPerUnit=60 → 最大偏移 540px（clamp 到 ±400px）
  // 旋转：pxPerDeg=1.5 → 最大偏移 540px（clamp 到 ±400px）
  const getRulerOffset = (s: number, r: number, tab: TabType) => {
    if (tab === 'zoom') return -(s - 1) * 60;
    return -r * 1.5;
  };

  const rawOffset = getRulerOffset(scale, rotate, activeTab);
  // 严格边界：偏移量不超过刻度总宽的一半
  const rulerOffset = Math.max(-HALF_WIDTH, Math.min(HALF_WIDTH, rawOffset));

  const handleRulerTouchStart = useCallback(
    (e: any) => {
      const x = e.touches[0].clientX || e.touches[0].x;
      rulerDragRef.current = {
        startX: x,
        startVal: activeTab === 'zoom' ? scale : rotate,
        isDragging: true,
      };
    },
    [activeTab, scale, rotate],
  );

  const handleRulerTouchMove = useCallback(
    (e: any) => {
      if (!rulerDragRef.current.isDragging) return;
      const x = e.touches[0].clientX || e.touches[0].x;
      const dx = x - rulerDragRef.current.startX;
      if (activeTab === 'zoom') {
        // 1px = 0.05 scale，全范围约需 200px
        const newScale = Math.max(0.1, Math.min(10, rulerDragRef.current.startVal - dx * 0.05));
        setTransform((prev) => ({ ...prev, scale: newScale }));
      } else {
        // 1px = 2°，360° 需 180px
        const newRotate = Math.max(-360, Math.min(360, rulerDragRef.current.startVal - dx * 2));
        setTransform((prev) => ({ ...prev, rotate: newRotate }));
      }
    },
    [activeTab],
  );

  const handleRulerTouchEnd = useCallback(() => {
    rulerDragRef.current.isDragging = false;
  }, []);

  const rulerValue =
    activeTab === 'zoom' ? scale.toFixed(1) : `${(((rotate % 360) + 360) % 360).toFixed(1)}°`;

  return (
    <BasePage
      navTitle={activeTab === 'zoom' ? '裁剪' : '旋转'}
      backgroundColor='#f6f6f6'
      navShowBack={false}
      bottomBarHeight={56}
      safeAreaBackgroundColor='#F6F6F6'
      bottomBarComponent={
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
      }
    >
      <View className='editor-crop-page'>
        {/* 全屏引导线（不受任何 overflow 限制） */}
        {showVGuide && <View className='snap-guide-v' />}
        {showHGuide && <View className='snap-guide-h' />}

        <View className='crop-box'>
          {/* === 裁剪区：仅图片被 overflow 裁剪，frame/按钮不被裁剪 === */}
          <View className='crop-area' style={{ width: `${cropW}px`, height: `${cropH}px` }}>
            {/* 图片 clip 层 */}
            <View
              className='crop-image-clip'
              onTouchStart={handlers.onTouchStart}
              onTouchMove={handlers.onTouchMove}
              onTouchEnd={handlers.onTouchEnd}
            >
              {imageUrl && (
                <Image
                  src={imageUrl}
                  mode='aspectFit'
                  style={imageStyle}
                  onLoad={handleImageLoad}
                />
              )}
            </View>

            <View className='crop-canvas-border' />

            {/* 边框 + 按钮组：与图片同一坐标系 */}
            <View style={frameGroupStyle}>
              <View
                className='crop-frame'
                style={{ left: 0, top: 0, width: `${frameSize.w}px`, height: `${frameSize.h}px` }}
              />

              <View
                className='crop-btn crop-btn--stretch'
                catchMove
                onTouchStart={handlers.onScaleBtnTouchStart}
                onTouchMove={handlers.onScaleBtnTouchMove}
                onTouchEnd={handlers.onScaleBtnTouchEnd}
              >
                <Image className='crop-btn-icon' src={IconStretch} />
              </View>

              <View
                className='crop-btn crop-btn--rotate'
                catchMove
                onTouchStart={handlers.onRotateBtnTouchStart}
                onTouchMove={handlers.onRotateBtnTouchMove}
                onTouchEnd={handlers.onRotateBtnTouchEnd}
              >
                <Image className='crop-btn-icon' src={IconRotate} />
              </View>
            </View>
          </View>
        </View>

        {/* 刻度尺 — 滑动控制缩放/旋转 */}
        <View
          className='ruler'
          onTouchStart={handleRulerTouchStart}
          onTouchMove={handleRulerTouchMove}
          onTouchEnd={handleRulerTouchEnd}
        >
          <View className='ruler-scale'>
            {/* 居中指示线 + 数值，固定不随刻度滑动 */}
            <View className='ruler-line' />
            <View
              className='ruler-marks'
              style={{ transform: `translateX(calc(-50% + ${rulerOffset}px))` }}
            >
              {Array.from({ length: 201 }).map((_, i) => {
                const isMajor = (i - 100) % 10 === 0;
                const isCenter = i === 100;
                return (
                  <View
                    key={i}
                    className={`ruler-mark ${isCenter ? 'ruler-mark--center' : ''} ${isMajor ? 'ruler-mark--major' : ''}`}
                  />
                );
              })}
            </View>
          </View>
          <Text className='ruler-value'>{rulerValue}</Text>
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
      </View>
    </BasePage>
  );
}
