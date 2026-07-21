import { useState, useEffect, useMemo } from 'react';
import Taro, { ENV_TYPE } from '@tarojs/taro';
import { useAppStore } from '@/store';
import { userApi } from '@/api/modules/user';

type ViewState = 'login' | 'already-promoter' | 'success' | 'merchant-bind-success';

export const useMerchantPromoterLogic = () => {
  const [viewState, setViewState] = useState<ViewState>('login');
  const [merchantId, setMerchantId] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const { isLoggedIn } = useAppStore();

  /** 计算状态栏 + 导航栏高度 */
  const navBarHeight = useMemo(() => {
    const systemInfo = Taro.getSystemInfoSync();
    const statusBarH = systemInfo.statusBarHeight || 0;
    const isWeapp = Taro.getEnv() === ENV_TYPE.WEAPP;

    let menuButtonInfo: { top: number; height: number };
    if (isWeapp) {
      try {
        menuButtonInfo = Taro.getMenuButtonBoundingClientRect();
      } catch {
        menuButtonInfo = { top: statusBarH + 4, height: 32 };
      }
    } else {
      menuButtonInfo = { top: statusBarH + 4, height: 32 };
    }

    const gap = menuButtonInfo.top - statusBarH;
    return statusBarH + menuButtonInfo.height + gap * 2;
  }, []);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    const sceneFromQuery = params?.scene || '';
    // scene 参数赋值给 merchantId
    setMerchantId(sceneFromQuery);

    if (isLoggedIn()) {
      checkPromoterStatus();
    }
  }, [isLoggedIn]);

  /** 成功状态时设置导航栏为白色文字，其他状态恢复黑色 */
  useEffect(() => {
    if (viewState === 'success') {
      Taro.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#1e1e20',
      });
    } else {
      Taro.setNavigationBarColor({
        frontColor: '#000000',
        backgroundColor: '#F6F6F6',
      });
    }
  }, [viewState]);

  const checkPromoterStatus = async () => {
    // 检查用户是否已经是推广员
    // 这里假设可以通过 userInfo 判断，根据实际接口调整
    // 如果已经是推广员，显示已注册状态
    // 暂时先跳过这个检查，直接允许绑定
  };

  const handleGetPhoneNumber = async (e: any) => {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      Taro.showToast({
        title: '获取手机号失败',
        icon: 'none',
        duration: 2000,
      });
      return;
    }

    if (!merchantId) {
      Taro.showToast({
        title: '缺少商户ID参数',
        icon: 'none',
        duration: 2000,
      });
      return;
    }

    try {
      setIsLoading(true);

      // 获取登录凭证
      const loginRes = await Taro.login();
      const loginCode = loginRes.code;
      const phoneCode = e.detail.code;

      // 调用绑定接口
      const result = await userApi.merchantPromoterBind({
        loginCode,
        phoneCode,
        merchantId,
      });

      // code: "10000" 的两种情况：
      // - data 不等于 null（二维码 URL）→ 注册推广员成功
      // - data 等于 null → 绑定商户成功
      if (result !== null) {
        // 情况1: code: "10000", data: 二维码 URL
        // 注册推广员成功
        setQrCodeUrl(result);
        setViewState('success');
        Taro.showToast({
          title: '注册成功',
          icon: 'success',
          duration: 2000,
        });
      } else {
        // 情况2: code: "10000", data: null
        // 绑定商户成功
        setViewState('merchant-bind-success');
        Taro.showToast({
          title: '绑定商户成功',
          icon: 'success',
          duration: 2000,
        });
      }
    } catch (error: any) {
      console.error('绑定失败:', error);

      // 情况3: code: "5001" → 绑定失败，显示客服联系页面
      setViewState('already-promoter');
      Taro.showToast({
        title: error?.msg || error?.message || '绑定失败，请联系客服',
        icon: 'none',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQrCode = async () => {
    if (!qrCodeUrl) {
      Taro.showToast({
        title: '二维码加载中，请稍后',
        icon: 'none',
        duration: 2000,
      });
      return;
    }

    try {
      setIsSaving(true);
      Taro.showLoading({ title: '生成中...', mask: true });

      // 获取 Canvas 节点
      const query = Taro.createSelectorQuery();
      const res = await new Promise<any>((resolve) => {
        query.select('#qrcode-canvas').fields({ node: true, size: true }).exec(resolve);
      });

      if (!res || !res[0] || !res[0].node) {
        throw new Error('Canvas 节点未找到');
      }

      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = Taro.getSystemInfoSync().pixelRatio;

      // 画布尺寸：设计稿 375×812，导出 2x 倍率，dpr 自适应
      const designWidth = 375;
      const designHeight = 812;
      canvas.width = designWidth * 2 * dpr;
      canvas.height = designHeight * 2 * dpr;
      ctx.scale(2 * dpr, 2 * dpr);

      // 加载图片的辅助函数
      const loadImage = (src: string): Promise<any> => {
        return new Promise((resolve, reject) => {
          const img = canvas.createImage();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`图片加载失败: ${src}`));
          img.src = src;
        });
      };

      // 圆角矩形辅助函数
      const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 2);
        ctx.lineTo(x + w, y + h - r);
        ctx.arc(x + w - r, y + h - r, r, 0, Math.PI * 0.5);
        ctx.lineTo(x + r, y + h);
        ctx.arc(x + r, y + h - r, r, Math.PI * 0.5, Math.PI);
        ctx.lineTo(x, y + r);
        ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
        ctx.closePath();
      };

      // 带 letter-spacing 的文字绘制辅助函数（Canvas 不支持 letter-spacing）
      const fillTextWithSpacing = (text: string, x: number, y: number, spacing: number) => {
        const charWidths: number[] = [];
        let totalWidth = 0;
        for (let i = 0; i < text.length; i++) {
          const w = ctx.measureText(text[i]).width;
          charWidths.push(w);
          totalWidth += w + (i < text.length - 1 ? spacing : 0);
        }
        let cursorX = x - totalWidth / 2;
        for (let i = 0; i < text.length; i++) {
          ctx.fillText(text[i], cursorX, y);
          cursorX += charWidths[i] + spacing;
        }
      };

      // ===== 1. 背景色 =====
      ctx.fillStyle = '#1e1e20';
      ctx.fillRect(0, 0, designWidth, designHeight);

      // ===== 2. 标题文字 =====
      // .success-title: margin-top:0→, top:70px, font-size:28px, font-weight:800, line-height:34px, letter-spacing:3px, color:#FFF
      ctx.fillStyle = '#FFF';
      ctx.font = '800 28px sans-serif';
      ctx.textBaseline = 'top';
      const titleTop = 70;
      fillTextWithSpacing('传自己的照片', designWidth / 2, titleTop, 3);

      // .success-sub: font-size:14px, line-height:20px, letter-spacing:12px, margin-top:6px, color:#FFF
      const subTop = titleTop + 34 + 6; // titleTop + title行高 + margin-top
      ctx.font = '400 14px sans-serif';
      fillTextWithSpacing('定制冰箱贴', designWidth / 2, subTop, 12);

      // ===== 3. 背景大图 (.icon-qrcode: 375×537) =====
      const bgImg = await loadImage(require('@/assets/images/splash_bg.png'));
      const bgY = subTop + 20; // subTop + sub行高，无额外间距
      ctx.drawImage(bgImg, 0, bgY, 375, 537);

      // .icon-box 顶部坐标：页面中绝对定位元素都以 icon-box 为参照，而非背景图
      // 页面中背景图距 icon-box 顶部 = 标题margin-top(10) + 标题行高(34) + 副标题margin-top(6) + 副标题行高(20) = 70px
      const iconBoxTop = titleTop - 10; // 标题有 margin-top:10px，所以 icon-box 顶部 = titleTop - 10

      // ===== 4. 装饰图片（绝对定位，相对 .icon-box 顶部） =====
      // .SplashImg1: 135×140, top:115px, left:108px
      const sp1 = await loadImage(require('@/assets/images/splash_img1.png'));
      ctx.drawImage(sp1, 108, iconBoxTop + 115, 135, 140);

      // .SplashImg2: 75×93, top:210px, left:95px
      const sp2 = await loadImage(require('@/assets/images/splash_img2.png'));
      ctx.drawImage(sp2, 95, iconBoxTop + 210, 75, 93);

      // .SplashImg3: 130×100, top:250px, left:152px
      const sp3 = await loadImage(require('@/assets/images/splash_img3.png'));
      ctx.drawImage(sp3, 142, iconBoxTop + 285, 130, 100);

      // ===== 5. 二维码（绝对定位，相对 .icon-box 顶部，top:375px） =====
      const qrImg = await loadImage(qrCodeUrl);
      const qrSize = 205;
      const qrBorderWidth = 15;
      const qrBorderRadius = 24;
      const qrX = (designWidth - qrSize) / 2;
      const qrY = iconBoxTop + 375 + 60;

      // 白色边框背景
      ctx.fillStyle = '#FFF';
      drawRoundRect(qrX, qrY, qrSize, qrSize, qrBorderRadius);
      ctx.fill();

      // 裁剪绘制二维码
      ctx.save();
      drawRoundRect(
        qrX + qrBorderWidth,
        qrY + qrBorderWidth,
        qrSize - qrBorderWidth * 2,
        qrSize - qrBorderWidth * 2,
        qrBorderRadius - qrBorderWidth > 0 ? qrBorderRadius - qrBorderWidth : 0,
      );
      ctx.clip();
      ctx.drawImage(
        qrImg,
        qrX + qrBorderWidth,
        qrY + qrBorderWidth,
        qrSize - qrBorderWidth * 2,
        qrSize - qrBorderWidth * 2,
      );
      ctx.restore();

      // ===== 6. 底部文案 (footer-box) =====
      // .footer-title: font-size:16px, line-height:22px, letter-spacing:5px
      const footerY = qrY + qrSize + 30; // margin-top:30px 等效间距
      ctx.fillStyle = '#FFF';
      ctx.font = '500 16px sans-serif';
      ctx.textBaseline = 'top';
      fillTextWithSpacing('欢迎体验冰箱贴上爱', designWidth / 2, footerY, 5);

      // .footer-sub: font-size:10px, line-height:22px, letter-spacing:1px
      ctx.font = '400 10px sans-serif';
      fillTextWithSpacing('当我们，把回忆做成冰箱贴', designWidth / 2, footerY + 22, 1);

      // 转换为临时文件
      const tempFilePath = await new Promise<string>((resolve, reject) => {
        Taro.canvasToTempFilePath({
          canvas,
          success: (result) => resolve(result.tempFilePath),
          fail: (err) => reject(err),
        });
      });

      Taro.hideLoading();

      // 保存到相册
      await new Promise<void>((resolve, reject) => {
        Taro.saveImageToPhotosAlbum({
          filePath: tempFilePath,
          success: () => resolve(),
          fail: (err) => reject(err),
        });
      });

      Taro.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 2000,
      });
      setIsSaving(false);
    } catch (error: any) {
      setIsSaving(false);
      Taro.hideLoading();
      console.error('保存推广码失败:', error);

      // 处理用户拒绝授权的情况
      if (error.errMsg && error.errMsg.includes('auth deny')) {
        Taro.showModal({
          title: '提示',
          content: '需要您授权保存图片到相册',
          confirmText: '去授权',
          success: (res) => {
            if (res.confirm) {
              Taro.openSetting();
            }
          },
        });
      } else {
        Taro.showToast({
          title: error.message || '保存失败，请重试',
          icon: 'none',
          duration: 2000,
        });
      }
    }
  };

  const toggleAgreement = () => {
    setAgreedToTerms(!agreedToTerms);
  };

  const handleViewAgreement = () => {
    Taro.navigateTo({
      url: '/pages-sub/promoter-agreement/index',
    });
  };

  return {
    viewState,
    merchantId,
    qrCodeUrl,
    isLoading,
    agreedToTerms,
    isSaving,
    isLoggedIn: isLoggedIn(),
    navBarHeight,
    handleGetPhoneNumber,
    handleSaveQrCode,
    toggleAgreement,
    handleViewAgreement,
  };
};
