
import { getMemosByCategory, Memo } from '@/services/db';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CategoryDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [memos, setMemos] = useState<Memo[]>([]);

    useEffect(() => {
        if (id) {
            getMemosByCategory(id as string).then(setMemos);
        }
    }, [id]);

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-lg font-bold">{id}</Text>
                <View className="w-8" />
            </View>

            <ScrollView className="flex-1 bg-gray-50 px-4 py-4">
                {memos.length === 0 ? (
                    <View className="items-center justify-center py-20">
                        <Text className="text-gray-400 text-base">还没有记录哦，快去和小语聊天吧！🐱</Text>
                    </View>
                ) : (
                    memos.map((memo) => (
                        <View key={memo.id} className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100">
                            <Text className="text-base text-gray-800 mb-2 leading-6">{memo.content}</Text>
                            <View className="flex-row items-center justify-between mt-2">
                                <View className="flex-row items-center">
                                    <Calendar size={14} color="#9CA3AF" />
                                    <Text className="text-xs text-gray-400 ml-1">
                                        {new Date(memo.timestamp).toLocaleDateString()} {new Date(memo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                                {/* More actions valid in future */}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

        </SafeAreaView>
    );
}
