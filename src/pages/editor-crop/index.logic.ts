import Taro from '@tarojs/taro';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import IconLeftRotate from '@/assets/svgs/icon_left_rotate.svg';
import IconRightRotate from '@/assets/svgs/icon_right_rotate.svg';
import IconLevelRotate from '@/assets/svgs/icon_level_rotate.svg';
import IconVerticalRotate from '@/assets/svgs/icon_vertical_rotate.svg';
import { useGestureHandler } from './useGestureHandler';
import { getCropState, setCropResult, setCropState, removeCropState } from '../editor/crop-state';

export type TabType = 'zoom' | 'rotate';

export interface TransformState {
  scale: number;
  translateX: number;
  translateY: number;
  rotate: number;
  flipH: boolean;
  flipV: boolean;
}

export const TABS: { id: TabType; label: string }[] = [
  { id: 'zoom', label: '缩放' },
  { id: 'rotate', label: '旋转' },
];

export const ROTATE_ACTIONS = [
  { id: 'left90', label: '向左90°', icon: IconLeftRotate, rotation: -90 },
  { id: 'right90', label: '向右90°', icon: IconRightRotate, rotation: 90 },
  { id: 'flipH', label: '水平', icon: IconLevelRotate },
  { id: 'flipV', label: '垂直', icon: IconVerticalRotate },
];

const MARK_COUNT = 201;
const MARK_GAP = 4;
const HALF_WIDTH = ((MARK_COUNT - 1) * MARK_GAP) / 2; // 400px

