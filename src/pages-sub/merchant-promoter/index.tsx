import { View, Image, Button, Text, Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import BasePage from '@/components/base-page';
import iconMerchantAdd from '@/assets/svgs/icon_promotion_logo.svg';
import iconRadio from '@/assets/svgs/icon_radio.svg';
import iconRadioActive from '@/assets/svgs/icon_radio_active.svg';
import iconWxLogo from '@/assets/svgs/icon_wx_logo.svg';
import iconCode from '@/assets/images/kf_code.png';
import iconQrCode from '@/assets/images/qr_code.png';
import SplashBg from '@/assets/images/splash_bg.png';
import SplashImg1 from '@/assets/images/splash_img1.png';
import SplashImg2 from '@/assets/images/splash_img2.png';
import SplashImg3 from '@/assets/images/splash_img3.png';
import { useMerchantPromoterLogic } from './index.logic';
import './index.scss';

const MerchantPromoter = () => {
  const {
    viewState,
    qrCodeUrl,
    isLoading,
    agreedToTerms,
    isSaving,
    navBarHeight,
    handleGetPhoneNumber,
    handleSaveQrCode,
    toggleAgreement,
    handleViewAgreement,
  } = useMerchantPromoterLogic();

  // 未登录状态 - 显示登录界面
  if (viewState === 'login') {
    return (
      <BasePage navTitle='注册推广员' navShowBack={false}>
        <View className='content'>
          <View className='icon-circle'>
            <Image className='icon-img' src={iconMerchantAdd} mode='aspectFit' />
          </View>

          <View className='title'>注册成为平台推广员</View>

          <View className='agreement-row' onClick={toggleAgreement}>
            <Image
              className='radio-icon'
              src={agreedToTerms ? iconRadioActive : iconRadio}
              mode='aspectFit'
            />
            <View className='agreement-text'>
              我同意并阅读
              <Text
                className='agreement-link'
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewAgreement();
                }}
              >
                《推广居间合作协议》
              </Text>
            </View>
          </View>

          <Button
            className='wx-login-btn'
            openType={agreedToTerms ? 'getPhoneNumber' : undefined}
            onGetPhoneNumber={agreedToTerms ? handleGetPhoneNumber : undefined}
            onClick={
              agreedToTerms
                ? undefined
                : () => {
                    Taro.showToast({
                      title: '请先同意推广居间合作协议',
                      icon: 'none',
                      duration: 2000,
                    });
                  }
            }
            disabled={isLoading}
          >
            <View className='btn-content'>
              <Image className='btn-icon' src={iconWxLogo} mode='aspectFit' />
              <Text>{isLoading ? '登录中...' : '微信登录'}</Text>
            </View>
          </Button>
        </View>
      </BasePage>
    );
  }

  // 已是推广员状态 - 显示提示联系客服
  if (viewState === 'already-promoter') {
    return (
      <BasePage navTitle='注册推广员' navShowBack={false}>
        <View className='content content-large-top'>
          <View className='title'>抱歉您不是我平台的推广员</View>
          <View className='title title-mt'>请联系客服添加</View>

          <View className='qrcode-card'>
            <Image className='qrcode-image' src={iconCode} mode='aspectFit' showMenuByLongpress />
          </View>

          <View className='title'>扫一扫添加客服微信</View>
        </View>
      </BasePage>
    );
  }

  // 注册成功状态 - 显示推广二维码
  if (viewState === 'success') {
    return (
      <BasePage navShowBack={false} backgroundColor='#1e1e20'>
        <View className='content content-success-top' style={{ paddingTop: `${navBarHeight}px` }}>
          <View className='icon-box' onClick={handleSaveQrCode}>
            <View className='success-title'>传自己的照片</View>
            <View className='success-sub'>定制冰箱贴</View>
            <Image className='icon-qrcode' src={SplashBg} mode='aspectFit' />
            <Image className='SplashImg1' src={SplashImg1} mode='aspectFit' />
            <Image className='SplashImg2' src={SplashImg2} mode='aspectFit' />
            <Image className='SplashImg3' src={SplashImg3} mode='aspectFit' />
            <Image className='icon-qrcode2' src={qrCodeUrl} mode='aspectFit' />
          </View>
          <View className='save-tip' onClick={handleSaveQrCode}>
            保存推广码到相册
          </View>
          {isSaving && (
            <View className='footer-box'>
              <View className='footer-title'>欢迎体验冰箱贴上爱</View>
              <View className='footer-sub'>当我们，把回忆做成冰箱贴</View>
            </View>
          )}

          {/* 隐藏的 Canvas 用于合成图片 */}
          <Canvas
            type='2d'
            id='qrcode-canvas'
            style='position: fixed; left: -9999px; top: -9999px; width: 750px; height: 1624px;'
          />
        </View>
      </BasePage>
    );
  }

  // 商户绑定成功状态 - 只显示 toast，隐藏页面内容
  if (viewState === 'merchant-bind-success') {
    return null;
  }

  return null;
};

export default MerchantPromoter;
