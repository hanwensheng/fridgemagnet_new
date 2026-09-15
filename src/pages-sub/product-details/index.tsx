import { View, Image } from '@tarojs/components';
import BasePage from '@/components/base-page';
import { useState, useEffect, useMemo } from 'react';
import Taro from '@tarojs/taro';
import { productApi } from '@/api';
import { formatSizeLabel } from '@/utils/format';
import Icon360 from '@/assets/svgs/icon_360.svg';
import './index.scss';

interface GoodsItem {
  pkId: string;
  /** 3D 模型链接，后台可能未配置（空字符串 / null） */
  modelLink3d?: string | null;
  /** 详情图列表，后台可能未配置（null） */
  imgLinks?: string[] | null;
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
    const width = info.windowWidth - 25;
    const height = 240;
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

  // 既没有 3D 模型也没有详情图的规格，tab 里也不展示
  const visibleGoods = useMemo(
    () => goodsList.filter((item) => !!item.modelLink3d || (item.imgLinks?.length ?? 0) > 0),
    [goodsList],
  );

  const current = visibleGoods[activeTab];
  // 后台未配置时 imgLinks 会返回 null，直接取 length/map 会抛错
  const imgLinks = current?.imgLinks || [];
  // 后台未配置 3D 模型时 modelLink3d 为空字符串，需跳过渲染，避免 xr-frame 收到空 model 报错
  const modelSrc = current?.modelLink3d || '';

  return (
    <BasePage navTitle='产品详情'>
      <View className='details_box'>
        <View className='details_3D'>
          {size.renderWidth > 0 && !!modelSrc && (
            // @ts-ignore xr-model-viewer 是小程序原生组件
            <xr-model-viewer
              modelSrc={modelSrc}
              scale='55 55 55'
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
        {visibleGoods.length > 0 && (
          <View className='details_tab'>
            {visibleGoods.map((item, index) => (
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
        {imgLinks.map((img, i) => (
          <Image key={i} src={img} className='details_img' mode='widthFix' />
        ))}
      </View>
    </BasePage>
  );
}
