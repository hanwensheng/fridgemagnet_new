import { View, Image } from '@tarojs/components';
import BasePage from '@/components/base-page';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import Icon360 from '@/assets/svgs/icon_360.svg';
import IconImg1 from '@/assets/images/details_img1.png';
import IconImg2 from '@/assets/images/details_img2.png';
import IconImg3 from '@/assets/images/details_img3.png';
import IconImg4 from '@/assets/images/details_img4.png';
import './index.scss';

interface ModelConfig {
  name: string;
  path: string;
  scale: string;
  position: string;
}

const MODELS: ModelConfig[] = [
  {
    name: '8.5*4cm',
    path: '/pages-sub/product-details/assets/models/BXT_Tao.glb',
    scale: '60 60 60',
    position: '0 0 0',
  },
  {
    name: '5.5*7cm',
    path: '/pages-sub/product-details/assets/models/BingxXangTie1.glb',
    scale: '60 60 60',
    position: '0 0 0',
  },
  {
    name: '3*4.5cm',
    path: '/pages-sub/product-details/assets/models/BXT_HeZaoglb.glb',
    scale: '60 60 60',
    position: '0 0 0',
  },
];

export default function ProductDetailsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0, renderWidth: 0, renderHeight: 0 });

  useEffect(() => {
    const info = Taro.getSystemInfoSync();
    const dpr = info.pixelRatio;
    const width = info.windowWidth - 24;
    const height = 230;
    setSize({ width, height, renderWidth: width * dpr, renderHeight: height * dpr });
  }, []);

  const currentModel = MODELS[activeTab];

  return (
    <BasePage navTitle='产品详情'>
      <View className='details_box'>
        <View className='details_3D'>
          {size.renderWidth > 0 && (
            // @ts-ignore xr-model-viewer 是小程序原生组件
            <xr-model-viewer
              modelSrc={currentModel.path}
              scale={currentModel.scale}
              position={currentModel.position}
              width={size.renderWidth}
              height={size.renderHeight}
              style={`width:${size.width}px;height:${size.height}px;display:block;`}
            />
          )}
          <View className='details_3D_360'>
            <Image src={Icon360} className='details_3D_360_img' mode='widthFix' />
            360°View
          </View>
        </View>
        <View className='details_tab'>
          {MODELS.map((model, index) => (
            <View
              key={model.name}
              className={`details_tab_item ${index === activeTab ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
            >
              {model.name}
            </View>
          ))}
        </View>
        {[IconImg1, IconImg2, IconImg3, IconImg4].map((img, i) => (
          <Image key={i} src={img} className='details_img' mode='widthFix' />
        ))}
      </View>
    </BasePage>
  );
}
