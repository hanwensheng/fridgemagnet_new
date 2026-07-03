import { View, Text, Image } from '@tarojs/components';
import Taro, { ENV_TYPE } from '@tarojs/taro';
import { ReactNode, useMemo } from 'react';
import defaultBackIcon from '@/assets/svgs/icon_back.svg';
import './index.scss';

/**
 * BaseNavBar 自定义导航栏组件
 *
 * 功能特性：
 * - 自动适配不同设备的状态栏和胶囊按钮高度
 * - 支持固定定位和相对定位两种模式
 * - 提供左右侧自定义组件插槽
 * - 支持返回按钮显示控制
 *
 * @example
 * // 基础用法
 * <BaseNavBar title="页面标题" />
 *
 * @example
 * // 隐藏返回按钮
 * <BaseNavBar title="首页" showBack={false} />
 *
 * @example
 * // 自定义左右侧内容
 * <BaseNavBar
 *   title="消息"
 *   leftComponent={<Text>取消</Text>}
 *   rightComponent={<Text>编辑</Text>}
 *   onLeftClick={handleCancel}
 *   onRightClick={handleEdit}
 * />
 */
interface BaseNavBarProps {
  /** 导航栏标题文本 */
  title?: string;
  /** 是否显示返回按钮，默认 true */
  showBack?: boolean;
  /** 返回按钮图标地址，默认使用 icon_back.svg */
  backIcon?: string;
  /** 左侧自定义组件（优先级高于 showBack） */
  leftComponent?: ReactNode;
  /** 右侧自定义组件 */
  rightComponent?: ReactNode;
  /** 导航栏总高度（包含状态栏），不传则自动计算 */
  navHeight?: number;
  /** 导航栏背景色，默认 "#ffffff" */
  backgroundColor?: string;
  /** 文字颜色，默认 "#000000" */
  textColor?: string;
  /** 自定义类名 */
  className?: string;
  /** 左侧区域点击回调 */
  onLeftClick?: () => void;
  /** 右侧区域点击回调 */
  onRightClick?: () => void;
  /** 是否固定定位，默认 true */
  fixed?: boolean;
  /** 层级，默认 1000 */
  zIndex?: number;
  /** 标题是否加粗，默认 true */
  titleBold?: boolean;
  /** 标题字体大小，默认 34 */
  titleSize?: number;
  /** 标题前图标地址 */
  titleIcon?: string;
  /** 是否显示底部边框，默认 true */
  showBorder?: boolean;
}

export default function BaseNavBar({
  title = '',
  showBack = true,
  backIcon = defaultBackIcon,
  leftComponent,
  rightComponent,
  navHeight,
  backgroundColor = '#F6F6F6',
  textColor = '#000000',
  className = '',
  onLeftClick,
  onRightClick,
  fixed = true,
  zIndex = 1000,
  titleBold = false,
  titleSize = 36,
  titleIcon,
  showBorder = true,
}: BaseNavBarProps) {
  const systemInfo = Taro.getSystemInfoSync();
  const statusBarHeight = systemInfo.statusBarHeight || 0;

  /**
   * 获取胶囊按钮位置信息
   * 使用 useMemo 避免重复计算
   */
  const menuButtonInfo = useMemo(() => {
    const fallback = {
      top: statusBarHeight + 4,
      height: 32,
      width: 87,
      right: systemInfo.windowWidth - 7,
    };

    if (Taro.getEnv() !== ENV_TYPE.WEAPP) {
      return fallback;
    }

    try {
      return Taro.getMenuButtonBoundingClientRect();
    } catch (e) {
      /**
       * 降级处理：当无法获取胶囊信息时使用默认值
       * 默认胶囊高度 32px，距离顶部 statusBarHeight + 4px
       */
      return fallback;
    }
  }, [statusBarHeight, systemInfo.windowWidth]);

  /**
   * 计算导航栏总高度
   * 公式：状态栏高度 + 胶囊高度 + 胶囊上下间距 * 2
   * 胶囊高度和间距来自微信原生（不可修改），动态跟随以保证胶囊视觉居中
   */
  const calculatedNavHeight = useMemo(() => {
    if (navHeight) return navHeight;
    const gap = menuButtonInfo.top - statusBarHeight;
    return statusBarHeight + menuButtonInfo.height + gap * 2;
  }, [navHeight, statusBarHeight, menuButtonInfo]);

  /**
   * 处理左侧区域点击
   * 优先调用 onLeftClick，无自定义组件且 showBack 为 true 时返回上一页
   */
  const handleLeftClick = () => {
    if (onLeftClick) {
      onLeftClick();
    } else if (showBack && !leftComponent) {
      Taro.navigateBack().catch(() => {});
    }
  };

  /**
   * 判断左侧区域是否可点击
   */
  const isLeftClickable = showBack || leftComponent || onLeftClick;

  return (
    <View
      className={`base-nav-bar ${className} ${showBorder ? 'base-nav-bar--border' : ''}`}
      style={{
        position: fixed ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        height: `${calculatedNavHeight}px`,
        backgroundColor,
        zIndex,
      }}
    >
      {/* 状态栏占位区域 */}
      <View className='base-nav-bar__status-bar' style={{ height: `${statusBarHeight}px` }} />
      {/* 导航栏内容区域 */}
      <View
        className='base-nav-bar__content'
        style={{
          height: `${calculatedNavHeight - statusBarHeight}px`,
        }}
      >
        {/* 左侧区域 */}
        <View
          className={`base-nav-bar__left ${isLeftClickable ? 'base-nav-bar__left--clickable' : ''}`}
          onClick={isLeftClickable ? handleLeftClick : undefined}
        >
          {leftComponent ||
            (showBack && (
              <View className='base-nav-bar__back-btn'>
                <Image className='base-nav-bar__back-icon' src={backIcon} />
              </View>
            ))}
        </View>

        {/* 标题区域 */}
        <View
          className='base-nav-bar__title'
          style={{
            color: textColor,
            fontWeight: titleBold ? 600 : 400,
            fontSize: `${titleSize}rpx`,
          }}
        >
          {titleIcon && <Image className='base-nav-bar__title-icon' src={titleIcon} />}
          <Text>{title}</Text>
        </View>

        {/* 右侧区域 */}
        <View
          className={`base-nav-bar__right ${rightComponent && onRightClick ? 'base-nav-bar__right--clickable' : ''}`}
          {...(onRightClick ? { onClick: onRightClick } : {})}
        >
          {rightComponent}
        </View>
      </View>
    </View>
  );
}
