import { useRef, useCallback, useState } from 'react';

interface TransformState {
  scale: number;
  translateX: number;
  translateY: number;
  rotate: number;
}

interface GestureOptions {
  onUpdate: (state: Partial<TransformState>) => void;
  onEnd: (state: TransformState) => void;
  enableSnap?: boolean;
  snapThreshold?: number;
}

/**
 * 通用手势处理 Hook
 * 支持：单指拖拽、双指缩放+旋转、缩放按钮拖拽、旋转按钮拖拽、磁吸对齐
 */
export function useGestureHandler(state: TransformState, options: GestureOptions) {
  const { enableSnap = true, snapThreshold = 8, onUpdate, onEnd } = options;
  const [showVGuide, setShowVGuide] = useState(false);
  const [showHGuide, setShowHGuide] = useState(false);

  const touchRef = useRef({
    startX: 0,
    startY: 0,
    lastTx: 0,
    lastTy: 0,
    startDist: 0,
    lastScale: 1,
    startAngle: 0,
    lastRotate: 0,
    isPinching: false,
    startPinchAngle: 0,
    isSnapped: false,
    snapTimerId: undefined as any,
  });

  // ========== 主体手势 ==========

  const onTouchStart = useCallback(
    (e: any) => {
      e.stopPropagation();
      if (e.touches.length === 1) {
        touchRef.current.startX = e.touches[0].clientX || e.touches[0].x;
        touchRef.current.startY = e.touches[0].clientY || e.touches[0].y;
        touchRef.current.lastTx = state.translateX;
        touchRef.current.lastTy = state.translateY;
        touchRef.current.isPinching = false;
      } else if (e.touches.length === 2) {
        const x1 = e.touches[0].clientX || e.touches[0].x;
        const y1 = e.touches[0].clientY || e.touches[0].y;
        const x2 = e.touches[1].clientX || e.touches[1].x;
        const y2 = e.touches[1].clientY || e.touches[1].y;
        const dx = x1 - x2,
          dy = y1 - y2;
        touchRef.current.startDist = Math.sqrt(dx * dx + dy * dy);
        touchRef.current.lastScale = state.scale;
        touchRef.current.startPinchAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
        touchRef.current.lastRotate = state.rotate;
        touchRef.current.isPinching = true;
      }
    },
    [state.translateX, state.translateY, state.scale, state.rotate],
  );

  const onTouchMove = useCallback(
    (e: any) => {
      e.stopPropagation();
      if (e.touches.length === 1 && !touchRef.current.isPinching) {
        const cx = e.touches[0].clientX || e.touches[0].x;
        const cy = e.touches[0].clientY || e.touches[0].y;
        const dx = cx - touchRef.current.startX;
        const dy = cy - touchRef.current.startY;
        let newTx = touchRef.current.lastTx + dx;
        let newTy = touchRef.current.lastTy + dy;

        // 磁吸对齐
        let showV = false,
          showH = false;
        if (enableSnap) {
          const halfW = 150; // 基于设计像素的通用阈值
          if (Math.abs(newTx) < snapThreshold) {
            newTx = 0;
            showV = true;
          } else if (Math.abs(newTx - halfW) < snapThreshold) {
            newTx = halfW;
            showV = true;
          } else if (Math.abs(newTx + halfW) < snapThreshold) {
            newTx = -halfW;
            showV = true;
          }

          if (Math.abs(newTy) < snapThreshold) {
            newTy = 0;
            showH = true;
          }
        }

        setShowVGuide(showV);
        setShowHGuide(showH);

        if (showV || showH) {
          if (!touchRef.current.isSnapped) {
            touchRef.current.isSnapped = true;
            clearTimeout(touchRef.current.snapTimerId);
            touchRef.current.snapTimerId = setTimeout(() => {
              setShowVGuide(false);
              setShowHGuide(false);
            }, 200);
          }
        } else {
          clearTimeout(touchRef.current.snapTimerId);
          touchRef.current.isSnapped = false;
        }

        onUpdate({ translateX: newTx, translateY: newTy });
      } else if (e.touches.length === 2) {
        const x1 = e.touches[0].clientX || e.touches[0].x;
        const y1 = e.touches[0].clientY || e.touches[0].y;
        const x2 = e.touches[1].clientX || e.touches[1].x;
        const y2 = e.touches[1].clientY || e.touches[1].y;
        const dx = x1 - x2,
          dy = y1 - y2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const newScale = Math.max(
          0.1,
          Math.min(10, touchRef.current.lastScale * (dist / touchRef.current.startDist)),
        );
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        let delta = angle - touchRef.current.startPinchAngle;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        const newRotate = touchRef.current.lastRotate + delta;
        onUpdate({ scale: newScale, rotate: newRotate });
      }
    },
    [enableSnap, snapThreshold, onUpdate],
  );

  const onTouchEnd = useCallback(
    (e: any) => {
      e.stopPropagation();
      if (e.touches.length === 0) {
        touchRef.current.isPinching = false;
        setShowVGuide(false);
        setShowHGuide(false);
        clearTimeout(touchRef.current.snapTimerId);
        touchRef.current.isSnapped = false;
        onEnd(state);
      } else if (e.touches.length === 1) {
        touchRef.current.isPinching = false;
        const cx = e.touches[0].clientX || e.touches[0].x;
        const cy = e.touches[0].clientY || e.touches[0].y;
        touchRef.current.startX = cx;
        touchRef.current.startY = cy;
        touchRef.current.lastTx = state.translateX;
        touchRef.current.lastTy = state.translateY;
      }
    },
    [state, onEnd],
  );

  // ========== 缩放按钮手势 ==========

  const onScaleBtnTouchStart = useCallback(
    (e: any) => {
      e.stopPropagation();
      touchRef.current.startX = e.touches[0].clientX || e.touches[0].x;
      touchRef.current.startY = e.touches[0].clientY || e.touches[0].y;
      touchRef.current.lastScale = state.scale;
    },
    [state.scale],
  );

  const onScaleBtnTouchMove = useCallback(
    (e: any) => {
      e.stopPropagation();
      const cx = e.touches[0].clientX || e.touches[0].x;
      const cy = e.touches[0].clientY || e.touches[0].y;
      const dist = cx - touchRef.current.startX - (cy - touchRef.current.startY);
      const newScale = Math.max(0.1, Math.min(10, touchRef.current.lastScale * (1 + dist * 0.005)));
      onUpdate({ scale: newScale });
    },
    [onUpdate],
  );

  const onScaleBtnTouchEnd = useCallback(
    (e: any) => {
      e.stopPropagation();
      onEnd(state);
    },
    [state, onEnd],
  );

  // ========== 旋转按钮手势 ==========

  const onRotateBtnTouchStart = useCallback(
    (e: any) => {
      e.stopPropagation();
      const cx = e.touches[0].clientX || e.touches[0].x;
      const cy = e.touches[0].clientY || e.touches[0].y;
      // 记录触摸起始角度（以触点自身为参考点）
      touchRef.current.startAngle = (Math.atan2(cy, cx) * 180) / Math.PI;
      // 同时记录第一次触点位置用于后续的旋转中心计算
      touchRef.current.startX = cx;
      touchRef.current.startY = cy;
      touchRef.current.lastRotate = state.rotate;
    },
    [state.rotate],
  );

  const onRotateBtnTouchMove = useCallback(
    (e: any) => {
      e.stopPropagation();
      const cx = e.touches[0].clientX || e.touches[0].x;
      // 水平位移驱动旋转
      const dx = cx - touchRef.current.startX;
      const newRotate = touchRef.current.lastRotate - dx * 0.5;
      onUpdate({ rotate: newRotate });
    },
    [onUpdate],
  );

  const onRotateBtnTouchEnd = useCallback(
    (e: any) => {
      e.stopPropagation();
      onEnd(state);
    },
    [state, onEnd],
  );

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onScaleBtnTouchStart,
      onScaleBtnTouchMove,
      onScaleBtnTouchEnd,
      onRotateBtnTouchStart,
      onRotateBtnTouchMove,
      onRotateBtnTouchEnd,
    },
    showVGuide,
    showHGuide,
  };
}
