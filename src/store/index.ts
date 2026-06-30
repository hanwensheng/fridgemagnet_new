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
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  setUserInfo: (info: UserInfo | null) => void;
  setToken: (token: string | null) => void;
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
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ hasError: !!error, error }),
  reset: () => set({ isLoading: false, hasError: false, error: null }),
  setUserInfo: (info: UserInfo | null) => set({ userInfo: info }),
  setToken: (token: string | null) => set({ token }),
  isLoggedIn: () => !!get().token,
  logout: () => {
    Taro.removeStorageSync('token');
    Taro.removeStorageSync('userInfo');
    Taro.removeStorageSync('fridge_magnet_drag_hint_shown');
    Taro.removeStorageSync('fridge_magnet_single_draft');
    Taro.removeStorageSync('fridge_magnet_package_draft');
    set({ token: null, userInfo: null });
  },
}));
