import { View, Text, Image } from '@tarojs/components';
import BasePage from '@/components/base-page';
import EmptyIcon from '@/assets/svgs/icon_empty.svg';
import type { AddressItem } from '@/api/modules/address';
import { useAddressLogic } from './index.logic';

const ellipsisStyle = {
  display: 'block',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

function AddressCard({
  address,
  isSelectable,
  isSelected,
  onSelect,
  onSetDefault,
  onDelete,
  onCopy,
  onEdit,
}: {
  address: AddressItem;
  isSelectable: boolean;
  isSelected: boolean;
  onSelect: (address: AddressItem) => void;
  onSetDefault: (pkId: string) => void;
  onDelete: (pkId: string) => void;
  onCopy: (address: AddressItem) => void;
  onEdit: (pkId: string) => void;
}) {
  const isDefault = address.isDefault === '1';

  return (
    <View
      className='mb-[10px] rounded-2xl bg-white px-5 py-5'
      onClick={() => isSelectable && onSelect(address)}
    >
      <View className='flex flex-row items-start justify-between'>
        <View className='w-[200px]'>
          <Text className='text-xs text-black/50' style={{ ...ellipsisStyle, width: '250px' }}>
            {address.province} {address.city} {address.district}
          </Text>
        </View>
        {isSelected && (
          <View className='flex h-4 w-4 items-center justify-center'>
            <View className='mb-[2px] h-2.5 w-1.5 rotate-45 border-b-[2px] border-r-[2px] border-[#F2330D]' />
          </View>
        )}
      </View>
      <View
        className='mt-[4px] text-sm text-black leading-[15px]'
        style={{ ...ellipsisStyle, maxWidth: '250px' }}
      >
        {address.detailAddress}
      </View>
      <View className='mt-[10px] flex flex-row items-center overflow-hidden'>
        <Text className='text-xs text-black' style={{ ...ellipsisStyle, maxWidth: '150px' }}>
          {address.recipient}
        </Text>
        <Text
          className='ml-3 text-xs text-black/50'
          style={{ ...ellipsisStyle, maxWidth: '150px' }}
        >
          {address.recipientPhone}
        </Text>
      </View>
      <View className='mt-[10px] flex flex-row items-center justify-between'>
        <View
          className='flex flex-row items-center'
          onClick={(e) => {
            e.stopPropagation();
            onSetDefault(address.pkId);
          }}
        >
          {isDefault ? (
            <View className='flex h-4 w-4 items-center justify-center rounded-full bg-[#1c1c1e]'>
              <View className='mb-[2px] h-2 w-1 rotate-45 border-b-[2px] border-r-[2px] border-white' />
            </View>
          ) : (
            <View className='h-4 w-4 rounded-full border border-[#1c1c1e]/30' />
          )}
          <Text className='ml-[10px] text-xs text-black/50'>默认</Text>
        </View>
        <View className='flex flex-row items-center'>
          <Text
            className='text-xs text-black/50'
            onClick={(e) => {
              e.stopPropagation();
              onDelete(address.pkId);
            }}
          >
            删除
          </Text>
          <View className='mx-3 h-2.5 w-px bg-black/10' />
          <Text
            className='text-xs text-black/50'
            onClick={(e) => {
              e.stopPropagation();
              onCopy(address);
            }}
          >
            复制
          </Text>
          <View className='mx-3 h-2.5 w-px bg-black/10' />
          <Text
            className='text-xs text-black/50'
            onClick={(e) => {
              e.stopPropagation();
              onEdit(address.pkId);
            }}
          >
            修改
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function AddressPage() {
  const {
    addresses,
    isSelectable,
    isSelected,
    handleBack,
    handleAdd,
    handleEdit,
    handleDelete,
    handleCopy,
    handleSetDefault,
    handleSelectAddress,
  } = useAddressLogic();

  const bottomBar = (
    <View className='px-9 pb-6 pt-2'>
      <View
        className='flex h-14 items-center justify-center rounded-full bg-[#1c1c1e]'
        onClick={handleAdd}
      >
        <Text className='text-base font-bold text-white'>添加新地址</Text>
      </View>
    </View>
  );

  return (
    <BasePage
      navTitle='地址管理'
      onNavLeftClick={handleBack}
      bottomBarComponent={bottomBar}
      safeAreaBackgroundColor='#f6f6f6'
    >
      {addresses.length === 0 ? (
        <View className='flex flex-col items-center pt-20'>
          <Image className='h-[137px] w-[137px]' src={EmptyIcon} mode='aspectFit' />
          <Text className='mt-4 text-sm text-black/50'>暂无数据</Text>
        </View>
      ) : (
        <View className='px-3 pt-[20px]'>
          {addresses.map((address) => (
            <AddressCard
              key={address.pkId}
              address={address}
              isSelectable={isSelectable}
              isSelected={isSelected(address.pkId)}
              onSelect={handleSelectAddress}
              onSetDefault={handleSetDefault}
              onDelete={handleDelete}
              onCopy={handleCopy}
              onEdit={handleEdit}
            />
          ))}
        </View>
      )}
    </BasePage>
  );
}
