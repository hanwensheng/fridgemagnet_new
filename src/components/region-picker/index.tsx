import { View, Text, ScrollView, Image } from '@tarojs/components';
import { Popup } from '@nutui/nutui-react-taro';
import { useState, useMemo, useCallback, useEffect } from 'react';
import type { CascaderOption } from '@nutui/nutui-react-taro';
import { getPinyinInitial } from '@/utils/pinyin';
import BackIcon from '@/assets/svgs/icon_left.svg';
import CloseIcon from '@/assets/svgs/icon_popup_close.svg';
import './index.scss';

interface LetterGroup {
  letter: string;
  items: CascaderOption[];
}

interface RegionPickerProps {
  visible: boolean;
  options: CascaderOption[];
  value: string[];
  title?: string;
  onClose: () => void;
  onChange: (value: string[]) => void;
}

type PickerLevel = 'province' | 'city' | 'district';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');

export default function RegionPicker({
  visible,
  options,
  value: _value,
  title = '选择地区',
  onClose,
  onChange,
}: RegionPickerProps) {
  const [level, setLevel] = useState<PickerLevel>('province');
  const [selectedProvince, setSelectedProvince] = useState<CascaderOption | null>(null);
  const [selectedCity, setSelectedCity] = useState<CascaderOption | null>(null);
  const [scrollIntoView, setScrollIntoView] = useState('');

  // 初始化时根据外部 value 回显状态
  // 注意：这里不做回显，因为每次打开 visible 时会重新拉取数据

  // 按拼音首字母分组
  const letterGroups = useMemo<LetterGroup[]>(() => {
    const groups = new Map<string, CascaderOption[]>();

    for (const province of options) {
      const name = (province.text || province.value || '') as string;
      const firstChar = name.charAt(0);
      const letter = getPinyinInitial(firstChar);
      if (!groups.has(letter)) {
        groups.set(letter, []);
      }
      groups.get(letter)!.push(province);
    }

    // 按字母排序分组
    const result = Array.from(groups.entries())
      .sort(([a], [b]) => {
        // # 号组排最后
        if (a === '#') return 1;
        if (b === '#') return -1;
        return a.localeCompare(b);
      })
      .map(([letter, items]) => {
        // 组内按拼音排序（用 localeCompare 处理中文）
        items.sort((a, b) => {
          const nameA = (a.text || a.value || '') as string;
          const nameB = (b.text || b.value || '') as string;
          return nameA.localeCompare(nameB, 'zh-Hans-CN');
        });
        return { letter, items };
      });

    return result;
  }, [options]);

  // 当前可用的字母（有对应省份的）
  const availableLetters = useMemo(() => {
    return letterGroups.map((g) => g.letter);
  }, [letterGroups]);

  // 重置到初始状态
  const resetState = useCallback(() => {
    setLevel('province');
    setSelectedProvince(null);
    setSelectedCity(null);
    setScrollIntoView('');
  }, []);

  // 点击字母索引
  const handleIndexTap = useCallback(
    (letter: string) => {
      if (!availableLetters.includes(letter)) return;
      setScrollIntoView('');
      // 使用 setTimeout 确保 ScrollView 能响应变化
      setTimeout(() => {
        setScrollIntoView(`group-${letter}`);
      }, 0);
    },
    [availableLetters],
  );

  // 选择省份
  const handleProvinceSelect = useCallback((province: CascaderOption) => {
    setSelectedProvince(province);
    if (province.children && province.children.length > 0) {
      setLevel('city');
    }
  }, []);

  // 选择城市
  const handleCitySelect = useCallback(
    (city: CascaderOption) => {
      setSelectedCity(city);
      if (city.children && city.children.length > 0) {
        setLevel('district');
      } else {
        // 没有区级数据，直接完成选择
        const result = [selectedProvince!.value, city.value] as string[];
        onChange(result);
        resetState();
        onClose();
      }
    },
    [selectedProvince, onChange, onClose, resetState],
  );

  // 选择区县
  const handleDistrictSelect = useCallback(
    (district: CascaderOption) => {
      const result = [selectedProvince!.value, selectedCity!.value, district.value] as string[];
      onChange(result);
      resetState();
      onClose();
    },
    [selectedProvince, selectedCity, onChange, onClose, resetState],
  );

  // 返回上一级
  const handleBack = useCallback(() => {
    if (level === 'district') {
      setLevel('city');
      setSelectedCity(null);
    } else if (level === 'city') {
      setLevel('province');
      setSelectedProvince(null);
    }
  }, [level]);

  // 选择项高亮判断（仅用于城市/区县级列表）
  const isCitySelected = useCallback(
    (city: CascaderOption) => {
      return selectedCity?.value === city.value;
    },
    [selectedCity],
  );

  // 弹层关闭时重置内部状态，确保下次打开时从头开始
  useEffect(() => {
    if (!visible) {
      resetState();
    }
  }, [visible, resetState]);

  const handlePopupClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  // 渲染省份列表（含字母索引）
  const renderProvinceList = () => (
    <View className='region-picker__body region-picker__body--indexed'>
      <ScrollView
        className='region-picker__scroll'
        scrollY
        scrollIntoView={scrollIntoView}
        scrollWithAnimation
      >
        {letterGroups.map((group) => (
          <View key={group.letter} id={`group-${group.letter}`}>
            <View className='region-picker__letter-header'>
              <Text>{group.letter}</Text>
            </View>
            {group.items.map((item) => (
              <View
                key={String(item.value)}
                className='region-picker__item'
                onClick={() => handleProvinceSelect(item)}
              >
                <Text className='region-picker__item-text'>{item.text}</Text>
              </View>
            ))}
          </View>
        ))}
        {/* 底部留白，确保最后一个分组能滚动到顶部 */}
        <View className='h-[100px]' />
      </ScrollView>

      {/* 右侧字母索引栏 */}
      <View className='region-picker__index-bar'>
        {ALPHABET.map((letter) => {
          const isAvailable = availableLetters.includes(letter);
          return (
            <View
              key={letter}
              className={`region-picker__index-letter ${isAvailable ? '' : 'region-picker__index-letter--disabled'}`}
              onClick={() => handleIndexTap(letter)}
            >
              <Text>{letter}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  // 渲染城市/区县列表（无索引）
  const renderSubList = (items: CascaderOption[]) => (
    <ScrollView className='region-picker__scroll' scrollY>
      {items.map((item) => (
        <View
          key={String(item.value)}
          className='region-picker__item'
          onClick={() => {
            if (level === 'city') {
              handleCitySelect(item);
            } else {
              handleDistrictSelect(item);
            }
          }}
        >
          <Text
            className={`region-picker__item-text ${level === 'city' && isCitySelected(item) ? 'text-[#08f]' : ''}`}
          >
            {item.text}
          </Text>
          {item.children && item.children.length > 0 && (
            <Text className='region-picker__item-arrow'>›</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );

  // 标题文本
  const headerTitle =
    level === 'province'
      ? title
      : level === 'city'
        ? selectedProvince?.text || ''
        : selectedCity?.text || '';

  return (
    <Popup
      visible={visible}
      position='bottom'
      round
      closeable={false}
      lockScroll={false}
      onClose={handlePopupClose}
      className='region-picker-popup'
    >
      <View className='region-picker'>
        {/* 顶部导航 */}
        <View className='region-picker__header'>
          {level !== 'province' ? (
            <View className='region-picker__back' onClick={handleBack}>
              <Image className='h-[48px] w-[48px]' src={BackIcon} mode='aspectFit' />
            </View>
          ) : (
            <View className='region-picker__back region-picker__back--placeholder' />
          )}
          <Text className='region-picker__title'>{headerTitle}</Text>
          <View className='region-picker__close' onClick={handlePopupClose}>
            <Image className='h-[14px] w-[14px]' src={CloseIcon} mode='aspectFit' />
          </View>
        </View>

        {/* 内容区 */}
        {level === 'province' && renderProvinceList()}
        {level === 'city' && selectedProvince?.children && renderSubList(selectedProvince.children)}
        {level === 'district' && selectedCity?.children && renderSubList(selectedCity.children)}
      </View>
    </Popup>
  );
}
