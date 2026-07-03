import { View } from '@tarojs/components';
import Taro, { useReady, ENV_TYPE } from '@tarojs/taro';
import { ReactNode, useMemo, useState, useCallback, useEffect } from 'react';
import BaseNavBar from '../base-nav-bar';

import './index.scss';

/**
 * BasePage 页面容器组件
 *
 * 功能特性：
 * - 自动处理状态栏和导航栏占位
 * - 支持底部安全区域适配（iPhone X 及以上机型）
 * - 可集成自定义导航栏
 * - 支持页面背景色和内边距自定义
 * - 支持底部固定栏安全区适配
 *
 * 注意事项：
 * - 底部安全区使用 Taro.getSystemInfoSync().safeArea 手动计算
 * - 当使用 fixed 底部栏时，建议设置 bottomBarHeight 属性
 * - safeAreaBackgroundColor 用于设置安全区占位区域的背景色
 *
 * @example
 * // 基础用法（无导航栏）
 * <BasePage>
 *   <View>页面内容</View>
 * </BasePage>
 *
 * @example
 * // 带导航栏
 * <BasePage
 *   navTitle="页面标题"
 *   navBackgroundColor="#fff"
 * >
 *   <View>页面内容</View>
 * </BasePage>
 *
 * @example
 * // 带底部固定栏（自动处理安全区）
 * <BasePage
 *   navTitle="订单"
 *   bottomBarHeight={70}
 *   bottomBarComponent={
 *     <View className="bottom-bar">底部栏内容</View>
 *   }
 *   safeAreaBackgroundColor="#fff"
 * >
 *   <View>页面内容</View>
 * </BasePage>
 */
interface BasePageProps {
  /** 页面内容 */
  children?: ReactNode;
  /** 页面背景色，默认 "#f5f5f5" */
  backgroundColor?: string;
  /** 页面内边距，默认 "0" */
  padding?: string;
  /** 是否启用底部安全区适配，默认 true */
  paddingBottomSafe?: boolean;
  /**
   * 底部固定栏高度（不含安全区），用于计算页面底部 padding
   * 如果不设置，将自动测量 bottomBarComponent 的实际高度
   */
  bottomBarHeight?: number;
  /** 底部固定栏组件（渲染在安全区占位内） */
  bottomBarComponent?: ReactNode;
  /** 底部安全区背景色（当有 bottomBarHeight 时生效） */
  safeAreaBackgroundColor?: string;
  /** 自定义类名 */
  className?: string;
  /** 导航栏标题 */
  navTitle?: string;
  /** 是否显示导航栏返回按钮，默认 true */
  navShowBack?: boolean;
  /** 导航栏返回按钮图片地址 */
  navBackIcon?: string;
  /** 导航栏左侧自定义组件 */
  navLeftComponent?: ReactNode;
  /** 导航栏右侧自定义组件 */
  navRightComponent?: ReactNode;
  /** 导航栏背景色，默认 "#ffffff" */
  navBackgroundColor?: string;
  /** 导航栏文字颜色，默认 "#000000" */
  navTextColor?: string;
  /** 导航栏是否固定，默认 true */
  navFixed?: boolean;
  /** 导航栏是否显示底部边框，默认 true */
  navShowBorder?: boolean;
  /** 导航栏标题前图标 */
  navTitleIcon?: string;
  /** 导航栏左侧点击回调 */
  onNavLeftClick?: () => void;
  /** 导航栏右侧点击回调 */
  onNavRightClick?: () => void;
}

