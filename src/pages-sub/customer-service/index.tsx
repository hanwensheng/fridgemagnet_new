import { View, Image } from '@tarojs/components';
import BasePage from '@/components/base-page';
import KfCodeImage from '@/assets/images/kf_code.png';

export default function CustomerServicePage() {
  return (
    <BasePage navTitle='联系客服'>
      <View className='flex justify-center pt-[152px]'>
        <View className='relative flex h-[289px] w-[289px] items-center justify-center rounded-[32px] bg-white'>
          <Image className='h-[188px] w-[188px]' src={KfCodeImage} mode='aspectFit' />
        </View>
      </View>
    </BasePage>
  );
}
