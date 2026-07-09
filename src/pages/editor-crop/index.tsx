import { View, Text, Image, Canvas } from '@tarojs/components';
import BasePage from '@/components/base-page';
import IconClose from '@/assets/svgs/icon_close2.svg';
import IconStretch from '@/assets/svgs/icon_stretch.svg';
import IconRotate from '@/assets/svgs/icon_rotate.svg';
import IconCheck from '@/assets/svgs/icon_check.svg';
import IconLeft from '@/assets/svgs/icon_left.svg';
import { useEditorCropLogic, TABS, ROTATE_ACTIONS } from './index.logic';
import './index.scss';

export default function EditorCrop() {
  const {
    activeTab,
    setActiveTab,
    imageUrl,
    cropW,
    cropH,
    imageStyle,
    handlers,
    showVGuide,
    showHGuide,
    frameGroupStyle,
    frameSize,
    handleImageLoad,
    handleClose,
    handleConfirm,
    handleRotateAction,
    handleRulerTouchStart,
    handleRulerTouchMove,
    handleRulerTouchEnd,
    rulerOffset,
    rulerValue,
    saving,
    canvasVisible,
  } = useEditorCropLogic();

  return (
    <BasePage
      navTitle={activeTab === 'zoom' ? '裁剪' : '旋转'}
      navBackIcon={IconLeft}
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
          <View
            className='crop-footer-btn crop-footer-btn--confirm'
            onClick={saving ? undefined : handleConfirm}
            style={saving ? { opacity: 0.5 } : undefined}
          >
            <Image className='crop-footer-icon' src={IconCheck} />
          </View>
        </View>
      }
    >
      <View
        className='editor-crop-page'
        onTouchStart={handlers.onTouchStart}
        onTouchMove={handlers.onTouchMove}
        onTouchEnd={handlers.onTouchEnd}
      >
        {/* 全屏引导线（不受任何 overflow 限制） */}
        {showVGuide && <View className='snap-guide-v' />}
        {showHGuide && <View className='snap-guide-h' />}

        <View className='crop-box'>
          <View className='crop-area' style={{ width: `${cropW}px`, height: `${cropH}px` }}>
            {/* 图片 clip 层（仅裁剪，不拦截触摸） */}
            <View className='crop-image-clip'>
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

      {/* 隐藏 Canvas 用于裁剪截图，按需渲染避免挂载时 this._getData 报错 */}
      {canvasVisible && (
        <Canvas
          type='2d'
          id='crop-canvas'
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '-9999px',
            width: `${cropW}px`,
            height: `${cropH}px`,
          }}
        />
      )}
    </BasePage>
  );
}
