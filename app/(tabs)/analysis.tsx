import { CheckCircle2, Circle, Flag, Plus, Trash2, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Period = '今日' | '本周' | '本月' | '长远';
type Task = { id: string, title: string, category: string, done: boolean };

const PERIODS: Period[] = ['今日', '本周', '本月', '长远'];

export default function AnalysisScreen() {
    const [selectedPeriod, setSelectedPeriod] = useState<Period>('今日');

    // 初始化为空数据，贴合真实生产环境使用
    const [tasks, setTasks] = useState<Record<Period, Task[]>>({
        '今日': [],
        '本周': [],
        '本月': [],
        '长远': []
    });

    // 模态框状态
    const [isModalVisible, setModalVisible] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskCategory, setNewTaskCategory] = useState('个人');

    const categories = ['职业', '健康', '心智', '情感', '财务', '个人'];

    const toggleTask = (taskId: string) => {
        setTasks(prev => ({
            ...prev,
            [selectedPeriod]: prev[selectedPeriod].map(t =>
                t.id === taskId ? { ...t, done: !t.done } : t
            )
        }));
    };

    const deleteTask = (taskId: string) => {
        setTasks(prev => ({
            ...prev,
            [selectedPeriod]: prev[selectedPeriod].filter(t => t.id !== taskId)
        }));
    };

    const addTask = () => {
        if (!newTaskTitle.trim()) return;

        const newTask: Task = {
            id: Date.now().toString(),
            title: newTaskTitle.trim(),
            category: newTaskCategory,
            done: false
        };

        setTasks(prev => ({
            ...prev,
            [selectedPeriod]: [newTask, ...prev[selectedPeriod]] // 新任务添加到最前面
        }));

        setNewTaskTitle('');
        setModalVisible(false);
    };

    const currentTasks = tasks[selectedPeriod];
    const totalDone = currentTasks.filter(t => t.done).length;
    const totalCount = currentTasks.length;
    const progressRate = totalCount === 0 ? 0 : Math.round((totalDone / totalCount) * 100);

    // 更柔和、优雅的“人生漫步阶梯” (Minimalist Staircase)
    const totalSteps = 5;
    const activeStep = totalCount === 0 ? 0 : Math.ceil((progressRate / 100) * totalSteps);

    const renderElegantStairs = () => {
        return (
            <View className="flex-row items-end justify-center h-40 mt-4 relative w-full px-4">
                {/* 终点大本营与旗帜 */}
                <View className="absolute right-6 -top-2 items-center z-10">
                    <Flag size={28} color={activeStep === 5 ? "#07C160" : "#D1D5DB"} />
                    <View className={`w-8 h-1.5 mt-1 rounded-full ${activeStep === 5 ? 'bg-[#07C160]/40 blur-md' : 'bg-transparent'}`} />
                </View>

                {/* 5步登高阶梯 */}
                {[1, 2, 3, 4, 5].map((step) => {
                    const isReached = step <= activeStep;
                    // 制造一些深浅透明度差异，让它更有立体美感
                    const opacityMap = [100, 80, 70, 60, 50, 40];
                    const activeOpacity = opacityMap[5 - step];

                    const heightValue = 24 + step * 18; // 阶梯逐步变高

                    return (
                        <View key={step} className="items-center justify-end mx-0.5">
                            {/* 阶梯上的踩点提示 */}
                            {step === activeStep && totalCount > 0 && (
                                <View className="mb-1 w-2.5 h-2.5 rounded-full bg-[#07C160] shadow-sm shadow-[#07C160]" />
                            )}
                            <View
                                style={{ height: heightValue }}
                                className={`w-12 rounded-t-xl ${isReached
                                    ? `bg-[#07C160]`
                                    : 'bg-[#F3F4F6]'
                                    }`}
                                // NativeWind 不支持动态字符串拼类名解析透明度，所以我们用 style
                                {...(isReached && { style: { height: heightValue, opacity: activeOpacity / 100 } })}
                            />
                        </View>
                    );
                })}
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F7F8FA]" edges={['top']}>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

                {/* 顶部简明标题区 */}
                <View className="px-6 pt-6 pb-2">
                    <Text className="text-[#181818] text-2xl font-bold tracking-wider">登高拾贝</Text>
                    <Text className="text-gray-500 text-[13px] mt-1">
                        每一步拾级而上，都在接近更好的自己。
                    </Text>
                </View>

                {/* 核心视觉区：阶梯 */}
                <View className="mx-4 mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 items-center">

                    {renderElegantStairs()}

                    <View className="w-full h-[1px] bg-gray-100 my-4" />

                    {/* 进度数据说明 */}
                    <View className="flex-row items-center justify-between w-full px-2">
                        <View>
                            <Text className="text-gray-500 text-xs font-medium">{selectedPeriod}攀登率</Text>
                            <View className="flex-row items-baseline mt-1.5">
                                <Text className="text-2xl font-bold text-[#181818]">{progressRate}</Text>
                                <Text className="text-sm font-medium text-gray-400 ml-0.5">%</Text>
                            </View>
                        </View>
                        <View className="items-end">
                            <Text className="text-gray-500 text-xs font-medium">已构筑基石</Text>
                            <View className="flex-row items-baseline mt-1.5">
                                <Text className="text-xl font-bold text-[#07C160]">{totalDone}</Text>
                                <Text className="text-sm font-medium text-gray-400"> / {totalCount}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 时期切换面板 */}
                <View className="mt-6 px-4">
                    <View className="flex-row items-center justify-between bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                        {PERIODS.map((p) => {
                            const isActive = selectedPeriod === p;
                            return (
                                <Pressable
                                    key={p}
                                    onPress={() => setSelectedPeriod(p)}
                                    style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8, backgroundColor: isActive ? '#07C160' : 'transparent' }}
                                >
                                    <Text style={{ fontWeight: 'bold', fontSize: 13.5, color: isActive ? '#ffffff' : '#6B7280' }}>
                                        {p}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* 待办事项列表区 */}
                <View className="mt-6 px-4 pb-20">
                    <View className="flex-row items-center justify-between mb-4 px-1">
                        <Text className="text-[#181818] text-lg font-bold">{selectedPeriod}规划</Text>
                        <TouchableOpacity onPress={() => setModalVisible(true)} className="flex-row items-center bg-[#07C160]/10 px-3 py-1.5 rounded-full">
                            <Plus size={14} color="#07C160" />
                            <Text className="text-[#07C160] text-[13px] font-bold ml-1">添加</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="space-y-3">
                        {currentTasks.length === 0 ? (
                            <View className="items-center justify-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                                <Text className="text-gray-400 text-[14px] font-medium mb-3">当前时期还是一张白纸</Text>
                                <TouchableOpacity onPress={() => setModalVisible(true)} className="bg-[#07C160] px-5 py-2 rounded-full">
                                    <Text className="text-white font-bold text-sm">种下一颗种子</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            currentTasks.map((task) => (
                                <View
                                    key={task.id}
                                    className={`flex-row items-center p-4 rounded-xl border ${task.done
                                        ? 'bg-gray-50 border-gray-100 opacity-80'
                                        : 'bg-white border-gray-100 shadow-sm'
                                        }`}
                                >
                                    {/* 完成勾选区 */}
                                    <TouchableOpacity onPress={() => toggleTask(task.id)} className="mr-3 p-1">
                                        {task.done ? (
                                            <CheckCircle2 size={24} color="#07C160" />
                                        ) : (
                                            <Circle size={24} color="#D1D5DB" />
                                        )}
                                    </TouchableOpacity>

                                    {/* 任务详情区 */}
                                    <View className="flex-1">
                                        <Text
                                            className={`font-medium ${task.done ? 'text-gray-400 line-through' : 'text-[#181818]'
                                                } text-[15.5px]`}
                                        >
                                            {task.title}
                                        </Text>
                                        <View className="flex-row mt-1.5">
                                            <Text className={`text-[10px] px-2 py-0.5 rounded border ${task.done
                                                ? 'text-gray-400 border-gray-200 bg-gray-100'
                                                : 'text-[#07C160] border-[#07C160]/20 bg-[#07C160]/10'
                                                }`}>
                                                {task.category}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* 删除按钮 */}
                                    <TouchableOpacity onPress={() => deleteTask(task.id)} className="pl-3 py-2">
                                        <Trash2 size={18} color="#D1D5DB" />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* 新增任务的底部弹窗 */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 justify-end bg-black/40"
                >
                    <View className="bg-white rounded-t-3xl p-6 pb-12 shadow-2xl">
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-xl font-bold text-[#181818]">想为{selectedPeriod}定下什么目标？</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} className="p-1 bg-gray-100 rounded-full">
                                <X size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-base text-[#181818] mb-6"
                            placeholder="如：读完《黑客与画家》第一章..."
                            placeholderTextColor="#9CA3AF"
                            value={newTaskTitle}
                            onChangeText={setNewTaskTitle}
                            autoFocus
                        />

                        <Text className="text-sm font-bold text-gray-500 mb-3">分类标签</Text>
                        <View className="flex-row flex-wrap gap-2 mb-8">
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setNewTaskCategory(cat)}
                                    className={`px-4 py-2 rounded-full border ${newTaskCategory === cat
                                        ? 'bg-[#07C160]/10 border-[#07C160] text-[#07C160]'
                                        : 'bg-white border-gray-200 text-gray-600'
                                        }`}
                                >
                                    <Text className={`text-sm font-medium ${newTaskCategory === cat ? 'text-[#07C160]' : 'text-gray-500'}`}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={addTask}
                            className={`w-full py-4 rounded-xl items-center ${newTaskTitle.trim() ? 'bg-[#07C160]' : 'bg-gray-200'
                                }`}
                            disabled={!newTaskTitle.trim()}
                        >
                            <Text className={`text-lg font-bold ${newTaskTitle.trim() ? 'white' : 'text-gray-400'}`}>
                                确认添加
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}
