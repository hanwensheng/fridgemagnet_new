import { useCallback, useMemo, useState } from 'react';
import Taro from '@tarojs/taro';
import type { CascaderValue } from '@nutui/nutui-react-taro';
import { useAppStore } from '@/store';
import { buildRegionTree } from '@/api/modules/region-tree';

export interface ProfileForm {
  avatar: string;
  name: string;
  account: string;
  gender: string;
  birthday: string;
  region: string;
  regionValue: CascaderValue;
  job: string;
  intro: string;
}

const INITIAL_FORM: ProfileForm = {
  avatar: '',
  name: '王三',
  account: '2728602_9931108',
  gender: '女',
  birthday: '',
  region: '',
  regionValue: [],
  job: '',
  intro: '复古冰箱墙',
};

const GENDER_OPTIONS = ['男', '女'];
const JOB_OPTIONS = ['设计师', '程序员', '产品经理', '运营', '学生', '自由职业'];

export function useEditProfileLogic() {
  const logout = useAppStore((s) => s.logout);
  const [form, setForm] = useState<ProfileForm>(INITIAL_FORM);
  const [cascaderVisible, setCascaderVisible] = useState(false);

  const regionOptions = useMemo(() => buildRegionTree(), []);

  const updateField = useCallback(<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleBack = useCallback(() => {
    Taro.navigateBack();
  }, []);

  const handleChooseAvatar = useCallback(
    (e: { detail: { avatarUrl: string } }) => {
      if (e.detail.avatarUrl) {
        updateField('avatar', e.detail.avatarUrl);
      }
    },
    [updateField],
  );

  const handleNicknameChange = useCallback(
    (value: string) => {
      updateField('name', value);
    },
    [updateField],
  );

  const handleGenderEdit = useCallback(() => {
    Taro.showActionSheet({ itemList: GENDER_OPTIONS }).then((res) => {
      updateField('gender', GENDER_OPTIONS[res.tapIndex]);
    });
  }, [updateField]);

  const handleBirthdayChange = useCallback(
    (e: { detail: { value: string } }) => {
      if (e.detail.value) {
        updateField('birthday', e.detail.value);
      }
    },
    [updateField],
  );

  const handleRegionClick = useCallback(() => {
    setCascaderVisible(true);
  }, []);

  const handleCascaderClose = useCallback(() => {
    setCascaderVisible(false);
  }, []);

  const handleCascaderChange = useCallback(
    (value: CascaderValue) => {
      const regionText = (value as string[]).join(' ');
      setForm((prev) => ({ ...prev, region: regionText, regionValue: value }));
      setCascaderVisible(false);
    },
    [setCascaderVisible],
  );

  const handleJobEdit = useCallback(() => {
    Taro.showActionSheet({ itemList: JOB_OPTIONS }).then((res) => {
      updateField('job', JOB_OPTIONS[res.tapIndex]);
    });
  }, [updateField]);

  const handleIntroEdit = useCallback(() => {
    Taro.showModal({
      title: '修改简介',
      content: form.intro,
      editable: true,
      placeholderText: '请输入简介',
    }).then((res) => {
      if (res.confirm && res.content !== undefined) {
        updateField('intro', res.content.trim() || form.intro);
      }
    });
  }, [form.intro, updateField]);

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

  return {
    form,
    cascaderVisible,
    regionOptions,
    handleBack,
    handleChooseAvatar,
    handleNicknameChange,
    handleGenderEdit,
    handleBirthdayChange,
    handleRegionClick,
    handleCascaderClose,
    handleCascaderChange,
    handleJobEdit,
    handleIntroEdit,
    handleLogout,
  };
}
