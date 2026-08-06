import { View, Image } from '@tarojs/components';
import BasePage from '@/components/base-page';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { productApi } from '@/api';
import { formatSizeLabel } from '@/utils/format';
import Icon360 from '@/assets/svgs/icon_360.svg';
import './index.scss';

interface GoodsItem {
  pkId: string;
  modelLink3d: string;
  imgLinks: string[];
  width: string;
  height: string;
}

export default function ProductDetailsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [goodsList, setGoodsList] = useState<GoodsItem[]>([]);
  const [size, setSize] = useState({ width: 0, height: 0, renderWidth: 0, renderHeight: 0 });

  useEffect(() => {
    const info = Taro.getSystemInfoSync();
    const dpr = info.pixelRatio;
    const width = info.windowWidth - 24;
    const height = 230;
    setSize({ width, height, renderWidth: width * dpr, renderHeight: height * dpr });

    // 获取商品列表
    productApi
      .getGoodsList()
      .then((res) => {
        if (res) {
          setGoodsList(res);
        }
      })
      .catch((err) => {
        console.error('获取商品列表失败:', err);
      });
  }, []);

  const current = goodsList[activeTab];

  return (
    <BasePage navTitle='产品详情'>
      <View className='details_box'>
        <View className='details_3D'>
          {size.renderWidth > 0 && current && (
            // @ts-ignore xr-model-viewer 是小程序原生组件
            <xr-model-viewer
              modelSrc={current.modelLink3d}
              scale='60 60 60'
              position='0 0 0'
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
        {goodsList.length > 0 && (
          <View className='details_tab'>
            {goodsList.map((item, index) => (
              <View
                key={item.pkId}
                className={`details_tab_item ${index === activeTab ? 'active' : ''}`}
                onClick={() => setActiveTab(index)}
              >
                {formatSizeLabel(item.width, item.height)}
              </View>
            ))}
          </View>
        )}
        {current &&
          current.imgLinks.length > 0 &&
          current.imgLinks.map((img, i) => (
            <Image key={i} src={img} className='details_img' mode='widthFix' />
          ))}
      </View>
    </BasePage>
  );
}
