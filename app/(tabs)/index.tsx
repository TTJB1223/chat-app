
import { ChatSession, deleteSession, getSessions } from '@/services/db';
import { useFocusEffect, useRouter } from 'expo-router';
import { MessageSquarePlus, Search, Trash2, Menu } from 'lucide-react-native';
import SettingsSidebar from '@/components/SettingsSidebar';
import React, { useCallback, useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SwipeListView } from 'react-native-swipe-list-view';

export default function ChatListScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [])
  );

  const loadSessions = async () => {
    const data = await getSessions();
    setSessions(data);
  };

  const handleNewChat = () => {
    // Navigate to a new chat with a generated unique ID (e.g. timestamp)
    // Note: The session won't be saved until the first message is sent
    router.push(`/chat/${Date.now()}`);
  };

  const handleDeleteSession = async (rowMap: any, id: string) => {
    if (rowMap[id]) {
      rowMap[id].closeRow();
    }
    // Optimistic UI update
    setSessions(prev => prev.filter(s => s.id !== id));
    await deleteSession(id);
  };

  const filteredSessions = sessions.filter(session => {
    if (!searchText) return true;
    const lowerSearch = searchText.toLowerCase();
    const titleMatch = session.title.toLowerCase().includes(lowerSearch);
    const lastMessage = session.messages[session.messages.length - 1];
    const contentMatch = lastMessage?.content.toLowerCase().includes(lowerSearch);
    return titleMatch || contentMatch;
  });

  const renderItem = ({ item }: { item: ChatSession }) => {
    const lastMessage = item.messages[item.messages.length - 1];
    const preview = lastMessage ? lastMessage.content : '无消息';
    // Format helper
    const formatTime = (isoString: string) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      const now = new Date();
      const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      return isToday
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
    };

    const time = lastMessage ? formatTime(lastMessage.timestamp) : '';

    return (
      <TouchableOpacity
        className="flex-row items-center px-4 py-3 bg-white active:bg-gray-100 border-b border-gray-100" // Added border-b
        onPress={() => router.push(`/chat/${item.id}`)}
        activeOpacity={1} // Let SwipeListView handle touch
        style={{ height: 72 }} // Fixed height for consistent swipe
      >
        <View className="w-12 h-12 rounded-lg bg-primary-light items-center justify-center mr-3 overflow-hidden">
          {/* Random Avatar based on ID */}
          <Image
            source={{ uri: `https://api.dicebear.com/9.x/notionists/png?seed=${item.id}` }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
        <View className="flex-1 justify-center">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-[16px] font-medium text-gray-900" numberOfLines={1}>{item.title}</Text>
            <Text className="text-xs text-gray-400">{time}</Text>
          </View>
          <Text className="text-sm text-gray-500" numberOfLines={1}>
            {preview}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHiddenItem = (data: { item: ChatSession }, rowMap: any) => (
    <View className="flex-row justify-end h-full bg-[#EDEDED]">
      <TouchableOpacity
        className="w-[80px] bg-red-500 justify-center items-center h-full"
        onPress={() => handleDeleteSession(rowMap, data.item.id)}
      >
        <Trash2 size={24} color="white" />
        <Text className="text-white text-xs font-medium mt-1">删除</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#EDEDED]" edges={['top']}>
      <SettingsSidebar visible={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      {/* Header */}
      <View className="px-4 py-3 bg-[#EDEDED] flex-row items-center justify-between z-10">
        <TouchableOpacity onPress={() => setIsSidebarOpen(true)} className="p-1 justify-center">
          <Menu size={24} color="#181818" />
        </TouchableOpacity>
        <Text className="text-[18px] font-bold text-[#181818]">知录</Text>
        <TouchableOpacity onPress={handleNewChat} className="p-1 items-center justify-center">
          <MessageSquarePlus size={24} color="#181818" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-3 pb-2 bg-[#EDEDED]">
        <View className="bg-white rounded-lg h-9 flex-row items-center px-3 shadow-sm">
          <Search size={18} color="#B2B2B2" />
          <TextInput
            className="flex-1 ml-2 text-[15px] text-[#181818] h-full"
            placeholder="搜索"
            placeholderTextColor="#B2B2B2"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')} className="p-1">
              <View className="bg-[#B2B2B2] rounded-full w-4 h-4 items-center justify-center">
                <Text className="text-white text-[10px] font-bold">×</Text>
              </View>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <SwipeListView
        data={filteredSessions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-80}
        disableRightSwipe
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-gray-400">
              {searchText ? '未找到相关对话' : '暂无对话，点击右上角开始聊天'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
