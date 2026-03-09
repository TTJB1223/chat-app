import { deleteMemo, getMemo, Memo } from '@/services/db';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Edit2, RotateCcw, Trash2 } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CountdownDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [memo, setMemo] = useState<Memo | null>(null);

    useFocusEffect(
        useCallback(() => {
            if (id) {
                getMemo(Number(id)).then(res => {
                    if (res) setMemo(res);
                });
            }
        }, [id])
    );

    const handleDelete = () => {
        Alert.alert('删除确认', '确定要删除这条倒数备忘录吗？', [
            { text: '取消', style: 'cancel' },
            {
                text: '删除',
                style: 'destructive',
                onPress: async () => {
                    await deleteMemo(Number(id));
                    router.back();
                }
            }
        ]);
    };

    if (!memo) {
        return (
            <SafeAreaView className="flex-1 bg-[#FAFAFA] justify-center items-center">
                <ActivityIndicator size="large" color="#797CC6" />
            </SafeAreaView>
        );
    }

    let target = new Date();
    if (memo.targetDate) {
        const parts = memo.targetDate.split('-');
        if (parts.length === 3) {
            target = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else {
            target = new Date(memo.targetDate.replace(/-/g, '/'));
        }
    }
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - now.getTime();
    let daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isPast = daysLeft < 0;
    daysLeft = Math.abs(daysLeft);

    const formattedDate = target.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    return (
        <SafeAreaView className="flex-1 bg-[#FAFAFA]" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-[#FAFAFA]">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 items-center justify-center">
                    <ArrowLeft size={20} color="#000" />
                </TouchableOpacity>
                <Text className="text-[19px] font-bold text-gray-900 tracking-wider">倒计时备忘录</Text>
                <TouchableOpacity className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 items-center justify-center">
                    <Edit2 size={18} color="#666" />
                </TouchableOpacity>
            </View>

            {/* Main Content Card Container */}
            <View className="flex-1 px-6 pt-10">
                <View className="bg-white rounded-[32px] shadow-sm overflow-hidden" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>

                    {/* Top Purple Section */}
                    <View className="bg-[#797CC6] py-5 items-center">
                        <Text className="text-[17px] text-white tracking-widest">{memo.content}</Text>
                    </View>

                    {/* Middle White Section */}
                    <View className="bg-white items-center pt-10 pb-12">
                        <View className="flex-row items-end justify-center mb-4">
                            <Text className="text-[15px] font-medium text-gray-800 pb-4 pr-1">{isPast ? '超' : '剩'}</Text>
                            <Text className="font-medium text-gray-900 tracking-tighter -ml-1" style={{ fontSize: 110, lineHeight: 110, fontFamily: 'System' }}>
                                {daysLeft}
                            </Text>
                            <Text className="text-[15px] font-medium text-gray-800 pb-4 pl-2">天</Text>
                        </View>
                        <Text className="text-[16px] text-gray-800 -mt-2 tracking-wide font-medium">
                            {isPast ? '自' : '距'} {formattedDate}
                        </Text>
                    </View>

                    {/* Bottom Gray Shade Section */}
                    <View className="bg-[#EDEDED]/60 h-[70px]" />
                </View>
            </View>

            {/* Bottom Actions */}
            <View className="flex-row justify-center w-full absolute bottom-12 space-x-20 z-0">
                <TouchableOpacity className="w-[74px] h-[74px] bg-[#EDEDEE] rounded-full items-center justify-center mr-16" activeOpacity={0.7} onPress={() => { router.back() }}>
                    <RotateCcw size={28} color="#797CC6" />
                </TouchableOpacity>
                <TouchableOpacity className="w-[74px] h-[74px] bg-[#F2EAEA] rounded-full items-center justify-center" activeOpacity={0.7} onPress={handleDelete}>
                    <Trash2 size={28} color="#E06B65" />
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}