export default function BasePage({
  children,
  backgroundColor = '#F6F6F6',
  padding = '0',
  paddingBottomSafe = true,
  bottomBarHeight: propBottomBarHeight,
  bottomBarComponent,
  safeAreaBackgroundColor,
  className = '',
  navTitle = '',
  navShowBack = true,
  navBackIcon,
  navLeftComponent,
  navRightComponent,
  navBackgroundColor = '#F6F6F6',
  navTextColor = '#000000',
  navFixed = true,
  navShowBorder = false,
  navTitleIcon,
  onNavLeftClick,
  onNavRightClick,
}: BasePageProps) {
  const systemInfo = Taro.getSystemInfoSync();
  const isWeapp = Taro.getEnv() === ENV_TYPE.WEAPP;
  const statusBarHeight = systemInfo.statusBarHeight || 0;

  const [measuredHeight, setMeasuredHeight] = useState(0);

  /**
   * 判断是否需要底部占位
   */
  const hasBottomBar = !!(bottomBarComponent || (propBottomBarHeight && propBottomBarHeight > 0));

  /**
   * 自动测量 bottomBarComponent 高度
   * 当未传入 bottomBarHeight 时，使用自动测量值
   */
  const measureBottomBarHeight = useCallback(
    (retryCount: number = 0) => {
      if (propBottomBarHeight !== undefined || !hasBottomBar) {
        return;
      }

      const query = Taro.createSelectorQuery();
      query
        .select('.base-page__bottom-bar-area')
        .boundingClientRect((rect: any) => {
          if (rect && rect.height > 0) {
            setMeasuredHeight(rect.height);
            return;
          }

          if (retryCount < 8) {
            setTimeout(
              () => {
                measureBottomBarHeight(retryCount + 1);
              },
              retryCount < 2 ? 50 : 120,
            );
          }
        })
        .exec();
    },
    [hasBottomBar, propBottomBarHeight],
  );

  useReady(() => {
    measureBottomBarHeight();
  });

  useEffect(() => {
    measureBottomBarHeight();
  }, [measureBottomBarHeight, bottomBarComponent]);

  useEffect(() => {
    if (Taro.getEnv() !== ENV_TYPE.WEB || propBottomBarHeight !== undefined || !hasBottomBar) {
      return;
    }

    const handleResize = () => {
      measureBottomBarHeight();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [hasBottomBar, measureBottomBarHeight, propBottomBarHeight]);

  /**
   * 获取胶囊按钮位置信息
   */
  const menuButtonInfo = useMemo(() => {
    if (Taro.getEnv() !== ENV_TYPE.WEAPP) {
      return {
        top: statusBarHeight + 4,
        height: 32,
      };
    }

    try {
      return Taro.getMenuButtonBoundingClientRect();
    } catch (e) {
      return {
        top: statusBarHeight + 4,
        height: 32,
      };
    }
  }, [statusBarHeight]);

  /**
   * 计算导航栏总高度
   * 用于设置页面 paddingTop，避免内容被导航栏遮挡
   */
  const navBarHeight = useMemo(() => {
    const gap = menuButtonInfo.top - statusBarHeight;
    return statusBarHeight + menuButtonInfo.height + gap * 2;
  }, [statusBarHeight, menuButtonInfo]);

  /**
   * 判断是否需要渲染导航栏
   * 当传入 navTitle、需要显示返回按钮或自定义左右组件时显示导航栏
   */
  const hasNavBar = !!(navTitle || navShowBack || navLeftComponent || navRightComponent);

  /**
   * 实际使用的底部栏高度
   * 优先使用传入的 propBottomBarHeight，否则使用自动测量值
   */
  const bottomBarHeight = propBottomBarHeight !== undefined ? propBottomBarHeight : measuredHeight;

  /**
   * 计算底部 padding
   *
   * 问题说明：
   * 原代码使用 `calc(${padding} + env(safe-area-inset-bottom))` 在小程序中可能不生效
   * 原因：
   * 1. 微信小程序对 CSS calc() 和 env() 的支持有限
   * 2. env(safe-area-inset-bottom) 需要特定条件才能生效
   *
   * 解决方案：
   * 使用 Taro 提供的 safeArea 信息进行手动计算
   * 当传入 bottomBarHeight 时，页面底部需要预留：底部栏高度 + 安全区高度
   */
  const paddingBottom = useMemo(() => {
    const safeAreaBottom =
      isWeapp && systemInfo.safeArea ? systemInfo.screenHeight - systemInfo.safeArea.bottom : 0;

    const totalBottom = bottomBarHeight + (paddingBottomSafe ? safeAreaBottom : 0);

    if (totalBottom > 0) {
      return `calc(${padding} + ${totalBottom}px)`;
    }

    return padding;
  }, [
    isWeapp,
    padding,
    paddingBottomSafe,
    bottomBarHeight,
    systemInfo.safeArea,
    systemInfo.screenHeight,
  ]);

  /**
   * 底部安全区高度（供外部 fixed 元素使用）
   * 用于设置底部栏的 bottom 值
   *
   * 注意：
   * - Android 设备通常 safeArea.bottom 为 0
   * - iOS 设备（iPhone X 及以上）safeArea.bottom > 0
   * - 使用 Taro.getSystemInfoSync() 获取的系统信息更可靠
   */
  const safeAreaBottom = useMemo(() => {
    if (!isWeapp || !systemInfo.safeArea) {
      return 0;
    }
    const safeArea = systemInfo.screenHeight - systemInfo.safeArea.bottom;
    return safeArea > 0 ? safeArea : 0;
  }, [isWeapp, systemInfo.safeArea, systemInfo.screenHeight]);

  /**
   * 底部栏样式
   * 使用内联样式确保定位正确
   */
  const bottomBarStyle = useMemo(
    () => ({
      position: 'fixed' as const,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
    }),
    [],
  );

  /**
   * 安全区占位样式
   * 使用传入的 safeAreaBackgroundColor 或继承页面背景色
   */
  const safeAreaStyle = useMemo(
    () => ({
      height: `${safeAreaBottom}px`,
      backgroundColor: safeAreaBackgroundColor || backgroundColor,
    }),
    [safeAreaBottom, safeAreaBackgroundColor, backgroundColor],
  );

  return (
    <View
      className={`base-page ${className}`}
      style={
        {
          backgroundColor,
          paddingTop: hasNavBar && navFixed ? `${navBarHeight}px` : `${statusBarHeight}px`,
          paddingBottom: hasBottomBar ? `${bottomBarHeight + safeAreaBottom}px` : paddingBottom,
        } as any
      }
    >
      {hasNavBar && (
        <BaseNavBar
          title={navTitle}
          titleIcon={navTitleIcon}
          showBack={navShowBack}
          backIcon={navBackIcon}
          leftComponent={navLeftComponent}
          rightComponent={navRightComponent}
          backgroundColor={navBackgroundColor}
          textColor={navTextColor}
          fixed={navFixed}
          showBorder={navShowBorder}
          onLeftClick={onNavLeftClick}
          onRightClick={onNavRightClick}
        />
      )}
      <View className='base-page-content'>{children}</View>
      {hasBottomBar && bottomBarComponent && (
        <View style={bottomBarStyle}>
          <View className='base-page__bottom-bar-area'>{bottomBarComponent}</View>
          {safeAreaBottom > 0 && <View className='base-page__safe-area' style={safeAreaStyle} />}
        </View>
      )}
    </View>
  );
}
