import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';
import BasePage from '@/components/base-page';

import LogoIcon from '@/assets/svgs/icon_logo.svg';
import SplashBg from '@/assets/images/splash_bg.png';
import SplashImg1 from '@/assets/images/splash_img1.png';
import SplashImg2 from '@/assets/images/splash_img2.png';
import SplashImg3 from '@/assets/images/splash_img3.png';

import './index.scss';

const TOTAL_IMAGES = 4;

/** 计算 logo 文字的对齐 top 值 */
function getTextTop(): number {
  try {
    const menuButton = Taro.getMenuButtonBoundingClientRect();
    return Math.round(menuButton.top + menuButton.height / 2 - 9);
  } catch {
    return 48;
  }
}

/** 计算最终 logo 的 transform 值（纯 transform 动画，不走重排） */
function getFinalLogoTransform(textTop: number): string {
  try {
    const { windowWidth, windowHeight } = Taro.getSystemInfoSync();
    const scale = 18 / 37;
    // 元素自然中心在 (50vw + 18.5, 50vh + 18.5)
    // logo 中心对齐文字视觉中心：文字 top=textTop，lineHeight=18，视觉中心=textTop+9
    const tx = 29 - windowWidth / 2 - 18.5;
    const ty = textTop - windowHeight / 2 - 18.5 + 9;
    return `translate(${tx}px, ${ty}px) scale(${scale})`;
  } catch {
    return 'translate(calc(29px - 50vw), calc(48px - 50vh)) scale(0.486)';
  }
}

export default function Splash() {
  const [loaded, setLoaded] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  // 照片动画阶段：0=隐藏, 1=过冲位置, 2=回弹到位
  const [photoStage, setPhotoStage] = useState(0);
  // 页面淡出
  const [fadingOut, setFadingOut] = useState(false);

  const textTop = useState(() => getTextTop())[0];
  const logoFinalTransform = useState(() => getFinalLogoTransform(textTop))[0];

  const handleImageLoad = () => {
    setImagesLoaded((prev) => prev + 1);
  };

  useEffect(() => {
    if (imagesLoaded >= TOTAL_IMAGES) {
      setLoaded(true);
    }
  }, [imagesLoaded]);

  // Logo 回到顶部后延迟 1.2s（logo 动画 0.8s + 停留 0.2s），启动照片两阶段坠落动画
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      setPhotoStage(1); // 第一阶段：冲到过冲位置
    }, 1000);
    return () => clearTimeout(timer);
  }, [loaded]);

  // 第二阶段：从过冲位置回弹到最终位置
  useEffect(() => {
    if (photoStage !== 1) return;
    const timer = setTimeout(() => {
      setPhotoStage(2); // 回弹到位
    }, 400);
    return () => clearTimeout(timer);
  }, [photoStage]);

  // 全部动画完成后等 1 秒 → 淡出
  useEffect(() => {
    if (photoStage !== 2) return;
    const timer = setTimeout(() => {
      setFadingOut(true); // 开始淡出
    }, 1000);
    return () => clearTimeout(timer);
  }, [photoStage]);

  // 淡出到一半时跳转，避免白底露出
  useEffect(() => {
    if (!fadingOut) return;
    const timer = setTimeout(() => {
      Taro.switchTab({ url: '/pages/index/index' });
    }, 450); // opacity transition 0.6s，提前 150ms 跳转
    return () => clearTimeout(timer);
  }, [fadingOut]);

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setLoaded(true);
    }, 2500);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <BasePage navShowBack={false}>
      <View className={`splash-page${fadingOut ? ' splash-page--fading' : ''}`}>
        <Image
          src={LogoIcon}
          className='splash-logo'
          mode='aspectFit'
          style={loaded ? { transform: logoFinalTransform } : undefined}
        />
        <Text
          className='splash-logo-text'
          style={{ top: `${textTop}px`, opacity: loaded ? 1 : undefined }}
        >
          冰箱贴上爱
        </Text>
        <View className={`splash-overlay ${loaded ? 'splash-overlay--hidden' : ''}`} />

        <View className='splash-content'>
          <View className='splash-stage'>
            <Image src={SplashBg} className='splash-bg' mode='widthFix' onLoad={handleImageLoad} />
            <Image
              src={SplashImg1}
              className={`splash-photo splash-photo--1 splash-photo--s${photoStage}`}
              mode='aspectFit'
              onLoad={handleImageLoad}
            />
            <Image
              src={SplashImg2}
              className={`splash-photo splash-photo--2 splash-photo--s${photoStage}`}
              mode='aspectFit'
              onLoad={handleImageLoad}
            />
            <Image
              src={SplashImg3}
              className={`splash-photo splash-photo--3 splash-photo--s${photoStage}`}
              mode='aspectFit'
              onLoad={handleImageLoad}
            />
          </View>
          <View className='splash-slogan'>
            <Text className='splash-slogan-line'>让每一张人生照片</Text>
            <Text className='splash-slogan-line'>都有地方收藏</Text>
          </View>
        </View>
      </View>
    </BasePage>
  );
}
