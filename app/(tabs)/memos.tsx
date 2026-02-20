
import { getStatsByCategory } from '@/services/db';
import { useFocusEffect, useRouter } from 'expo-router';
import { BookOpen, BrainCircuit, Briefcase, Clock, Gavel } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const initialCategories = [
    {
        id: 'ToDoList',
        title: '待办事项',
        subtitle: 'ToDo & Timeline',
        icon: Gavel,
        color: 'bg-blue-500',
        count: 0
    },
    {
        id: 'Learning',
        title: '学习与技能',
        subtitle: 'Learning & Skills',
        icon: BookOpen,
        color: 'bg-orange-500',
        count: 0
    },
    {
        id: 'Earning',
        title: '工作与财富',
        subtitle: 'Earning & Work',
        icon: Briefcase,
        color: 'bg-emerald-500',
        count: 0
    },
    {
        id: 'Have Fun',
        title: '娱乐与生活',
        subtitle: 'Have Fun',
        icon: BrainCircuit,
        color: 'bg-pink-500',
        count: 0
    },
    {
        id: 'Insights',
        title: '思考与灵感',
        subtitle: 'Insights',
        icon: Clock,
        color: 'bg-purple-500',
        count: 0
    }
];

export default function MemoCategoryScreen() {
    const [categories, setCategories] = useState(initialCategories);
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            const fetchStats = async () => {
                const stats = await getStatsByCategory();
                const updatedCategories = initialCategories.map(cat => ({
                    ...cat,
                    count: stats.find(s => s.category === cat.id)?.count || 0
                }));
                setCategories(updatedCategories);
            };

            fetchStats();
        }, [])
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            <ScrollView className="px-4 py-6">
                <Text className="text-2xl font-bold text-gray-900 mb-6">我的备忘</Text>

                <View className="flex-row flex-wrap justify-between">
                    {categories.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            className="w-[48%] bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100 justify-between min-h-[140px]"
                            activeOpacity={0.7}
                            onPress={() => router.push(`/category/${item.id}`)}
                        >
                            <View className="items-start">
                                <View className={`w-10 h-10 ${item.color} rounded-full items-center justify-center mb-3`}>
                                    <item.icon size={20} color="white" />
                                </View>
                                <Text className="text-lg font-bold text-gray-800">{item.title}</Text>
                                <Text className="text-xs text-gray-400 mt-1">{item.subtitle}</Text>
                            </View>

                            <View className="flex-row justify-end items-center mt-4">
                                <View className="bg-gray-100 px-3 py-1 rounded-full">
                                    <Text className="text-xs font-bold text-gray-600">{item.count} 条</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
