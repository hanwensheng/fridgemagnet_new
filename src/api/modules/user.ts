import { request } from '../request';

interface MiniProgramLoginParams {
  loginCode: string;
  phoneCode: string;
}

interface MerchantPromoterBindParams {
  loginCode: string;
  phoneCode: string;
  merchantId: string;
}

export interface LoginResult {
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

export const userApi = {
  /** 小程序手机号登录 */
  miniProgramLogin(params: MiniProgramLoginParams) {
    return request<LoginResult>({
      url: '/miniProgram/login',
      method: 'POST',
      data: `loginCode=${params.loginCode}&phoneCode=${params.phoneCode}`,
      header: { 'content-type': 'application/x-www-form-urlencoded' },
    });
  },

  /** 推广员绑定商户 - 返回二维码 URL 字符串或 null（商户绑定成功） */
  merchantPromoterBind(params: MerchantPromoterBindParams) {
    return request<string | null>({
      url: '/miniProgram/bind',
      method: 'POST',
      data: `loginCode=${params.loginCode}&phoneCode=${params.phoneCode}&merchantId=${params.merchantId}`,
      header: { 'content-type': 'application/x-www-form-urlencoded' },
    });
  },
};
