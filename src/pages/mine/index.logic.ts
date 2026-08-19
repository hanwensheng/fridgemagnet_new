import { useCallback, useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import { userApi } from '@/api/modules/user';

export function useMineLogic() {
  const logout = useAppStore((s) => s.logout);
  const setToken = useAppStore((s) => s.setToken);
  const setUserInfo = useAppStore((s) => s.setUserInfo);
  const token = useAppStore((s) => s.token);
  const userInfo = useAppStore((s) => s.userInfo);
  const isLoggedIn = !!token;

  const [isPromoter, setIsPromoter] = useState(false);

  /** 登录后判断是否为推广员，决定是否展示"我的推广"入口 */
  useEffect(() => {
    if (!isLoggedIn) {
      setIsPromoter(false);
      return;
    }
    userApi
      .isPromoter()
      .then((res) => {
        console.log('isPromoter 接口返回：', res);
        setIsPromoter(!!res);
      })
      .catch((err) => {
        console.log('isPromoter 接口请求失败：', err);
        setIsPromoter(false);
      });
  }, [isLoggedIn]);

  const displayName = userInfo?.userName || '游客';

  const navigateByType = useCallback((type: string) => {
    switch (type) {
      case 'address':
        Taro.navigateTo({ url: '/pages-sub/address/index' });
        break;
      case 'order':
        Taro.navigateTo({ url: '/pages-sub/my-orders/index' });
        break;
      case 'service':
        Taro.navigateTo({ url: '/pages-sub/customer-service/index' });
        break;
      case 'horn':
        Taro.navigateTo({ url: '/pages-sub/my-promotion/index' });
        break;
    }
  }, []);

  const handleMenuClick = useCallback(
    (type: string) => {
      if (!isLoggedIn) {
        Taro.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      navigateByType(type);
    },
    [isLoggedIn, navigateByType],
  );

  const handleLogin = useCallback(
    async (e: any) => {
      if (process.env.TARO_ENV !== 'weapp') {
        Taro.showToast({ title: '请使用微信小程序登录', icon: 'none' });
        return;
      }

      if (e.detail.errMsg !== 'getPhoneNumber:ok') {
        Taro.showToast({ title: '您已拒绝授权', icon: 'none' });
        return;
      }

      const phoneCode = e.detail.code;
      Taro.showLoading({ title: '登录中...' });

      try {
        const loginRes = await Taro.login();
        const res = await userApi.miniProgramLogin({
          loginCode: loginRes.code,
          phoneCode,
        });

        if (res.token) {
          Taro.setStorageSync('token', res.token);
          Taro.setStorageSync('userInfo', JSON.stringify(res));
          setToken(res.token);
          setUserInfo(res);
        } else {
          Taro.showToast({ title: '登录失败', icon: 'none' });
        }
      } catch {
        Taro.showToast({ title: '登录失败，请重试', icon: 'none' });
      } finally {
        Taro.hideLoading();
      }
    },
    [setToken, setUserInfo],
  );

  const handleLogout = useCallback(() => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
    }).then((res) => {
      if (res.confirm) {
        logout();
        Taro.switchTab({ url: '/pages/index/index' });
      }
    });
  }, [logout]);

  const handleEditProfile = useCallback(() => {
    Taro.navigateTo({ url: '/pages-sub/edit-profile/index' });
  }, []);

  return {
    isLoggedIn,
    isPromoter,
    displayName,
    userInfo,
    handleMenuClick,
    handleLogin,
    handleLogout,
    handleEditProfile,
  };
}
