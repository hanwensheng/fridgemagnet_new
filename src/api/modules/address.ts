import { request } from '../request';

export interface AddressItem {
  addressType: string;
  city: string;
  country: string;
  detailAddress: string;
  district: string;
  gmtCreate: string;
  gmtModified: string;
  isDefault: string;
  pkId: string;
  province: string;
  recipient: string;
  recipientPhone: string;
  userId: string;
}

export interface SaveAddressParams {
  addressType?: string;
  city?: string;
  country?: number;
  detailAddress?: string;
  district?: string;
  isDefault?: string;
  province?: string;
  recipient?: string;
  recipientPhone?: string;
  userId?: string;
  pkId?: string;
}

export const addressApi = {
  save(data: SaveAddressParams) {
    return request({
      url: '/v1/appUserAddress/save',
      method: 'POST',
      data,
    });
  },

  findAllBySearch(showLoading = true) {
    return request<AddressItem[]>({
      url: '/v1/appUserAddress/findAllBySearch',
      method: 'POST',
      data: {},
      showLoading,
    });
  },

  findDefault(showLoading = true) {
    return request<AddressItem | null>({
      url: '/v1/appUserAddress/findDefault',
      method: 'GET',
      showLoading,
    });
  },

  deleteAddress(pkId: string) {
    return request({
      url: `/v1/appUserAddress/deleteById/${pkId}`,
      method: 'POST',
    });
  },

  update(data: SaveAddressParams, showLoading = true) {
    return request({
      url: '/v1/appUserAddress/update',
      method: 'POST',
      data,
      showLoading,
    });
  },
};
