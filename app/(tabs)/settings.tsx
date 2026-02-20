
import { useSettings } from '@/services/SettingsContext';
import * as ImagePicker from 'expo-image-picker';
import { ChevronRight, Image as ImageIcon, Settings } from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MeScreen() {
    const { setChatBackground } = useSettings();

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [9, 16],
            quality: 1,
        });

        if (!result.canceled) {
            setChatBackground(result.assets[0].uri);
            alert('聊天背景已更新！✨');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={['top']}>
            <ScrollView>
                {/* Header Profile */}
                <View className="bg-white p-6 mb-4 flex-row items-center border-b border-gray-200">
                    <View className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden mr-4">
                        <Image
                            source={{ uri: 'https://api.dicebear.com/9.x/avataaars/png?seed=Jett' }}
                            className="w-full h-full"
                        />
                    </View>
                    <View>
                        <Text className="text-xl font-bold text-gray-900 mb-1">Jett Ma</Text>
                        <Text className="text-gray-500 text-sm">微信号: jett_dev</Text>
                    </View>
                    <View className="flex-1 items-end justify-center">
                        <ChevronRight size={20} color="#C7C7CC" />
                    </View>
                </View>

                {/* Settings Group 1 */}
                <View className="bg-white border-y border-gray-200 mb-4">
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-4 active:bg-gray-50"
                        onPress={pickImage}
                    >
                        <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                            <ImageIcon size={18} color="#2563EB" />
                        </View>
                        <Text className="flex-1 text-[17px] text-gray-900">聊天背景</Text>
                        <ChevronRight size={20} color="#C7C7CC" />
                    </TouchableOpacity>
                </View>

                {/* Settings Group 2 */}
                <View className="bg-white border-y border-gray-200 mb-4">
                    <TouchableOpacity className="flex-row items-center px-4 py-4 border-b border-gray-100 active:bg-gray-50">
                        <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center mr-3">
                            <Settings size={18} color="#10B981" />
                        </View>
                        <Text className="flex-1 text-[17px] text-gray-900">通用设置</Text>
                        <ChevronRight size={20} color="#C7C7CC" />
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
