import { View, Text, Image, Button, Input, Picker } from '@tarojs/components';
import { Cascader } from '@nutui/nutui-react-taro';
import BasePage from '@/components/base-page';
import AvatarIcon from '@/assets/svgs/icon_avatar.svg';
import CameraIcon from '@/assets/svgs/icon_camera.svg';
import RightIcon from '@/assets/svgs/icon_right.svg';
import { useEditProfileLogic } from './index.logic';

function ArrowIcon() {
  return <Image className='ml-2 h-4 w-4' src={RightIcon} mode='aspectFit' />;
}

function ProfileRow({
  label,
  value,
  placeholder,
  onClick,
  showBorder = true,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onClick?: () => void;
  showBorder?: boolean;
}) {
  return (
    <View
      className={`flex h-[52px] flex-row items-center ${showBorder ? 'border-b border-black/10' : ''}`}
      onClick={onClick}
    >
      <Text className='w-20 text-sm text-black'>{label}</Text>
      <View className='flex flex-1 flex-row items-center justify-between'>
        <Text className={`text-sm ${value ? 'text-black' : 'text-black/30'}`}>
          {value || placeholder}
        </Text>
        <ArrowIcon />
      </View>
    </View>
  );
}

export default function EditProfilePage() {
  const {
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
  } = useEditProfileLogic();

  const bottomBar = (
    <View className='flex items-center justify-center' onClick={handleLogout}>
      <Text className='text-base text-[#f2330d] leading-[50px]'>退出登录</Text>
    </View>
  );

  return (
    <BasePage navTitle='编辑资料' onNavLeftClick={handleBack} bottomBarComponent={bottomBar}>
      <View className='flex flex-col items-center pt-[30px]'>
        <View className='relative flex h-[84px] w-[84px] items-center justify-center'>
          <Button
            className='h-[74px] w-[74px] !m-0 !rounded-full !bg-transparent !p-0 after:!border-none'
            openType='chooseAvatar'
            onChooseAvatar={handleChooseAvatar}
          >
            <Image
              className='h-[74px] w-[74px] rounded-full'
              src={form.avatar || AvatarIcon}
              mode='aspectFill'
            />
          </Button>
          <View className='absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#1c1c1e]'>
            <Image className='h-[11px] w-[11px]' src={CameraIcon} mode='aspectFit' />
          </View>
        </View>
      </View>

      <View className='mx-3 mt-10 rounded-2xl bg-white px-[20px]'>
        <View className='flex h-[52px] flex-row items-center border-b border-black/10'>
          <Text className='w-20 text-sm text-black'>名称</Text>
          <View className='flex flex-1 flex-row items-center justify-between'>
            <Input
              className='flex-1 text-sm text-black'
              type='nickname'
              defaultValue={form.name}
              placeholder='请输入昵称'
              placeholderClass='text-black/30'
              onBlur={(e) => handleNicknameChange(e.detail.value)}
            />
            <ArrowIcon />
          </View>
        </View>
        <ProfileRow label='上爱账号' value={form.account} showBorder={false} />
      </View>

      <View className='mx-3 mt-[20px] rounded-2xl bg-white px-[20px]'>
        <ProfileRow label='性别' value={form.gender} onClick={handleGenderEdit} />
        <Picker
          mode='date'
          value={form.birthday || '2000-01-01'}
          start='1926-01-01'
          end={new Date().toISOString().split('T')[0]}
          onChange={handleBirthdayChange}
        >
          <View className='flex h-[52px] flex-row items-center border-b border-black/10'>
            <Text className='w-20 text-sm text-black'>生日</Text>
            <View className='flex flex-1 flex-row items-center justify-between'>
              <Text className={`text-sm ${form.birthday ? 'text-black' : 'text-black/30'}`}>
                {form.birthday || '选择生日'}
              </Text>
              <ArrowIcon />
            </View>
          </View>
        </Picker>
        <ProfileRow
          label='地区'
          value={form.region}
          placeholder='选择所在地区'
          onClick={handleRegionClick}
        />
        <ProfileRow label='职业' value={form.job} placeholder='选择职业' onClick={handleJobEdit} />
        <ProfileRow
          label='简介'
          value={form.intro}
          placeholder='填写简介'
          onClick={handleIntroEdit}
          showBorder={false}
        />
      </View>

      {/* <View className='mt-8 flex items-center justify-center' onClick={handleLogout}>
        <Text className='text-base text-[#f2330d]'>退出登录</Text>
      </View> */}

      <Cascader
        visible={cascaderVisible}
        value={form.regionValue}
        title='选择地区'
        options={regionOptions}
        closeable
        onClose={handleCascaderClose}
        onChange={handleCascaderChange}
      />
    </BasePage>
  );
}
