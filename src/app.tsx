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
      {process.env.TARO_ENV === 'h5' && <CustomTabBar />}
    </>
  );
}

export default App;
