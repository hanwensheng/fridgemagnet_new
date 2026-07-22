import { View, Image } from '@tarojs/components';
import Taro, {
  ENV_TYPE,
  useDidHide,
  useDidShow,
  useShareAppMessage,
  useShareTimeline,
} from '@tarojs/taro';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import BasePage from '@/components/base-page';
import SpecSelectPopup, { SelectedSpec } from '@/components/spec-select-popup';
import { useTabBar } from '@/hooks/useTabBar';
import { productApi, BizPopularDesign } from '@/api';
import logoIcon from '@/assets/svgs/icon_logo_black.svg';
import HomeBg from '@/assets/images/home_bg.png';
import ShareBg from '@/assets/images/share_bg.png';
import HomeImg0 from '@/assets/images/home_img0.png';
import HomeImg1 from '@/assets/images/home_img1.png';
import HomeImg2 from '@/assets/images/home_img2.png';
import HomeImg3 from '@/assets/images/home_img3.png';
import HomeImg4 from '@/assets/images/home_img4.png';
import HomeImg5 from '@/assets/images/home_img5.png';
import HomeImg6 from '@/assets/images/home_img6.png';
import IconSave from '@/assets/svgs/icon_save.svg';
import './index.scss';

// 二楼下拉动画配置
const SCENE_CONFIG = {
  sceneBTop: 100,
  gridHeight: 330,
  boxWidth: 335,
  boxHeight: 321,
  swipeThreshold: 30,
  transitionDuration: 600,
};

const lerp = (start: number, end: number, progress: number) => start + (end - start) * progress;
const pxToRpx = (px: number) => `${px * 2}rpx`;

type LayoutPoint = { width: number; top: number; left: number };

// 照片卡片在两种布局下的位置（设计稿 px，375 基准）
// 状态 A：全屏散落；状态 B：在 325×321 厨房盒子内 2 列 3 行排列
const ELEMENT_LAYOUTS: Record<string, { a: LayoutPoint; b: LayoutPoint }> = {
  img1: { a: { width: 120, top: 275, left: 127.5 }, b: { width: 72, top: 100, left: 183 } },
  img2: { a: { width: 82, top: 500, left: 146.5 }, b: { width: 54, top: 203, left: 98 } },
  img3: { a: { width: 64, top: 450, left: 289 }, b: { width: 36, top: 182, left: 200 } },
  img4: { a: { width: 150, top: 350, left: 112.5 }, b: { width: 80, top: 55, left: 81 } },
  img5: { a: { width: 140, top: 475, left: 10 }, b: { width: 120, top: 150, left: 12 } },
  img6: { a: { width: 116, top: 330, left: 244 }, b: { width: 92, top: 28, left: 166 } },
};

