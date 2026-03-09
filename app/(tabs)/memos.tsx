
import { getMemos, Memo } from '@/services/db';
import { useFocusEffect, useRouter } from 'expo-router';
import { Cat, ChevronLeft, ChevronRight, Circle } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MemoCalendarScreen() {
    const router = useRouter();
    const [memos, setMemos] = useState<Memo[]>([]);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    useFocusEffect(
        useCallback(() => {
            getMemos().then(setMemos);
        }, [])
    );

    // Month navigation
    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Calendar generation
    const { daysInMonth, startWeekDay } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        return {
            daysInMonth: lastDay.getDate(),
            startWeekDay: firstDay.getDay(),
        };
    }, [currentDate]);

    const calendarDays = useMemo(() => {
        const days: (number | null)[] = [];
        for (let i = 0; i < startWeekDay; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    }, [daysInMonth, startWeekDay]);

    // Group memos by date string YYYY-MM-DD
    const memosByDate = useMemo(() => {
        const map = new Map<string, Memo[]>();
        memos.forEach(memo => {
            let target = new Date();
            if (memo.targetDate) {
                const parts = memo.targetDate.split('-');
                if (parts.length === 3) {
                    target = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                } else {
                    target = new Date(memo.targetDate.replace(/-/g, '/'));
                }
            } else {
                target = new Date(memo.timestamp);
            }
            // format target to local YYYY-MM-DD
            const yearStr = target.getFullYear();
            const monthStr = String(target.getMonth() + 1).padStart(2, '0');
            const dayStr = String(target.getDate()).padStart(2, '0');
            const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

            if (!map.has(dateStr)) {
                map.set(dateStr, []);
            }
            map.get(dateStr)!.push(memo);
        });
        return map;
    }, [memos]);

    // Selected day format
    const selectedDateStr = useMemo(() => {
        const yearStr = selectedDate.getFullYear();
        const monthStr = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(selectedDate.getDate()).padStart(2, '0');
        return `${yearStr}-${monthStr}-${dayStr}`;
    }, [selectedDate]);

    const selectedDayMemos = memosByDate.get(selectedDateStr) || [];

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

    const isSameDay = (d1: Date, year: number, month: number, day: number) => {
        return d1.getFullYear() === year && d1.getMonth() === month && d1.getDate() === day;
    };

    return (
        <SafeAreaView className="flex-1 bg-[#FAF8F5]" edges={['top']}>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="flex-row items-center justify-between px-6 py-4 mt-2">
                    <TouchableOpacity onPress={prevMonth} className="w-9 h-9 rounded-full bg-[#EFEBE4] items-center justify-center">
                        <ChevronLeft color="#D6CAB5" size={24} />
                    </TouchableOpacity>
                    <Text className="text-[26px] font-extrabold text-[#413E39]">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </Text>
                    <TouchableOpacity onPress={nextMonth} className="w-9 h-9 rounded-full bg-[#EFEBE4] items-center justify-center">
                        <ChevronRight color="#D6CAB5" size={24} />
                    </TouchableOpacity>
                </View>

                {/* Legend Header */}
                <View className="mx-4 my-2 px-5 py-3 bg-[#F4EFE9] rounded-2xl flex-row items-center justify-between">
                    <Cat size={20} color="#D29961" />
                    <View className="flex-row items-center space-x-6">
                        <View className="flex-row items-center mr-6">
                            <View className="w-3 h-3 rounded-full bg-[#D29961] mr-2" />
                            <Text className="text-[#8A8075] text-[14px]">全部完成</Text>
                        </View>
                        <View className="flex-row items-center">
                            <View className="w-3 h-3 rounded-full border-2 border-[#D29961] mr-2" />
                            <Text className="text-[#8A8075] text-[14px]">有未完成</Text>
                        </View>
                    </View>
                </View>

                {/* Weekdays */}
                <View className="flex-row px-4 mt-6">
                    {weekDays.map((day, idx) => (
                        <View key={idx} className="flex-1 items-center">
                            <Text className="text-[#8A8075] text-[15px]">{day}</Text>
                        </View>
                    ))}
                </View>

                {/* Calendar Grid */}
                <View className="flex-row flex-wrap px-4 mt-4">
                    {calendarDays.map((day, idx) => {
                        if (day === null) {
                            return <View key={`empty-${idx}`} className="w-[14.28%] py-3" />;
                        }

                        // construct date
                        const targetYear = currentDate.getFullYear();
                        const targetMonth = currentDate.getMonth();

                        // Check if it's the selected day
                        const isSelected = isSameDay(selectedDate, targetYear, targetMonth, day);

                        // Extract YYYY-MM-DD to check memos
                        const yStr = targetYear;
                        const mStr = String(targetMonth + 1).padStart(2, '0');
                        const dStr = String(day).padStart(2, '0');
                        const dayKey = `${yStr}-${mStr}-${dStr}`;
                        const hasMemos = memosByDate.has(dayKey) && memosByDate.get(dayKey)!.length > 0;

                        return (
                            <TouchableOpacity
                                key={`day-${day}`}
                                onPress={() => setSelectedDate(new Date(targetYear, targetMonth, day))}
                                className="w-[14.28%] aspect-square flex items-center justify-center relative p-1 mb-2"
                                activeOpacity={0.7}
                            >
                                <View className={`w-11 h-11 rounded-2xl items-center justify-center ${isSelected ? 'bg-[#F6ECD9] border-[1.5px] border-[#D8AF81]' : ''}`}>
                                    <Text className={`text-[17px] ${isSelected ? 'font-bold text-[#413E39]' : hasMemos ? 'text-[#413E39] font-bold' : 'text-[#8A8075] font-medium'}`}>
                                        {day}
                                    </Text>
                                    {/* Unfinished task indicator styling (a tiny empty circle) */}
                                    {hasMemos && !isSelected && (
                                        <View className="absolute bottom-1 w-[5px] h-[5px] rounded-full border border-[#D29961]" />
                                    )}
                                    {hasMemos && isSelected && (
                                        <View className="absolute bottom-1 w-[5px] h-[5px] rounded-full bg-[#D29961]" />
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Content Divider line */}
                <View className="h-[1px] bg-[#E8E2D9] w-full mt-6" />

                {/* Today's Tasks Section */}
                <View className="px-5 pt-6 pb-20">
                    <View className="flex-row items-center mb-5">
                        <Cat size={26} color="#D29961" strokeWidth={2.5} />
                        <Text className="text-[20px] font-bold text-[#413E39] ml-2 tracking-wide">
                            {isSameDay(selectedDate, new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) ? '今天的任务' : `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日的任务`}
                        </Text>
                    </View>

                    {selectedDayMemos.length === 0 ? (
                        <View className="bg-[#F4EFE9] rounded-3xl py-14 items-center justify-center mt-2">
                            <Text className="text-[#8A8075] text-[17px] mb-2 font-medium">这一天没有任务哦～</Text>
                            <Text className="text-[#A59D93] text-[15px]">像猫咪一样悠闲地度过吧 🐾🐾</Text>
                        </View>
                    ) : (
                        selectedDayMemos.map((memo) => (
                            <TouchableOpacity
                                key={memo.id}
                                className="bg-[#F4EFE9] rounded-2xl p-4 mx-1 mb-3 flex-row items-center"
                                activeOpacity={0.8}
                                onPress={() => router.push(`/countdown/${memo.id}` as any)}
                            >
                                <View className="w-10 h-10 rounded-full bg-[#F5E5D4] items-center justify-center mr-3">
                                    <Circle size={22} color="#D29961" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[#413E39] text-[16px] font-bold mb-1">{memo.content}</Text>
                                    <Text className="text-[#8A8075] text-[13px]">{memo.category}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
