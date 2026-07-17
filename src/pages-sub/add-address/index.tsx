import { View, Text, Input, Image } from '@tarojs/components';
import { Cascader } from '@nutui/nutui-react-taro';
import BasePage from '@/components/base-page';
import WxIcon from '@/assets/svgs/icon_wx.svg';
import LocationIcon from '@/assets/svgs/icon_location.svg';
import CloseIcon from '@/assets/svgs/icon_close.svg';
import { useAddAddressLogic } from './index.logic';

function FormRow({
  label,
  required,
  children,
  onClick,
  showBorder = true,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  showBorder?: boolean;
}) {
  return (
    <View
      className={`flex h-[52px] flex-row items-center ${showBorder ? 'border-b border-black/10' : ''}`}
      onClick={onClick}
    >
      <View className='flex w-20 flex-row items-center'>
        <Text className='text-sm text-black'>{label}</Text>
        {required && <Text className='ml-1 text-sm text-[#ff4d4f]'>*</Text>}
      </View>
      <View className='ml-5 flex flex-1 flex-row items-center'>{children}</View>
    </View>
  );
}

export default function AddAddressPage() {
  const {
    form,
    isEdit,
    cascaderVisible,
    regionOptions,
    isValid,
    handleBack,
    handleNameChange,
    handlePhoneChange,
    handleRegionClick,
    handleCascaderClose,
    handleCascaderChange,
    handleDetailChange,
    handleDefaultToggle,
    handlePaste,
    handleUseWechatAddress,
    handleSubmit,
  } = useAddAddressLogic();

  const bottomBar = (
    <View className='px-9 pb-6 pt-2'>
      <View
        className={`flex h-14 items-center justify-center rounded-full ${isValid ? 'bg-[#1c1c1e]' : 'bg-black/30'}`}
        onClick={handleSubmit}
      >
        <Text className='text-base font-bold text-white'>保存地址</Text>
      </View>
    </View>
  );

  return (
    <BasePage
      navTitle={isEdit ? '修改地址' : '创建新地址'}
      onNavLeftClick={handleBack}
      bottomBarComponent={bottomBar}
    >
      <View className='mx-3 mt-5 flex flex-row items-center justify-between rounded-2xl bg-white px-5 py-5'>
        <Text className='text-sm text-black/30'>复制地址，帮你快速填写</Text>
        <View className='flex flex-row items-center gap-3'>
          <View
            className='flex items-center justify-center rounded-full border border-black/10 px-3 py-1'
            onClick={handlePaste}
          >
            <Text className='text-xs text-black'>粘贴并识别</Text>
          </View>
          <Image
            className='h-[27px] w-[27px]'
            src={WxIcon}
            mode='aspectFit'
            onClick={handleUseWechatAddress}
          />
        </View>
      </View>

      <View className='mx-3 mt-5 rounded-2xl bg-white px-5'>
        <FormRow label='收货人' required>
          <Input
            className='flex-1 text-sm text-black'
            placeholder='请输入收货人姓名'
            placeholderClass='text-black/30'
            value={form.name}
            onInput={(e) => handleNameChange(e.detail.value)}
          />
          {form.name && (
            <Image
              className='ml-2 h-5 w-5'
              src={CloseIcon}
              mode='aspectFit'
              onClick={() => handleNameChange('')}
            />
          )}
        </FormRow>

        <FormRow label='联系电话' required>
          <Input
            className='flex-1 text-sm text-black'
            placeholder='+86 手机号'
            placeholderClass='text-black/30'
            type='number'
            maxlength={11}
            value={form.phone}
            onInput={(e) => handlePhoneChange(e.detail.value)}
          />
          {form.phone && (
            <Image
              className='ml-2 h-5 w-5'
              src={CloseIcon}
              mode='aspectFit'
              onClick={() => handlePhoneChange('')}
            />
          )}
        </FormRow>

        <FormRow label='所在地区' required onClick={handleRegionClick}>
          <Text
            className={`flex-1 text-sm ${form.region ? 'text-black' : 'text-black/30'}`}
            numberOfLines={1}
          >
            {form.region || '省、市、区、街道'}
          </Text>
          <Image className='ml-2 h-5 w-5' src={LocationIcon} mode='aspectFit' />
        </FormRow>

        <FormRow label='详细地址' required>
          <Input
            className='flex-1 text-sm text-black'
            placeholder='社区、门牌号等'
            placeholderClass='text-black/30'
            value={form.detail}
            onInput={(e) => handleDetailChange(e.detail.value)}
          />
          {form.detail && (
            <Image
              className='ml-2 h-5 w-5'
              src={CloseIcon}
              mode='aspectFit'
              onClick={() => handleDetailChange('')}
            />
          )}
        </FormRow>

        <View className='flex h-[52px] flex-row items-center justify-between'>
          <Text className='text-sm text-black'>设为默认地址</Text>
          <View
            className={`relative h-6 w-10 rounded-full ${form.isDefault ? 'bg-[#2c2c2c]' : 'bg-[#e5e5e5]'}`}
            onClick={handleDefaultToggle}
          >
            <View
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${form.isDefault ? 'left-5' : 'left-1'}`}
            />
          </View>
        </View>
      </View>

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