export default function Index() {
  useTabBar(0);
  const [popupVisible, setPopupVisible] = useState(false);
  // home-img0 弹簧动画
  const [imgAnimated, setImgAnimated] = useState(false);
  // 二楼下拉进度：0 为默认状态 A，1 为展开状态 B
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionReady, setTransitionReady] = useState(false);
  const touchStartY = useRef(0);
  const popupVisibleRef = useRef(false);
  popupVisibleRef.current = popupVisible;

  const systemInfo = Taro.getSystemInfoSync();
  const statusBarHeight = systemInfo.statusBarHeight || 0;

  // 与 BaseNavBar 完全相同的导航栏高度计算
  const menuButtonInfo = useMemo(() => {
    if (Taro.getEnv() !== ENV_TYPE.WEAPP) {
      return { top: statusBarHeight + 4, height: 32 };
    }
    try {
      return Taro.getMenuButtonBoundingClientRect();
    } catch {
      return { top: statusBarHeight + 4, height: 32 };
    }
  }, [statusBarHeight]);

  const navBarHeight = useMemo(() => {
    const gap = menuButtonInfo.top - statusBarHeight;
    return statusBarHeight + menuButtonInfo.height + gap * 2;
  }, [statusBarHeight, menuButtonInfo]);

  const windowHeightDesign = useMemo(
    () => (systemInfo.windowHeight * 375) / systemInfo.screenWidth,
    [systemInfo],
  );

  // 底部安全区距离（px），用于 bgWrapper 固定底部定位
  const safeAreaBottomPx = useMemo(() => {
    const rpxPerPx = systemInfo.screenWidth / 375;
    const raw = systemInfo.safeArea
      ? (systemInfo.screenHeight - systemInfo.safeArea.bottom) / rpxPerPx
      : 34;
    return Math.max(raw, 34);
  }, [systemInfo]);

  // 草稿数量
  const [draftCount, setDraftCount] = useState(0);

  // 热门设计作品（走马灯数据）
  const [popularDesigns, setPopularDesigns] = useState<BizPopularDesign[]>([]);

  const checkDrafts = useCallback(() => {
    try {
      const raw = Taro.getStorageSync('fridge_magnet_editor_drafts');
      setDraftCount(Array.isArray(raw) ? raw.length : 0);
    } catch {
      setDraftCount(0);
    }
  }, []);

  useEffect(() => {
    checkDrafts();
  }, [checkDrafts]);

  // 获取热门设计作品
  useEffect(() => {
    productApi
      .getPopularDesignList({ pageNum: 1, pageSize: 20 })
      .then((res) => setPopularDesigns(res.list))
      .catch(() => {});
  }, []);

  useDidShow(() => {
    checkDrafts();
    // 从后台恢复时，如果抽屉仍打开，重新隐藏 TabBar
    if (popupVisibleRef.current) {
      hideTabBar();
    }
  });

  // 监听其它页面发起的"打开首页抽屉"事件
  useEffect(() => {
    const handler = () => {
      hideTabBar();
      setPopupVisible(true);
    };
    Taro.eventCenter.on('home:open-drawer', handler);
    return () => {
      Taro.eventCenter.off('home:open-drawer', handler);
    };
  }, []);

  // 调试：在开发者工具控制台看实际高度值
  // console.log('statusBarHeight:', statusBarHeight);
  // console.log('navBarHeight:', navBarHeight);

  const showTabBar = () => {
    Taro.eventCenter.trigger('tabbar:show');
  };

  const hideTabBar = () => {
    Taro.eventCenter.trigger('tabbar:hide');
  };

  const handleMakeClick = () => {
    hideTabBar();
    setPopupVisible(true);
  };

  const handlePopupClose = () => {
    showTabBar();
    setPopupVisible(false);
  };

  // 组件卸载时恢复 TabBar（防止弹窗打开时页面被切走导致 TabBar 一直隐藏）
  useEffect(() => {
    return () => {
      showTabBar();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useDidHide(() => {
    showTabBar();
  });

  // 分享给朋友
  useShareAppMessage(() => ({
    title: '把自己的照片做成冰箱贴',
    imageUrl: ShareBg,
  }));

  // 分享到朋友圈
  useShareTimeline(() => ({
    title: '把自己的照片做成冰箱贴',
  }));

  // home-img0 弹簧动画触发
  useEffect(() => {
    const t = setTimeout(() => setImgAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  const handleConfirm = (selectedItems: SelectedSpec[]) => {
    if (selectedItems.length === 0) {
      Taro.showToast({ title: '请至少选择一个规格', icon: 'none' });
      return;
    }

    // 按数量展开：选 2 件则复制为两条 quantity=1 的记录
    const expandedSpecs: SelectedSpec[] = [];
    selectedItems.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        expandedSpecs.push({ ...item, quantity: 1 });
      }
    });

    const specsJson = encodeURIComponent(JSON.stringify(expandedSpecs));
    console.log(
      '[home] 传给编辑器的数据:',
      JSON.stringify(expandedSpecs.map((s) => ({ price: s.price }))),
    );
    showTabBar();
    setPopupVisible(false);

    Taro.navigateTo({
      url: `/pages-sub/editor/index?specs=${specsJson}`,
    });
  };

  // 二楼下拉/上划手势：检测方向后自动播放完整动画
  const handleTouchStart = useCallback(
    (e: any) => {
      if (isAnimating) return;
      touchStartY.current = e.touches[0].clientY;
    },
    [isAnimating],
  );

  const handleTouchEnd = useCallback(
    (e: any) => {
      if (isAnimating) return;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      if (Math.abs(deltaY) < SCENE_CONFIG.swipeThreshold) return;

      const target = deltaY > 0 ? 1 : 0;
      if (target === progress) return;

      setIsAnimating(true);
      setProgress(target);
      setTimeout(() => setIsAnimating(false), SCENE_CONFIG.transitionDuration);
    },
    [isAnimating, progress],
  );

  // 延迟启用 transition，避免初始渲染时图片"拉伸再变正常"
  useEffect(() => {
    const t = setTimeout(() => setTransitionReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  const transition = transitionReady ? `all ${SCENE_CONFIG.transitionDuration}ms linear` : 'none';
  // 卡片/按钮只过渡位置和宽度，不含 height，避免 mode='widthFix' 的图片高度过渡产生拉伸
  const elementTransition = transitionReady
    ? `width ${SCENE_CONFIG.transitionDuration}ms linear, top ${SCENE_CONFIG.transitionDuration}ms linear, left ${SCENE_CONFIG.transitionDuration}ms linear`
    : 'none';

  const sceneBTotalHeight = useMemo(() => SCENE_CONFIG.gridHeight, []);

  const sceneStyle = useMemo(
    () => ({
      position: 'fixed' as const,
      top: pxToRpx(lerp(0, SCENE_CONFIG.sceneBTop, progress)),
      left: '0',
      width: '100%',
      height: pxToRpx(lerp(windowHeightDesign, sceneBTotalHeight, progress)),
      zIndex: 10,
      transition,
    }),
    [progress, windowHeightDesign, sceneBTotalHeight, transition],
  );

  const bgWrapperStyle = useMemo(() => {
    const boxLeft = (375 - SCENE_CONFIG.boxWidth) / 2;
    return {
      position: 'fixed' as const,
      bottom: pxToRpx(lerp(0, safeAreaBottomPx, progress)),
      left: pxToRpx(lerp(0, boxLeft, progress)),
      width: pxToRpx(lerp(375, SCENE_CONFIG.boxWidth, progress)),
      height: pxToRpx(lerp(windowHeightDesign, SCENE_CONFIG.boxHeight, progress)),
      borderRadius: pxToRpx(lerp(0, 24, progress)),
      borderWidth: pxToRpx(lerp(0, 4, progress)),
      borderStyle: 'solid' as const,
      borderColor: '#FFFFFF',
      overflow: 'hidden' as const,
      zIndex: 10,
      transition,
    };
  }, [progress, windowHeightDesign, safeAreaBottomPx, transition]);

  const bgStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      top: pxToRpx(lerp(50, 0, progress)),
      left: pxToRpx(lerp(-29, 0, progress)),
      width: pxToRpx(lerp(594, SCENE_CONFIG.boxWidth, progress)),
      height: pxToRpx(lerp(windowHeightDesign, SCENE_CONFIG.boxHeight, progress)),
      transition,
    }),
    [progress, windowHeightDesign, transition],
  );

  const titleStyle = useMemo(
    () => ({
      opacity: 1 - progress,
      transition,
    }),
    [progress, transition],
  );

  const getElementStyle = useCallback(
    (a: LayoutPoint, b: LayoutPoint) => ({
      position: 'absolute' as const,
      zIndex: 999,
      width: pxToRpx(lerp(a.width, b.width, progress)),
      top: pxToRpx(lerp(a.top, b.top, progress)),
      left: pxToRpx(lerp(a.left, b.left, progress)),
      transition: elementTransition,
    }),
    [progress, elementTransition],
  );

  const gridPlaceholderStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      // height: pxToRpx(lerp(0, SCENE_CONFIG.gridHeight, progress)),
      opacity: progress,
      zIndex: 1,
      transition,
    }),
    [progress, transition],
  );

  const img0Style = useMemo(
    () => ({
      opacity: 1 - progress,
      transition,
    }),
    [progress, transition],
  );

  // 走马灯：按 designType 分列，数据不足时 fallback 占位
  const col1Designs = useMemo(
    () => popularDesigns.filter((d) => d.designType === '1'),
    [popularDesigns],
  );
  const col2Designs = useMemo(
    () => popularDesigns.filter((d) => d.designType === '2'),
    [popularDesigns],
  );

  const col1Items = useMemo(() => {
    const list = col1Designs.length > 0 ? col1Designs : Array(6).fill(null);
    return list.map((d, i) => (
      <View key={`col1-${i}`} className='home-grid-col-item'>
        {d ? (
          <Image
            className='home-grid-col-img'
            src={d.designImg}
            style={{ width: pxToRpx(173), height: pxToRpx(113) }}
            mode='aspectFill'
          />
        ) : (
          <View
            className='home-grid-col-img'
            style={{ width: pxToRpx(173), height: pxToRpx(113) }}
          />
        )}
      </View>
    ));
  }, [col1Designs]);

  const col2Items = useMemo(() => {
    const list = col2Designs.length > 0 ? col2Designs : Array(6).fill(null);
    return list.map((d, i) => (
      <View key={`col2-${i}`} className='home-grid-col-item'>
        {d ? (
          <Image
            className='home-grid-col-img'
            src={d.designImg}
            style={{ width: pxToRpx(108), height: pxToRpx(129) }}
            mode='aspectFill'
          />
        ) : (
          <View
            className='home-grid-col-img'
            style={{ width: pxToRpx(108), height: pxToRpx(129) }}
          />
        )}
      </View>
    ));
  }, [col2Designs]);

  return (
    <BasePage navShowBack={false} navTitle='冰箱贴上爱' navTitleIcon={logoIcon}>
      <View
        className='home-bg-wrapper'
        style={bgWrapperStyle}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image src={HomeBg} className='home-bg' style={bgStyle} mode='aspectFill' />
        <Image
          src={HomeImg1}
          className='home-img1'
          style={getElementStyle(ELEMENT_LAYOUTS.img1.a, ELEMENT_LAYOUTS.img1.b)}
          mode='widthFix'
        />
        <Image
          src={HomeImg2}
          className='home-img2'
          style={getElementStyle(ELEMENT_LAYOUTS.img2.a, ELEMENT_LAYOUTS.img2.b)}
          mode='widthFix'
        />
        <Image
          src={HomeImg3}
          className='home-img3'
          style={getElementStyle(ELEMENT_LAYOUTS.img3.a, ELEMENT_LAYOUTS.img3.b)}
          mode='widthFix'
        />
        <Image
          src={HomeImg4}
          className='home-img4'
          style={getElementStyle(ELEMENT_LAYOUTS.img4.a, ELEMENT_LAYOUTS.img4.b)}
          mode='widthFix'
        />
        <Image
          src={HomeImg5}
          className='home-img5'
          style={getElementStyle(ELEMENT_LAYOUTS.img5.a, ELEMENT_LAYOUTS.img5.b)}
          mode='widthFix'
        />
        <Image
          src={HomeImg6}
          className='home-img6'
          style={getElementStyle(ELEMENT_LAYOUTS.img6.a, ELEMENT_LAYOUTS.img6.b)}
          mode='widthFix'
        />
      </View>
      <View
        className='home-scene'
        style={sceneStyle}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <View className='home-title-box' style={{ top: `${navBarHeight + 60}px`, ...titleStyle }}>
          <View className='home-title'>传自己的照片</View>
          <View className='home-subtitle'>定制冰箱贴</View>
        </View>
        <View
          className={`home-grid-placeholder${transitionReady ? ' home-grid-placeholder--ready' : ''}`}
          style={gridPlaceholderStyle}
        >
          <View className='home-grid-col'>
            <View className='home-grid-col-inner'>
              {col1Items}
              {col1Items}
            </View>
          </View>
          <View className='home-grid-col'>
            <View className='home-grid-col-inner'>
              {col2Items}
              {col2Items}
            </View>
          </View>
        </View>
      </View>
      <View
        className='home-start-btn'
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onClick={handleMakeClick}
      >
        开始定制
      </View>
      <Image
        src={HomeImg0}
        className={`home-img0${imgAnimated ? ' home-img0--animate' : ''}`}
        mode='widthFix'
        style={img0Style}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      {draftCount > 0 && (
        <View
          className='home-draft'
          style={{ bottom: 'max(calc(env(safe-area-inset-bottom) + 11px), 45px)' }}
          onClick={() => Taro.navigateTo({ url: '/pages-sub/draft/index' })}
        >
          <View className='home-draft-box'>
            <Image src={IconSave} className='home-save-img' mode='widthFix' />
            <View className='home-draft-num'>{draftCount}</View>
          </View>
        </View>
      )}
      <SpecSelectPopup
        visible={popupVisible}
        onClose={handlePopupClose}
        onConfirm={handleConfirm}
      />
    </BasePage>
  );
}
