import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useMemo } from 'react';
import BasePage from '@/components/base-page';
import SpecSelectPopup from '@/components/spec-select-popup';
import IconCheck from '@/assets/svgs/icon_check.svg';
import IconUpload from '@/assets/svgs/icon_upload.svg';
import IconMenu from '@/assets/svgs/icon_menu.svg';
import IconSave from '@/assets/svgs/icon_save.svg';
import IconExit from '@/assets/svgs/icon_exit.svg';
import IconClose2 from '@/assets/svgs/icon_close2.svg';
import {
  useEditorLogic,
  findSizeOption,
  getPreviewBg,
  getPreviewClass,
  MENU_ITEMS,
} from './index.logic';
import './index.scss';

export default function Editor() {
  const {
    activeIndex,
    setActiveIndex,
    uploadMap,
    menuVisible,
    specList,
    activeItem,
    isSingle,
    allUploaded,
    currentHasImage,
    exitPopupVisible,
    handleChooseImage,
    handleMenuClick,
    handleSpecAdd,
    handleSpecPopupClose,
    handleConfirm,
    handleSubmit,
    toggleMenu,
    closeMenu,
    specPopupVisible,
    specPopupKey,
    handleNavLeftClick,
    closeExitPopup,
    handleSaveDraftAndExit,
    handleDirectExit,
  } = useEditorLogic();

  const navBarHeight = useMemo(() => {
    const systemInfo = Taro.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    let menuButtonInfo: { top: number; height: number };
    try {
      menuButtonInfo = Taro.getMenuButtonBoundingClientRect();
    } catch {
      menuButtonInfo = { top: statusBarHeight + 4, height: 32 };
    }
    const gap = menuButtonInfo.top - statusBarHeight;
    return statusBarHeight + menuButtonInfo.height + gap * 2;
  }, []);

  const exitPopupTop = navBarHeight + 20;

  return (
    <BasePage
      navTitle='创作之旅'
      bottomBarHeight={56}
      safeAreaBackgroundColor='#F6F6F6'
      onNavLeftClick={handleNavLeftClick}
      bottomBarComponent={
        <View className='editor-bottom-bar'>
          <View className='menu-area' onClick={toggleMenu}>
            <Image className='menu-icon' src={IconMenu} />
            {menuVisible && (
              <View className='menu-popup' onClick={(e) => e.stopPropagation()}>
                {MENU_ITEMS.map((item) => (
                  <View
                    key={item.id}
                    className='menu-popup-item'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuClick(item.id);
                    }}
                  >
                    <Image className='menu-popup-icon' src={item.icon} />
                    <Text className='menu-popup-text'>{item.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          {allUploaded ? (
            <View className='submit-btn' onClick={handleSubmit}>
              <Text className='submit-btn-text'>提交制作</Text>
            </View>
          ) : (
            <View
              className='confirm-btn'
              style={currentHasImage ? { background: '#1C1C1E' } : undefined}
              onClick={currentHasImage ? handleConfirm : undefined}
            >
              <Image className='confirm-btn-icon' src={IconCheck} />
            </View>
          )}
        </View>
      }
    >
      <View className='editor-page' onClick={closeMenu}>
        {/* 尺寸选择 */}
        <View className={`size-selector ${isSingle ? 'size-selector--center' : ''}`}>
          {isSingle ? (
            <View className='size-selector-inner'>
              {specList.map((specItem, specIdx) => {
                const option = findSizeOption(specItem.name);
                const active = activeIndex === specIdx;
                const hasImage = !!uploadMap[specItem.index];
                const showCheck = hasImage;
                return (
                  <View key={specIdx} className='size-item-row'>
                    <View
                      className={`size-item ${active ? 'size-item--active' : ''}`}
                      onClick={() => setActiveIndex(specIdx)}
                    >
                      {option && (
                        <View
                          className='size-image-wrap'
                          style={{
                            width: `${option.displayWidth}px`,
                            height: `${option.displayHeight}px`,
                          }}
                        >
                          <Image
                            className='size-image'
                            src={active ? option.activeImage : option.image}
                            mode='aspectFit'
                          />
                          {showCheck && (
                            <View
                              className='size-check'
                              style={!active ? { background: '#adadad' } : undefined}
                            >
                              <Image className='size-check-icon' src={IconCheck} />
                            </View>
                          )}
                        </View>
                      )}
                      <Text className='size-label'>{specItem.name}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <ScrollView className='size-selector-scroll' scrollX showScrollbar={false}>
              <View className='size-selector-inner'>
                {specList.map((specItem, specIdx) => {
                  const option = findSizeOption(specItem.name);
                  const active = activeIndex === specIdx;
                  const hasImage = !!uploadMap[specItem.index];
                  const showCheck = hasImage;
                  return (
                    <View key={specIdx} className='size-item-row'>
                      {specIdx > 0 && <View className='size-divider' />}
                      <View
                        className={`size-item ${active ? 'size-item--active' : ''}`}
                        onClick={() => setActiveIndex(specIdx)}
                      >
                        {option && (
                          <View
                            className='size-image-wrap'
                            style={{
                              width: `${option.displayWidth}px`,
                              height: `${option.displayHeight}px`,
                            }}
                          >
                            <Image
                              className='size-image'
                              src={active ? option.activeImage : option.image}
                              mode='aspectFit'
                            />
                            {showCheck && (
                              <View
                                className='size-check'
                                style={!active ? { background: '#adadad' } : undefined}
                              >
                                <Image className='size-check-icon' src={IconCheck} />
                              </View>
                            )}
                          </View>
                        )}
                        <Text className='size-label'>{specItem.name}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>

        {/* 当前 tab 的编辑卡片 */}
        {activeItem &&
          (() => {
            const sizeCls = getPreviewClass(activeItem.name);
            return (
              <View className='editor-card'>
                <View
                  className={`upload-area upload-area--${sizeCls} ${uploadMap[activeItem.index] ? 'upload-area--preview' : ''}`}
                  onClick={() => handleChooseImage(activeItem.index)}
                >
                  {uploadMap[activeItem.index] ? (
                    <View className={`upload-preview-wrap preview-wrap--${sizeCls}`}>
                      <Image
                        className={`upload-preview-bg preview-bg--${sizeCls}`}
                        src={getPreviewBg(activeItem.name)}
                        mode='aspectFit'
                      />
                      <Image
                        className={`upload-preview preview-img--${sizeCls}`}
                        src={uploadMap[activeItem.index]}
                        mode='aspectFit'
                      />
                    </View>
                  ) : (
                    <View className='upload-placeholder'>
                      <Image className='upload-icon' src={IconUpload} />
                    </View>
                  )}
                </View>
              </View>
            );
          })()}

        {/* 提示文字 — 跟随当前 tab */}
        {activeItem && (
          <View className='hint-bubble'>
            <Text className='hint-text'>{activeItem.intro}</Text>
          </View>
        )}
      </View>

      <SpecSelectPopup
        key={specPopupKey}
        visible={specPopupVisible}
        onClose={handleSpecPopupClose}
        onConfirm={handleSpecAdd}
      />

      {exitPopupVisible && (
        <>
          <View className='exit-popup-mask' onClick={closeExitPopup} />
          <View
            className='exit-popup-container'
            style={{ top: `${exitPopupTop}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <View
              className='exit-popup-item exit-popup-item--save'
              onClick={handleSaveDraftAndExit}
            >
              <Image className='exit-popup-icon' src={IconSave} />
              <Text className='exit-popup-text'>保存草稿并退出</Text>
            </View>
            <View className='exit-popup-item exit-popup-item--dark' onClick={handleDirectExit}>
              <Image className='exit-popup-icon' src={IconExit} />
              <Text className='exit-popup-text'>直接退出</Text>
            </View>
            <View className='exit-popup-item exit-popup-item--dark' onClick={closeExitPopup}>
              <Image className='exit-popup-icon' src={IconClose2} />
              <Text className='exit-popup-text'>取消</Text>
            </View>
          </View>
        </>
      )}
    </BasePage>
  );
}
