import { View, Text, Image, ScrollView } from '@tarojs/components';
import BasePage from '@/components/base-page';
import SpecSelectPopup from '@/components/spec-select-popup';
import IconCheck from '@/assets/svgs/icon_check.svg';
import IconUpload from '@/assets/svgs/icon_upload.svg';
import IconMenu from '@/assets/svgs/icon_menu.svg';
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
    completedMap,
    menuVisible,
    specList,
    activeItem,
    isSingle,
    allUploaded,
    currentHasImage,
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
  } = useEditorLogic();

  return (
    <BasePage
      navTitle='创作之旅'
      bottomBarHeight={56}
      safeAreaBackgroundColor='#F6F6F6'
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
          <View
            className='confirm-btn'
            style={currentHasImage ? { background: '#1C1C1E' } : undefined}
            onClick={currentHasImage ? handleConfirm : undefined}
          >
            <Image className='confirm-btn-icon' src={IconCheck} />
          </View>
          {allUploaded && (
            <View className='submit-btn' onClick={handleSubmit}>
              <Text className='submit-btn-text'>提交制作</Text>
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
                const completed = !!completedMap[specItem.index];
                const showCheck = (active && hasImage) || completed;
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
                              style={completed ? { background: '#adadad' } : undefined}
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
                  const completed = !!completedMap[specItem.index];
                  const showCheck = (active && hasImage) || completed;
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
                                style={completed ? { background: '#adadad' } : undefined}
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
        {activeItem && (
          <View className='editor-card'>
            <View
              className={`upload-area ${uploadMap[activeItem.index] ? 'upload-area--preview' : ''}`}
              onClick={() => handleChooseImage(activeItem.index)}
            >
              {uploadMap[activeItem.index] ? (
                (() => {
                  const cls = getPreviewClass(activeItem.name);
                  return (
                    <View className={`upload-preview-wrap preview-wrap--${cls}`}>
                      <Image
                        className={`upload-preview-bg preview-bg--${cls}`}
                        src={getPreviewBg(activeItem.name)}
                        mode='aspectFit'
                      />
                      <Image
                        className={`upload-preview preview-img--${cls}`}
                        src={uploadMap[activeItem.index]}
                        mode='aspectFit'
                      />
                    </View>
                  );
                })()
              ) : (
                <View className='upload-placeholder'>
                  <Image className='upload-icon' src={IconUpload} />
                </View>
              )}
            </View>
          </View>
        )}

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
    </BasePage>
  );
}
