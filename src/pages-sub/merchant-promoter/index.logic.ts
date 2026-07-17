import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import { userApi } from '@/api/modules/user';

type ViewState = 'login' | 'already-promoter' | 'success' | 'merchant-bind-success';

export const useMerchantPromoterLogic = () => {
  const [viewState, setViewState] = useState<ViewState>('login');
  const [merchantId, setMerchantId] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);

  const { isLoggedIn } = useAppStore();

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    const sceneFromQuery = params?.scene || '';
    // scene 参数赋值给 merchantId
    setMerchantId(sceneFromQuery);

    if (isLoggedIn()) {
      checkPromoterStatus();
    }
  }, [isLoggedIn]);

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

      // 设置画布尺寸（与背景图实际尺寸一致：750 * 1454）
      const canvasWidth = 750;
      const canvasHeight = 1454;
      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;
      ctx.scale(dpr, dpr);

      // 加载背景图
      const bgImage = canvas.createImage();
      await new Promise<void>((resolve, reject) => {
        bgImage.onload = () => resolve();
        bgImage.onerror = () => reject(new Error('背景图加载失败'));
        // 使用推广码背景图
        bgImage.src = require('@/assets/images/qr_code.png');
      });

      // 绘制背景图
      ctx.drawImage(bgImage, 0, 0, canvasWidth, canvasHeight);

      // 加载二维码图片
      const qrImage = canvas.createImage();
      await new Promise<void>((resolve, reject) => {
        qrImage.onload = () => resolve();
        qrImage.onerror = () => reject(new Error('二维码加载失败'));
        qrImage.src = qrCodeUrl;
      });

      // 二维码参数（二倍图，一倍图参数需要 ×2）
      // 一倍图：148×148, border:2px, radius:18px, 底部距离:105px
      const qrSize = 148 * 2; // 296px
      const borderWidth = 2 * 2; // 4px
      const borderRadius = 18 * 2; // 36px
      const bottomDistance = 105 * 2; // 210px
      const qrX = (canvasWidth - qrSize) / 2; // 水平居中
      const qrY = canvasHeight - bottomDistance - qrSize; // 距离底部 210px

      // 手动绘制圆角矩形的辅助函数
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

      // 绘制白色带圆角的边框背景
      ctx.fillStyle = '#EDD8C2';
      drawRoundRect(
        qrX - borderWidth,
        qrY - borderWidth,
        qrSize + borderWidth * 2,
        qrSize + borderWidth * 2,
        borderRadius,
      );
      ctx.fill();

      // 裁剪出圆角区域，然后绘制二维码
      ctx.save();
      drawRoundRect(qrX, qrY, qrSize, qrSize, borderRadius - borderWidth);
      ctx.clip();
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
      ctx.restore();

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
    } catch (error: any) {
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
    isLoggedIn: isLoggedIn(),
    handleGetPhoneNumber,
    handleSaveQrCode,
    toggleAgreement,
    handleViewAgreement,
  };
};
