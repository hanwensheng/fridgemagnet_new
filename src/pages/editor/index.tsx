import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import BasePage from '@/components/base-page';
import Tab7Img from '@/assets/images/tab_7_5.5.png';
import Tab8Img from '@/assets/images/tab_8.5_4.png';
import Tab4Img from '@/assets/images/tab_4.5_3.png';
import Tab7ImgA from '@/assets/images/tab_7_5.5_active.png';
import Tab8ImgA from '@/assets/images/tab_8.5_4_active.png';
import Tab4ImgA from '@/assets/images/tab_4.5_3_active.png';
import IconCheck from '@/assets/svgs/icon_check.svg';
import IconUpload from '@/assets/svgs/icon_upload.svg';
import IconCopy from '@/assets/svgs/icon_copy.svg';
import IconNew from '@/assets/svgs/icon_new.svg';
import IconDel from '@/assets/svgs/icon_del.svg';
import IconMenu from '@/assets/svgs/icon_menu.svg';
import './index.scss';

interface SizeOption {
  id: string;
  label: string;
  image: string;
  activeImage: string;
  displayWidth: number;
  displayHeight: number;
}

const SIZE_OPTIONS: SizeOption[] = [
  {
    id: '7x5.5',
    label: '7*5.5cm',
    image: Tab7Img,
    activeImage: Tab7ImgA,
    displayWidth: 36,
    displayHeight: 34,
  },
  {
    id: '8.5x4',
    label: '8.5*4cm',
    image: Tab8Img,
    activeImage: Tab8ImgA,
    displayWidth: 59,
    displayHeight: 34,
  },
  {
    id: '4.5x3',
    label: '4.5*3cm',
    image: Tab4Img,
    activeImage: Tab4ImgA,
    displayWidth: 23,
    displayHeight: 34,
  },
];

const MENU_ITEMS = [
  { id: 'copy', label: '复制这个', icon: IconCopy },
  { id: 'new', label: '新建一个', icon: IconNew },
  { id: 'delete', label: '删除这个', icon: IconDel },
];

export default function Editor() {
  const [selectedSize, setSelectedSize] = useState<string>('8.5x4');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    const instance = Taro.getCurrentInstance();
    const size = instance.router?.params?.size;
    if (size && SIZE_OPTIONS.some((item) => item.id === size)) {
      setSelectedSize(size);
    }
  }, []);

  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const imageUrl = res.tempFilePaths[0];
        setUploadedImage(imageUrl);
        Taro.navigateTo({
          url: `/pages/editor-crop/index?imageUrl=${encodeURIComponent(imageUrl)}`,
        });
      },
    });
  };

  const handleMenuClick = (id: string) => {
    setMenuVisible(false);
    if (id === 'copy') {
      Taro.showToast({ title: '已复制', icon: 'none' });
    } else if (id === 'new') {
      setUploadedImage('');
      setSelectedSize('8.5x4');
      Taro.showToast({ title: '已新建', icon: 'none' });
    } else if (id === 'delete') {
      setUploadedImage('');
      Taro.showToast({ title: '已删除', icon: 'none' });
    }
  };

  const handleConfirm = () => {
    if (!uploadedImage) {
      Taro.showToast({ title: '请先上传图片', icon: 'none' });
      return;
    }
    Taro.showToast({ title: '保存成功', icon: 'success' });
  };

  const handleSubmit = () => {
    Taro.navigateTo({ url: '/pages/order-confirm/index' });
  };

  return (
    <BasePage
      navTitle='创作之旅'
      bottomBarHeight={56}
      safeAreaBackgroundColor='#F6F6F6'
      bottomBarComponent={
        <View className='editor-bottom-bar'>
          <View className='menu-area' onClick={() => setMenuVisible(!menuVisible)}>
            <Image className='menu-icon' src={IconMenu} />
            {menuVisible && (
              <View className='menu-popup'>
                {MENU_ITEMS.map((item) => (
                  <View
                    key={item.id}
                    className='menu-popup-item'
                    onClick={() => handleMenuClick(item.id)}
                  >
                    <Image className='menu-popup-icon' src={item.icon} />
                    <Text className='menu-popup-text'>{item.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <View className='confirm-btn' onClick={handleConfirm}>
            <Image className='confirm-btn-icon' src={IconCheck} />
          </View>
          <View className='submit-btn' onClick={handleSubmit}>
            <Text className='submit-btn-text'>提交制作</Text>
          </View>
        </View>
      }
    >
      <View className='editor-page'>
        {/* 尺寸选择 */}
        <ScrollView className='size-selector' scrollX showScrollbar={false}>
          <View className='size-selector-inner'>
            {SIZE_OPTIONS.map((item, index) => {
              const active = selectedSize === item.id;
              return (
                <View key={item.id} className='size-item-row'>
                  {index > 0 && <View className='size-divider' />}
                  <View
                    className={`size-item ${active ? 'size-item--active' : ''}`}
                    onClick={() => setSelectedSize(item.id)}
                  >
                    <View
                      className='size-image-wrap'
                      style={{ width: `${item.displayWidth}px`, height: `${item.displayHeight}px` }}
                    >
                      <Image
                        className='size-image'
                        src={active ? item.activeImage : item.image}
                        mode='aspectFit'
                      />
                      {active && (
                        <View className='size-check'>
                          <Image className='size-check-icon' src={IconCheck} />
                        </View>
                      )}
                    </View>
                    <Text className='size-label'>{item.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* 主编辑卡片 */}
        <View className='editor-card'>
          <View className='upload-area' onClick={handleChooseImage}>
            {uploadedImage ? (
              <Image className='upload-preview' src={uploadedImage} mode='aspectFit' />
            ) : (
              <View className='upload-placeholder'>
                <Image className='upload-icon' src={IconUpload} />
              </View>
            )}
          </View>
        </View>

        {/* 提示文字 */}
        <View className='hint-bubble'>
          <Text className='hint-text'>适合做冰箱贴，可做桌面摆件</Text>
        </View>
      </View>
    </BasePage>
  );
}
