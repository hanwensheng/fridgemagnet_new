import { PropsWithChildren } from 'react';
import { useLaunch } from '@tarojs/taro';
import CustomTabBar from '@/components/custom-tab-bar';

import './app.scss';
import './app.css';

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.');
  });

  return (
    <>
      {children}
      {/* H5 端手动渲染 TabBar；小程序端由 Taro 框架根据 tabBar.custom:true 自动从 src/custom-tab-bar/ 注入，此处不渲染以免重复 */}
      {process.env.TARO_ENV === 'h5' && <CustomTabBar />}
    </>
  );
}

export default App;
