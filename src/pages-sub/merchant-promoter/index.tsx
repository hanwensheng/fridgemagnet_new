import { View, Image, Button, Text, Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import BasePage from '@/components/base-page';
import iconMerchantAdd from '@/assets/svgs/icon_merchant_add.svg';
import iconCode from '@/assets/images/kf_code.png';
import iconQrCode from '@/assets/images/qr_code.png';
import { useMerchantPromoterLogic } from './index.logic';
import './index.scss';

const MerchantPromoter = () => {
  const {
    viewState,
    qrCodeUrl,
    isLoading,
    agreedToTerms,
    handleGetPhoneNumber,
    handleSaveQrCode,
    toggleAgreement,
    handleViewAgreement,
  } = useMerchantPromoterLogic();

  // 未登录状态 - 显示登录界面
  if (viewState === 'login') {
    return (
      <BasePage navTitle='注册成为推广员' navShowBack={false}>
        <View className='content'>
          <View className='icon-circle'>
            <Image className='icon-img' src={iconMerchantAdd} mode='aspectFit' />
          </View>

          <View className='title'>注册成为平台推广员</View>

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
            {isLoading ? '登录中...' : '微信登陆'}
          </Button>

          <View className='agreement-row' onClick={toggleAgreement}>
            <View className={`checkbox ${agreedToTerms ? 'checked' : ''}`}>
              {agreedToTerms && <Text className='check-mark'>✓</Text>}
            </View>
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
        </View>
      </BasePage>
    );
  }

  // 已是推广员状态 - 显示提示联系客服
  if (viewState === 'already-promoter') {
    return (
      <BasePage navTitle='注册成为推广员' navShowBack={false}>
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
      <BasePage navTitle='注册成功' navShowBack={false}>
        <View className='content content-success-top'>
          <View className='icon-box' onClick={handleSaveQrCode}>
            <Image className='icon-qrcode' src={iconQrCode} mode='aspectFit' />
            <Image className='icon-qrcode2' src={qrCodeUrl} mode='aspectFit' />
          </View>
          <View className='save-tip' onClick={handleSaveQrCode}>
            保存推广码到相册
          </View>

          {/* 隐藏的 Canvas 用于合成图片 */}
          <Canvas
            type='2d'
            id='qrcode-canvas'
            style='position: fixed; left: -9999px; top: -9999px; width: 750px; height: 1454px;'
          />
          {/* <View className='success-title'>注册成功</View>

          <View className='qrcode-card'>
            {qrCodeUrl ? (
              <Image
                className='qrcode-image'
                src={qrCodeUrl}
                mode='aspectFit'
                showMenuByLongpress
              />
            ) : (
              <View className='qrcode-image'>二维码加载中...</View>
            )}
          </View>

          <View className='save-tip' onClick={handleSaveQrCode}>
            保存专属推广二维码
          </View> */}

          {/* <View className='bottom-actions'>
            <Button className='action-btn primary' onClick={() => {}}>
              商品首页
            </Button>
            <Button className='action-btn secondary' onClick={() => {}}>
              退出登录
            </Button>
          </View> */}
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
