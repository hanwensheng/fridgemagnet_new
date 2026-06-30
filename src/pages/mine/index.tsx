import { View, Text, Image, Button } from '@tarojs/components';
import BasePage from '@/components/base-page';
import { useTabBar } from '@/hooks/useTabBar';
import AddressIcon from '@/assets/svgs/icon_addres.svg';
import OrderIcon from '@/assets/svgs/icon_order.svg';
import ServiceIcon from '@/assets/svgs/icon_customer_service.svg';
import AvatarIcon from '@/assets/svgs/icon_avatar.svg';
import EditIcon from '@/assets/svgs/icon_edit.svg';
import { useMineLogic } from './index.logic';

const ACTIONS = [
  { key: 'address', label: '地址管理', icon: AddressIcon },
  { key: 'order', label: '我的订单', icon: OrderIcon },
  { key: 'service', label: '联系客服', icon: ServiceIcon },
];

export default function MinePage() {
  useTabBar(1);
  const { isLoggedIn, displayName, userInfo, handleMenuClick, handleLogin, handleLogout } =
    useMineLogic();

  return (
    <BasePage>
      {isLoggedIn ? (
        <View className='flex flex-col items-center pt-[70px]'>
          <Image
            className='h-[74px] w-[74px] rounded-full'
            src={userInfo?.userImg || AvatarIcon}
            mode='aspectFill'
          />
          <Text className='mt-[20px] text-lg leading-[24px] text-black'>{displayName}</Text>
          <View className='mt-[10px] flex h-[34px] w-[98px] items-center justify-center rounded-[29px] border border-black/10'>
            <Image className='h-4 w-4' src={EditIcon} mode='aspectFit' />
            <Text className='ml-[10px] text-xs text-black'>编辑主页</Text>
          </View>
        </View>
      ) : (
        <View className='flex flex-col items-center pt-[90px]'>
          <Text className='text-base font-thin text-black tracking-[5px]'>欢迎体验冰箱贴上爱</Text>
          <Text className='mt-2 text-[10px] font-thin text-black tracking-[1px]'>
            当我们，把回忆做成冰箱贴
          </Text>
          <Button
            className='mt-6 flex h-[42px] w-[88px] items-center justify-center rounded-lg bg-[#1c1c1e] text-xs text-white !border-none !p-0'
            openType='getPhoneNumber'
            onGetPhoneNumber={handleLogin}
          >
            立即登录
          </Button>
        </View>
      )}

      <View className={`mx-[10px] h-px bg-black/10 ${isLoggedIn ? 'mt-10' : 'mt-16'}`} />

      <View className='mt-10 flex flex-row justify-between px-10'>
        {ACTIONS.map((action) => (
          <View
            key={action.key}
            className='flex w-[78px] flex-col items-center'
            onClick={() => handleMenuClick(action.key)}
          >
            <View className='flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#ededed]'>
              <Image className='w-[24px] h-[24px]' src={action.icon} mode='aspectFit' />
            </View>
            <Text className='mt-2 text-[13px] text-[#1a1a1a]'>{action.label}</Text>
          </View>
        ))}
      </View>

      {isLoggedIn && (
        <View
          className='mx-10 mt-10 flex h-11 items-center justify-center rounded-3xl bg-white'
          onClick={handleLogout}
        >
          <Text className='text-sm text-[#ff4d4f]'>退出登录</Text>
        </View>
      )}
    </BasePage>
  );
}
