import { View, Image } from '@tarojs/components';
import { findSizeOption, getPreviewBg, getPreviewClass } from '@/pages-sub/editor/index.logic';
import './index.scss';

interface ProductThumbProps {
  /** 商品图（订单里是用户上传的设计图） */
  image?: string;
  /** 规格名（如 8.5*4cm），匹配不到已知规格时不套花边 */
  spec?: string;
}

/**
 * 商品缩略图：80x80 色块，「花边 + 商品图」整体等比缩放居中。
 * 花边按规格匹配，规格未知（老订单没存宽高）时退化为普通图片。
 */
export default function ProductThumb({ image = '', spec = '' }: ProductThumbProps) {
  if (!findSizeOption(spec)) {
    return <Image className='product-thumb product-thumb--plain' src={image} mode='aspectFill' />;
  }

  return (
    <View className='product-thumb'>
      <View className={`product-thumb-preview product-thumb-preview--${getPreviewClass(spec)}`}>
        <Image className='product-thumb-bg' src={getPreviewBg(spec)} mode='aspectFit' />
        <View className='product-thumb-inner'>
          <Image className='product-thumb-img' src={image} mode='aspectFit' />
        </View>
      </View>
    </View>
  );
}
