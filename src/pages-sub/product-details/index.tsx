import { View, Image } from '@tarojs/components';
import BasePage from '@/components/base-page';
import { useState, useEffect, useMemo } from 'react';
import Taro from '@tarojs/taro';
import { productApi } from '@/api';
import type { BizGoodsShowImg, BizGoodsShowModel } from '@/api';
import Icon360 from '@/assets/svgs/icon_360.svg';
import './index.scss';

/** 按 sort 升序（sort 是字符串数字，缺失时保持原顺序） */
function sortBySort<T extends { sort?: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => Number(a.sort ?? 0) - Number(b.sort ?? 0));
}

export default function ProductDetailsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [modelList, setModelList] = useState<BizGoodsShowModel[]>([]);
  const [imgList, setImgList] = useState<BizGoodsShowImg[]>([]);
  const [size, setSize] = useState({ width: 0, height: 0, renderWidth: 0, renderHeight: 0 });

  useEffect(() => {
    const info = Taro.getSystemInfoSync();
    const dpr = info.pixelRatio;
    const width = info.windowWidth - 25;
    const height = 240;
    setSize({ width, height, renderWidth: width * dpr, renderHeight: height * dpr });

    // 获取产品详情（图片详情 + 3D 模型）
    productApi
      .getGoodsShow()
      .then((res) => {
        if (res) {
          setModelList(sortBySort(res.modelList || []));
          setImgList(sortBySort(res.imgList || []));
        }
      })
      .catch((err) => {
        console.error('获取产品详情失败:', err);
      });
  }, []);

  // 未配置模型链接的规格，tab 里也不展示
  const visibleModels = useMemo(() => modelList.filter((item) => !!item.imgLink), [modelList]);

  const current = visibleModels[activeTab];
  // 后台未配置 3D 模型时跳过渲染，避免 xr-frame 收到空 model 报错
  const modelSrc = current?.imgLink || '';
  // 图片详情固定展示全部，不跟随模型 tab 联动
  const detailImages = useMemo(
    () => imgList.map((item) => item.imgLink).filter((url) => !!url),
    [imgList],
  );

  return (
    <BasePage navTitle='产品详情'>
      <View className='details_box'>
        <View className='details_3D'>
          {size.renderWidth > 0 && !!modelSrc && (
            // 注意：这里**不能**加 key={modelSrc}，否则切 tab 会卸载重建整个原生组件，
            // 中间会闪一下白色空白；不加 key 时是同一实例原地换 modelSrc，切换更丝滑
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
        {visibleModels.length > 0 && (
          <View className='details_tab'>
            {visibleModels.map((item, index) => (
              <View
                key={item.pkId}
                className={`details_tab_item ${index === activeTab ? 'active' : ''}`}
                onClick={() => setActiveTab(index)}
              >
                {item.modelName}
              </View>
            ))}
          </View>
        )}
        <View className='details_img_list'>
          {detailImages.map((img, i) => (
            <Image key={i} src={img} className='details_img' mode='widthFix' />
          ))}
        </View>
      </View>
    </BasePage>
  );
}
