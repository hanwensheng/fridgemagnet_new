import { View, Text, Image } from '@tarojs/components';
import { Swipe } from '@nutui/nutui-react-taro';
import BasePage from '@/components/base-page';
import { useDraftLogic } from './index.logic';
import './index.scss';

export default function DraftPage() {
  const { drafts, handleEdit, handleDelete } = useDraftLogic();

  return (
    <BasePage navTitle='草稿箱'>
      {drafts.length === 0 ? (
        <View className='draft-empty'>
          <Text className='draft-empty-text'>暂无草稿</Text>
        </View>
      ) : (
        <View className='draft-list'>
          {drafts.map((draft) => (
            <Swipe
              key={draft.id}
              rightAction={
                <View className='draft-del' onClick={() => handleDelete(draft.id)}>
                  <Text className='draft-del-text'>删除</Text>
                </View>
              }
            >
              <View className='draft-card' onClick={() => handleEdit(draft)}>
                <View className='draft-thumbnail'>
                  <Image className='draft-thumbnail-img' src={draft.thumbnail} mode='aspectFill' />
                </View>
                <View className='draft-info'>
                  <Text className='draft-title'>{draft.title}</Text>
                  <Text className='draft-sizes'>{draft.sizes}</Text>
                  <Text className='draft-time'>最后编辑时间：{draft.savedAt}</Text>
                </View>
              </View>
            </Swipe>
          ))}
        </View>
      )}
    </BasePage>
  );
}
