import { View } from '@tarojs/components';
import BasePage from '@/components/base-page';
import { useTabBar } from '@/hooks/useTabBar';

export default function MinePage() {
  useTabBar(1);

  return (
    <BasePage navTitle='我的'>
      <View>我的页面</View>
    </BasePage>
  );
}