export function useEditorCropLogic() {
  const [activeTab, setActiveTab] = useState<TabType>('zoom');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [itemIndex, setItemIndex] = useState<number>(0);
  const [cropW, setCropW] = useState<number>(299);
  const [cropH, setCropH] = useState<number>(202);
  /** 预览显示尺寸，Canvas 输出预览图时用此尺寸确保花边框贴合 */
  const [previewW, setPreviewW] = useState<number>(250);
  const [previewH, setPreviewH] = useState<number>(155);

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

  const [saving, setSaving] = useState(false);
  const [canvasVisible, setCanvasVisible] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');

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
    const pw = instance.router?.params?.previewW;
    const ph = instance.router?.params?.previewH;

    if (w) setCropW(Number(w));
    if (h) setCropH(Number(h));
    if (pw) setPreviewW(Number(pw));
    if (ph) setPreviewH(Number(ph));

    if (idx) {
      setItemIndex(Number(idx));
      // 检查是否有已保存的裁剪状态（内存），有则恢复
      const saved = getCropState(Number(idx));
      if (saved?.originalImageUrl) {
        setImageUrl(saved.originalImageUrl);
        setOriginalImageUrl(saved.originalImageUrl);
        setImgW(saved.imgW || 0);
        setImgH(saved.imgH || 0);
        setTransform({
          scale: saved.transform?.scale ?? 1,
          translateX: saved.transform?.translateX ?? 0,
          translateY: saved.transform?.translateY ?? 0,
          rotate: saved.transform?.rotate ?? 0,
          flipH: saved.transform?.flipH ?? false,
          flipV: saved.transform?.flipV ?? false,
        });
        return;
      }
    }

    // 无保存状态：使用 URL 参数，重置变换
    if (url) {
      const decoded = decodeURIComponent(url);
      setImageUrl(decoded);
      setOriginalImageUrl(decoded);
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

  // ========== 变换计算 ==========
  const { scale, translateX, translateY, rotate, flipH, flipV } = transform;

  /** 图片渲染尺寸（加载中时临时用 cropW×cropH） */
  const displayW = imgW || cropW;
  const displayH = imgH || cropH;

  /** 图片变换 */
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
    setCropResult({ itemIndex, clear: true });
    removeCropState(itemIndex);
    Taro.navigateBack().catch(() => {});
  };

  /**
   * Canvas 裁剪渲染
   * Canvas 尺寸 = 工作区尺寸（实物等比例），输出完整的白底+图片合成图
   * 白底先填充 → 图片超出被裁 / 图片不足留白 / 图片移出纯白
   * Canvas 按需渲染，避免页面挂载时小程序 canvas 渲染层报 this._getData 错误
   */
  const handleConfirm = async () => {
    if (saving) return;
    setSaving(true);
    setCanvasVisible(true);

    // 捕获当前变换快照，避免闭包过期
    const snap = transform;
    const curCropW = cropW;
    const curCropH = cropH;
    const curPreviewW = previewW;
    const curPreviewH = previewH;
    const curDisplayW = imgW || curCropW;
    const curDisplayH = imgH || curCropH;
    const curImageUrl = imageUrl;
    const curOriginalUrl = originalImageUrl || imageUrl;
    const curItemIndex = itemIndex;

    try {
      let croppedUrl: string | null = null;
      let previewUrl: string | null = null;

      if (process.env.TARO_ENV === 'weapp') {
        // 等待 canvas 节点挂载完成
        await new Promise((r) => setTimeout(r, 150));

        // 复用 Canvas 节点，渲染到指定尺寸
        const renderToCanvas = (
          canvasW: number,
          canvasH: number,
          isPreview: boolean,
        ): Promise<string | null> =>
          new Promise((resolve) => {
            const query = Taro.createSelectorQuery();
            query
              .select('#crop-canvas')
              .fields({ node: true, size: true })
              .exec((res: any) => {
                if (!res || !res[0] || !res[0].node) {
                  resolve(null);
                  return;
                }
                const canvas = res[0].node;
                const ctx = canvas.getContext('2d');
                const dpr = Taro.getSystemInfoSync().pixelRatio;

                canvas.width = canvasW * dpr;
                canvas.height = canvasH * dpr;
                ctx.scale(dpr, dpr);

                // 白底填充
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvasW, canvasH);

                // 预览模式用 max：工作区覆盖预览区，不留白边。
                // 上传模式 s=1：工作区 1:1 输出。
                const s = isPreview ? Math.max(canvasW / curCropW, canvasH / curCropH) : 1;
                const ox = isPreview ? (canvasW - curCropW * s) / 2 : 0;
                const oy = isPreview ? (canvasH - curCropH * s) / 2 : 0;

                const imgObj = canvas.createImage();
                imgObj.onload = () => {
                  ctx.save();
                  if (isPreview) {
                    ctx.translate(ox, oy);
                    ctx.scale(s, s);
                  }
                  ctx.translate(curCropW / 2 + snap.translateX, curCropH / 2 + snap.translateY);
                  ctx.rotate((snap.rotate * Math.PI) / 180);
                  ctx.scale(snap.scale * (snap.flipH ? -1 : 1), snap.scale * (snap.flipV ? -1 : 1));
                  ctx.drawImage(
                    imgObj,
                    -curDisplayW / 2,
                    -curDisplayH / 2,
                    curDisplayW,
                    curDisplayH,
                  );
                  ctx.restore();

                  Taro.canvasToTempFilePath({
                    canvas,
                    success: (result) => resolve(result.tempFilePath),
                    fail: (err) => {
                      console.error('[renderToCanvas] canvasToTempFilePath failed:', err);
                      resolve(null);
                    },
                  });
                };
                imgObj.onerror = (err: any) => {
                  console.error('[renderToCanvas] Image load failed:', err);
                  resolve(null);
                };
                imgObj.src = curImageUrl;
              });
          });

        // 第一遍：预览图（花边框显示用）
        previewUrl = await renderToCanvas(curPreviewW, curPreviewH, true);
        // 第二遍：上传图（实物等比例）
        croppedUrl = await renderToCanvas(curCropW, curCropH, false);
      }

      // 保存裁剪结果给 editor 页（内存）：预览用 previewUrl，上传用 croppedUrl
      setCropResult({
        itemIndex: curItemIndex,
        imageUrl: previewUrl || croppedUrl || curImageUrl,
        uploadUrl: croppedUrl || curImageUrl,
        clear: false,
      });

      // 保存编辑状态供下次回显（内存）
      setCropState(curItemIndex, {
        originalImageUrl: curOriginalUrl,
        transform: snap,
        imgW,
        imgH,
      });

      Taro.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => Taro.navigateBack().catch(() => {}), 800);
    } catch (e) {
      console.error('[handleConfirm] Error:', e);
      // 降级：传原图
      setCropResult({
        itemIndex: curItemIndex,
        imageUrl: curImageUrl,
        clear: false,
      });
      Taro.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => Taro.navigateBack().catch(() => {}), 800);
    } finally {
      setSaving(false);
    }
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

  const getRulerOffset = (s: number, r: number, tab: TabType) => {
    if (tab === 'zoom') return -(s - 1) * 60;
    return -r * 1.5;
  };

  const rawOffset = getRulerOffset(scale, rotate, activeTab);
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
        const newScale = Math.max(0.1, Math.min(10, rulerDragRef.current.startVal - dx * 0.05));
        setTransform((prev) => ({ ...prev, scale: newScale }));
      } else {
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

  return {
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
    saving,
    canvasVisible,
    handleRotateAction,
    handleRulerTouchStart,
    handleRulerTouchMove,
    handleRulerTouchEnd,
    rulerOffset,
    rulerValue,
  };
}
