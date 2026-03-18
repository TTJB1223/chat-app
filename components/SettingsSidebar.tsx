import { useSettings } from '@/services/SettingsContext';
import * as ImagePicker from 'expo-image-picker';
import { ChevronRight, Image as ImageIcon, Clock, CalendarDays, BellOff, Bell, HelpCircle, ChevronsUpDown, Smartphone, Calendar, AlarmClock, Palette, Wand2, Sparkles, Brain, Mic, Copy } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

interface SettingsSidebarProps {
    visible: boolean;
    onClose: () => void;
}

export default function SettingsSidebar({ visible, onClose }: SettingsSidebarProps) {
    const { setChatBackground, reminderPrefs, updateReminderPrefs } = useSettings();
    const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [modalVisible, setModalVisible] = useState(visible);

    useEffect(() => {
        if (visible) {
            setModalVisible(true);
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -DRAWER_WIDTH,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start(() => {
                setModalVisible(false);
            });
        }
    }, [visible]);

    const pickImage = async () => {
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
        <Modal
            transparent
            visible={modalVisible}
            onRequestClose={onClose}
            animationType="none"
        >
            <View className="flex-1 flex-row">
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View
                        style={{
                            ...Dimensions.get('window'), // Take full absolute space
                            position: 'absolute',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            opacity: fadeAnim,
                        }}
                    />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={{
                        width: DRAWER_WIDTH,
                        height: '100%',
                        backgroundColor: '#F2F2F7',
                        transform: [{ translateX: slideAnim }],
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 0 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                        elevation: 10,
                    }}
                >
                    <SafeAreaView className="flex-1 bg-[#F2F2F7]" edges={['top', 'bottom']}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Profile Header */}
                            <View className="px-4 py-8 items-center">
                                <View className="w-16 h-16 rounded-full bg-primary-light overflow-hidden mb-3 border-[1.5px] border-white shadow-sm">
                                    <Image
                                        source={{ uri: 'https://api.dicebear.com/9.x/avataaars/png?seed=Jett' }}
                                        className="w-full h-full"
                                    />
                                </View>
                                <Text className="text-[18px] font-bold text-gray-900 mb-1">Jett Ma</Text>
                                <View className="bg-primary-light px-2.5 py-0.5 rounded-full">
                                    <Text className="text-primary text-[10px] font-bold">微信号: jett_dev</Text>
                                </View>
                            </View>

                            <View className="px-3 py-2">
                                <Text className="px-2 text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">通用</Text>
                                {/* General Settings Group */}
                                <View className="bg-white rounded-[16px] px-3.5 py-1">
                                    
                                    {/* Theme */}
                                    <View className="flex-row items-center py-2.5 border-b border-gray-50">
                                        <View className="w-7 h-7 rounded-[6px] bg-purple-50 items-center justify-center mr-3">
                                            <Palette size={15} color="#A855F7" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-[14px] font-bold text-gray-800">主题</Text>
                                            <Text className="text-[10px] font-medium text-gray-400 mt-0.5">多种主题色选择</Text>
                                        </View>
                                        <TouchableOpacity className="flex-row items-center active:bg-gray-50 px-1.5 py-1 rounded-md">
                                            <Text className="text-[13px] font-medium text-gray-600 mr-1">跟随系统</Text>
                                            <ChevronsUpDown size={14} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Chat Background */}
                                    <View className="flex-row items-center py-2.5 border-b border-gray-50">
                                        <View className="w-7 h-7 rounded-[6px] bg-blue-50 items-center justify-center mr-3">
                                            <ImageIcon size={15} color="#3B82F6" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-[14px] font-bold text-gray-800">聊天背景</Text>
                                            <Text className="text-[10px] font-medium text-gray-400 mt-0.5">从相册选择自定义图片</Text>
                                        </View>
                                        <TouchableOpacity 
                                            className="px-1.5 py-1"
                                            onPress={pickImage}
                                        >
                                            <ChevronRight size={15} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Completion Effect */}
                                    <View className="flex-row items-center py-2.5 border-b border-gray-50">
                                        <View className="w-7 h-7 rounded-[6px] bg-pink-50 items-center justify-center mr-3">
                                            <Sparkles size={15} color="#EC4899" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-[14px] font-bold text-gray-800">完成特效</Text>
                                            <Text className="text-[10px] font-medium text-gray-400 mt-0.5">完成任务时的庆祝效果</Text>
                                        </View>
                                        <TouchableOpacity className="flex-row items-center active:bg-gray-50 px-1.5 py-1 rounded-md">
                                            <Text className="text-[13px] font-medium text-gray-600 mr-1">五彩纸屑</Text>
                                            <ChevronsUpDown size={14} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Analysis Language */}
                                    <View className="flex-row items-center py-2.5 border-b border-gray-50">
                                        <View className="w-7 h-7 rounded-[6px] bg-fuchsia-50 items-center justify-center mr-3">
                                            <Brain size={15} color="#D946EF" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-[14px] font-bold text-gray-800">分析语言</Text>
                                            <Text className="text-[10px] font-medium text-gray-400 mt-0.5">选择 AI 输出语言</Text>
                                        </View>
                                        <TouchableOpacity className="flex-row items-center active:bg-gray-50 px-1.5 py-1 rounded-md">
                                            <Text className="text-[13px] font-medium text-gray-600 mr-1">简体中文</Text>
                                            <ChevronsUpDown size={14} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Speech Recognition */}
                                    <View className="flex-row items-center py-2.5 border-b border-gray-50">
                                        <View className="w-7 h-7 rounded-[6px] bg-indigo-50 items-center justify-center mr-3">
                                            <Mic size={15} color="#6366F1" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-[14px] font-bold text-gray-800">语音识别</Text>
                                            <Text className="text-[10px] font-medium text-gray-400 mt-0.5">选择语言可识别更精准</Text>
                                        </View>
                                        <TouchableOpacity className="flex-row items-center active:bg-gray-50 px-1.5 py-1 rounded-md">
                                            <Text className="text-[13px] font-medium text-gray-600 mr-1">跟随系统</Text>
                                            <ChevronsUpDown size={14} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Device UUID */}
                                    <View className="flex-row items-center py-2.5">
                                        <View className="w-7 h-7 rounded-[6px] bg-emerald-50 items-center justify-center mr-3">
                                            <Smartphone size={15} color="#10B981" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-[14px] font-bold text-gray-800">设备 UUID</Text>
                                            <Text className="text-[10px] font-medium text-gray-400 mt-0.5 tracking-widest">********************</Text>
                                        </View>
                                        <TouchableOpacity className="px-2 py-1">
                                            <Copy size={15} color="#6B7280" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                       {/* Reminder Group */}
                                <Text className="px-2 mt-4 text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">提醒</Text>
                                <View className="bg-white rounded-[16px] px-3.5 py-2 pb-3.5">
                                    
                                    {/* Item 1: 提前提醒 */}
                                    <View className="flex-row items-center py-2.5 border-b border-gray-50">
                                        <View className="w-7 h-7 rounded-[6px] bg-red-50 items-center justify-center mr-3">
                                            <Clock size={15} color="#EF4444" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-[14px] font-bold text-gray-800">提前提醒</Text>
                                            <Text className="text-[10px] font-medium text-gray-400 mt-0.5">自定义提前提醒时间</Text>
                                        </View>
                                        <TouchableOpacity 
                                            className="flex-row items-center active:bg-gray-50 px-1.5 py-1 rounded-md"
                                            onPress={() => {
                                                const options = [0, 5, 10, 15, 30, 60];
                                                const next = options[(options.indexOf(reminderPrefs.advanceTime) + 1) % options.length];
                                                updateReminderPrefs({ advanceTime: next });
                                            }}
                                        >
                                            <Text className="text-[13px] font-medium text-gray-600 mr-1">
                                                {reminderPrefs.advanceTime === 0 ? '准时' : `${reminderPrefs.advanceTime} 分钟`}
                                            </Text>
                                            <ChevronsUpDown size={14} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Item 2: 全天事项 */}
                                    <View className="flex-row items-center py-2.5 border-b border-gray-50">
                                        <View className="w-7 h-7 rounded-[6px] bg-blue-50 items-center justify-center mr-3">
                                            <CalendarDays size={15} color="#3B82F6" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-[14px] font-bold text-gray-800">全天事项</Text>
                                            <Text className="text-[10px] font-medium text-gray-400 mt-0.5" numberOfLines={1}>只有日期的事...</Text>
                                        </View>
                                        <TouchableOpacity className="bg-gray-50 rounded-md px-2 py-1.5 flex-row items-center">
                                            <Text className="text-[13px] font-medium text-gray-700">{reminderPrefs.allDayTime}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Item 3: 简洁通知 */}
                                    <View className="flex-row items-center py-2.5 border-b border-gray-50">
                                        <View className="w-7 h-7 rounded-[6px] bg-purple-50 items-center justify-center mr-3">
                                            <BellOff size={15} color="#A855F7" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-[14px] font-bold text-gray-800">简洁通知</Text>
                                            <Text className="text-[10px] font-medium text-gray-400 mt-0.5">通知仅显示标题</Text>
                                        </View>
                                        <View className="flex-row items-center">
                                            <TouchableOpacity className="mr-2">
                                                <HelpCircle size={15} color="#E5E7EB" />
                                            </TouchableOpacity>
                                            <Switch 
                                                value={reminderPrefs.simpleNotification} 
                                                onValueChange={(val) => updateReminderPrefs({ simpleNotification: val })} 
                                                trackColor={{ false: '#E5E7EB', true: '#3966A2' }} 
                                                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }} 
                                            />
                                        </View>
                                    </View>

                                    {/* Item 4: 自动提醒 */}
                                    <View className="flex-row items-center py-2.5">
                                        <View className="w-7 h-7 rounded-[6px] bg-green-50 items-center justify-center mr-3">
                                            <Bell size={15} color="#10B981" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-[14px] font-bold text-gray-800">自动提醒</Text>
                                            <Text className="text-[10px] font-medium text-gray-400 mt-0.5">多途径自动同步</Text>
                                        </View>
                                        <View className="flex-row items-center">
                                            <TouchableOpacity 
                                                className="px-2 py-1"
                                                onPress={() => {
                                                    Alert.alert(
                                                        "📌 自动同步说明",
                                                        "如果开启，AI 分析后，如果有事项，会自动同步到 APP 通知、日历 APP、提醒事项 APP、闹钟里。\n\n你也可以单独点击事项手动配置事项提醒时间，单独配置大于全局配置。\n\n如果关闭，每个事项需要单独配置。",
                                                        [{ text: "好", style: "default" }]
                                                    );
                                                }}
                                            >
                                                <HelpCircle size={15} color="#D1D5DB" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Bottom Grid Actions */}
                                    <View className="flex-row justify-between mt-3">
                                        <TouchableOpacity 
                                            className={`items-center justify-center border rounded-[12px] w-[23%] py-2.5 ${reminderPrefs.autoSyncApp ? 'bg-blue-50/50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}
                                            onPress={() => updateReminderPrefs({ autoSyncApp: !reminderPrefs.autoSyncApp })}
                                        >
                                            <Smartphone size={15} color={reminderPrefs.autoSyncApp ? "#3966A2" : "#374151"} />
                                            <Text className={`text-[10px] font-bold mt-1.5 ${reminderPrefs.autoSyncApp ? 'text-primary' : 'text-gray-600'}`}>APP 通知</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            className={`items-center justify-center border rounded-[12px] w-[23%] py-2.5 ${reminderPrefs.autoSyncCalendar ? 'bg-blue-50/50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}
                                            onPress={() => updateReminderPrefs({ autoSyncCalendar: !reminderPrefs.autoSyncCalendar })}
                                        >
                                            <Calendar size={15} color={reminderPrefs.autoSyncCalendar ? "#3966A2" : "#374151"} />
                                            <Text className={`text-[10px] font-bold mt-1.5 ${reminderPrefs.autoSyncCalendar ? 'text-primary' : 'text-gray-600'}`}>日历</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            className={`items-center justify-center border rounded-[12px] w-[23%] py-2.5 ${reminderPrefs.autoSyncReminder ? 'bg-blue-50/50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}
                                            onPress={() => updateReminderPrefs({ autoSyncReminder: !reminderPrefs.autoSyncReminder })}
                                        >
                                            <Bell size={15} color={reminderPrefs.autoSyncReminder ? "#3966A2" : "#374151"} />
                                            <Text className={`text-[10px] font-bold mt-1.5 ${reminderPrefs.autoSyncReminder ? 'text-primary' : 'text-gray-600'}`}>提醒事项</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            className={`items-center justify-center border rounded-[12px] w-[23%] py-2.5 ${reminderPrefs.autoSyncAlarm ? 'bg-blue-50/50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}
                                            onPress={() => updateReminderPrefs({ autoSyncAlarm: !reminderPrefs.autoSyncAlarm })}
                                        >
                                            <AlarmClock size={15} color={reminderPrefs.autoSyncAlarm ? "#3966A2" : "#374151"} />
                                            <Text className={`text-[10px] font-bold mt-1.5 ${reminderPrefs.autoSyncAlarm ? 'text-primary' : 'text-gray-600'}`}>闹钟</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                        
                        <View className="px-6 pb-6 pt-4">
                            <Text className="text-center text-xs text-gray-300">知录 v1.0.0</Text>
                        </View>
                    </SafeAreaView>
                </Animated.View>
            </View>
        </Modal>
    );
}
