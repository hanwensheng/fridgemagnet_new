import { create } from 'zustand';
import Taro from '@tarojs/taro';

export interface UserInfo {
  accountType: number;
  douyinOpenId: string;
  gmtCreate: string;
  pkId: number;
  refreshToken: string;
  status: number;
  token: string;
  userImg: string;
  userName: string;
  userPhone: string;
  wechatOpenId: string;
}

interface AppState {
  isLoading: boolean;
  hasError: boolean;
  error: string | null;
  userInfo: UserInfo | null;
  token: string | null;
  /** 扫码进入时的商户上下文 */
  merchantId: string | null;
  merchantPromoterId: string | null;
  merchantPackageId: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  setUserInfo: (info: UserInfo | null) => void;
  setToken: (token: string | null) => void;
  setMerchantContext: (
    ctx: { merchantId: string; merchantPromoterId?: string; merchantPackageId?: string } | null,
  ) => void;
  isLoggedIn: () => boolean;
  logout: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isLoading: false,
  hasError: false,
  error: null,
  userInfo: (() => {
    try {
      const str = Taro.getStorageSync('userInfo');
      return str ? JSON.parse(str) : null;
    } catch {
      return null;
    }
  })(),
  token: Taro.getStorageSync('token') || null,
  merchantId: (() => {
    try {
      const raw = Taro.getStorageSync('merchantContext');
      return raw ? JSON.parse(raw).merchantId : null;
    } catch {
      return null;
    }
  })(),
  merchantPromoterId: (() => {
    try {
      const raw = Taro.getStorageSync('merchantContext');
      return raw ? JSON.parse(raw).merchantPromoterId || null : null;
    } catch {
      return null;
    }
  })(),
  merchantPackageId: (() => {
    try {
      const raw = Taro.getStorageSync('merchantContext');
      return raw ? JSON.parse(raw).merchantPackageId || null : null;
    } catch {
      return null;
    }
  })(),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ hasError: !!error, error }),
  reset: () => set({ isLoading: false, hasError: false, error: null }),
  setUserInfo: (info: UserInfo | null) => set({ userInfo: info }),
  setToken: (token: string | null) => set({ token }),
  setMerchantContext: (ctx) => {
    if (ctx === null) {
      Taro.removeStorageSync('merchantContext');
      set({ merchantId: null, merchantPromoterId: null, merchantPackageId: null });
    } else {
      const payload = {
        merchantId: ctx.merchantId,
        merchantPromoterId: ctx.merchantPromoterId || '',
        merchantPackageId: ctx.merchantPackageId || '1',
      };
      Taro.setStorageSync('merchantContext', JSON.stringify(payload));
      set(payload);
    }
  },
  isLoggedIn: () => !!get().token,
  logout: () => {
    Taro.removeStorageSync('token');
    Taro.removeStorageSync('userInfo');
    Taro.removeStorageSync('fridge_magnet_drag_hint_shown');
    Taro.removeStorageSync('fridge_magnet_single_draft');
    Taro.removeStorageSync('fridge_magnet_package_draft');
    Taro.removeStorageSync('fridge_magnet_editor_drafts');
    Taro.removeStorageSync('merchantContext');
    set({
      token: null,
      userInfo: null,
      merchantId: null,
      merchantPromoterId: null,
      merchantPackageId: null,
    });
  },
}));
