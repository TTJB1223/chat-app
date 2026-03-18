import { deleteMemo, getMemos, Memo } from '@/services/db';
import { useFocusEffect, useRouter } from 'expo-router';
import { BookOpen, ChevronLeft, ChevronRight, Clock, PenLine, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 类别配色
const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    '倒计时': { bg: '#DBEAFE', text: '#1D4ED8', dot: '#F59E0B' },
    '工作': { bg: '#DBEAFE', text: '#1D4ED8', dot: '#3B82F6' },
    '学习': { bg: '#D1FAE5', text: '#065F46', dot: '#3966A2' },
    '生活': { bg: '#FCE7F3', text: '#9D174D', dot: '#EC4899' },
    '想法': { bg: '#EDE9FE', text: '#5B21B6', dot: '#8B5CF6' },
    '其他': { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' },
};
const getCatStyle = (cat: string) => CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['其他'];

function getGreeting() {
    const h = new Date().getHours();
    if (h < 6) return '夜深了，睡前记下今天 🌙';
    if (h < 11) return '早上好，开始美好的一天 ☀️';
    if (h < 14) return '中午好，记录这一刻 ☕';
    if (h < 18) return '下午好，保持专注 ✨';
    if (h < 21) return '傍晚好，今天怎么样？🌅';
    return '晚上了，记下今天的故事 🌙';
}

function toLocalDateStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(ts: string) {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDateLabel(dateStr: string) {
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    if (dateStr === toLocalDateStr(today)) return '今天';
    if (dateStr === toLocalDateStr(yesterday)) return '昨天';
    const [, m, d] = dateStr.split('-');
    return `${m}月${d}日`;
}

const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function MemosScreen() {
    const router = useRouter();
    const [memos, setMemos] = useState<Memo[]>([]);

    const today = new Date();
    const [calDate, setCalDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState<string | null>(null); // null = 显示全部

    const refresh = useCallback(() => { getMemos().then(setMemos); }, []);
    useFocusEffect(refresh);

    const handleDelete = (memo: Memo) => {
        Alert.alert('删除备忘', `确定要删除「${memo.content.slice(0, 20)}」吗？`, [
            { text: '取消', style: 'cancel' },
            { text: '删除', style: 'destructive', onPress: async () => { await deleteMemo(memo.id); refresh(); } },
        ]);
    };

    // 按日期分组 map
    const memosByDate = useMemo(() => {
        const map = new Map<string, Memo[]>();
        memos.forEach((memo) => {
            let t = memo.targetDate ? new Date(memo.targetDate.replace(/-/g, '/')) : new Date(memo.timestamp);
            if (isNaN(t.getTime())) t = new Date();
            const key = toLocalDateStr(t);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(memo);
        });
        return map;
    }, [memos]);

    // 日历生成
    const { calDays } = useMemo(() => {
        const year = calDate.getFullYear();
        const month = calDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days: (number | null)[] = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return { calDays: days };
    }, [calDate]);

    // 当前展示的时间线（selected = 某天 / null = 全部）
    const timelineGroups = useMemo(() => {
        if (selectedDate) {
            const dayMemos = memosByDate.get(selectedDate) ?? [];
            return dayMemos.length > 0 ? [[selectedDate, dayMemos] as [string, Memo[]]] : [];
        }
        return Array.from(memosByDate.entries()).sort(([a], [b]) => b.localeCompare(a));
    }, [memosByDate, selectedDate]);

    const year = calDate.getFullYear();
    const month = calDate.getMonth();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F6F9' }} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* ===== 顶部问候区 ===== */}
                <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View>
                            <Text style={{ fontSize: 22, fontWeight: '800', color: '#1E293B', letterSpacing: 0.3 }}>备忘录</Text>
                            <Text style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>{getGreeting()}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <View style={{ backgroundColor: '#F1F5F9', borderRadius: 12, padding: 10 }}>
                                <BookOpen size={20} color="#3966A2" />
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push('/memo/new' as any)}
                                style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 10 }}
                            >
                                <PenLine size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 统计小胶囊 */}
                    <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
                        <View style={{ flex: 1, backgroundColor: '#DBEAFE', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 12, color: '#1E3A8A', fontWeight: '600' }}>总备忘</Text>
                            <Text style={{ fontSize: 16, fontWeight: '800', color: '#1D4ED8' }}>{memos.length}</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: '#F0F9FF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 12, color: '#0369A1', fontWeight: '600' }}>记录天</Text>
                            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0369A1' }}>{memosByDate.size}</Text>
                        </View>
                    </View>
                </View>

                {/* ===== 月历卡片 ===== */}
                <View style={{ marginHorizontal: 20, marginVertical: 8, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>

                    {/* 月份导航 */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <TouchableOpacity
                            onPress={() => { setCalDate(new Date(year, month - 1, 1)); setSelectedDate(null); }}
                            style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <ChevronLeft size={16} color="#3966A2" />
                        </TouchableOpacity>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E293B' }}>
                                {MONTH_NAMES[month]}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{year}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => { setCalDate(new Date(year, month + 1, 1)); setSelectedDate(null); }}
                            style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <ChevronRight size={16} color="#3966A2" />
                        </TouchableOpacity>
                    </View>

                    {/* 周天标签 */}
                    <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                        {WEEK_DAYS.map((d, i) => (
                            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '600' }}>{d}</Text>
                            </View>
                        ))}
                    </View>

                    {/* 日历格子 */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {calDays.map((day, idx) => {
                            if (day === null) {
                                return <View key={`e-${idx}`} style={{ width: '14.28%', height: 30 }} />;
                            }
                            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isToday = toLocalDateStr(today) === dateKey;
                            const isSelected = selectedDate === dateKey;
                            const hasMemos = memosByDate.has(dateKey) && memosByDate.get(dateKey)!.length > 0;
                            const count = hasMemos ? memosByDate.get(dateKey)!.length : 0;

                            return (
                                <TouchableOpacity
                                    key={`d-${day}`}
                                    onPress={() => setSelectedDate(isSelected ? null : dateKey)}
                                    activeOpacity={0.7}
                                    style={{ width: '14.28%', height: 30, alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <View style={{
                                        width: 26, height: 26,
                                        borderRadius: 8,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: isSelected ? '#1E293B' : isToday ? '#DBEAFE' : 'transparent',
                                    }}>
                                        <Text style={{
                                            fontSize: 12,
                                            fontWeight: hasMemos || isToday ? '700' : '400',
                                            color: isSelected ? '#FFFFFF' : isToday ? '#1D4ED8' : hasMemos ? '#1E293B' : '#94A3B8',
                                        }}>{day}</Text>
                                        {/* 有备忘的小圆点指示 */}
                                        {hasMemos && !isSelected && (
                                            <View style={{
                                                position: 'absolute', bottom: 2,
                                                width: count >= 3 ? 6 : 4,
                                                height: 4, borderRadius: 2,
                                                backgroundColor: '#3966A2',
                                            }} />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* 图例 + 已选提示 */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderColor: '#F5F5F5' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 6, height: 4, borderRadius: 2, backgroundColor: '#3966A2', marginRight: 4 }} />
                                <Text style={{ fontSize: 10, color: '#94A3B8' }}>有记录</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 6, height: 6, borderRadius: 2, backgroundColor: '#DBEAFE', marginRight: 4 }} />
                                <Text style={{ fontSize: 10, color: '#94A3B8' }}>今天</Text>
                            </View>
                        </View>
                        {selectedDate && (
                            <TouchableOpacity onPress={() => setSelectedDate(null)}>
                                <Text style={{ fontSize: 11, color: '#3966A2', fontWeight: '500' }}>
                                    {formatDateLabel(selectedDate)} (点此清除)
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* ===== 时间线 Feed ===== */}
                <View style={{ paddingHorizontal: 20 }}>
                    {/* Feed 标题 */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 2 }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E293B' }}>
                            {selectedDate ? `${formatDateLabel(selectedDate)}的备忘` : '全部记录'}
                        </Text>
                        {!selectedDate && (
                            <Text style={{ fontSize: 12, color: '#94A3B8', marginLeft: 8, fontWeight: '400' }}>按时间倒序</Text>
                        )}
                    </View>

                    {timelineGroups.length === 0 ? (
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, backgroundColor: '#F5EFE7', borderRadius: 22 }}>
                            <Text style={{ fontSize: 36, marginBottom: 10 }}>📖</Text>
                            <Text style={{ fontSize: 15, fontWeight: '600', color: '#6B5E52' }}>
                                {selectedDate ? '这一天还没有记录' : '还没有任何记录'}
                            </Text>
                            <Text style={{ fontSize: 13, color: '#64748B', marginTop: 5 }}>
                                {selectedDate ? '选择其他日期，或去聊天记录一条' : '去聊天里让 AI 帮你记录第一条吧～'}
                            </Text>
                        </View>
                    ) : (
                        timelineGroups.map(([dateKey, dayMemos]) => (
                            <View key={dateKey} style={{ marginBottom: 22 }}>
                                {/* 日期分组 Header */}
                                {!selectedDate && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3966A2', marginRight: 8 }} />
                                        <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#1E293B' }}>{formatDateLabel(dateKey)}</Text>
                                        <View style={{ flex: 1, height: 1, backgroundColor: '#EDE8E0', marginLeft: 10 }} />
                                        <Text style={{ fontSize: 11, color: '#94A3B8', marginLeft: 8 }}>{dayMemos.length} 条</Text>
                                    </View>
                                )}

                                {/* 该日备忘卡片 */}
                                <View style={{ gap: 10 }}>
                                    {dayMemos.map((memo) => {
                                        const s = getCatStyle(memo.category);
                                        return (
                                            <TouchableOpacity
                                                key={memo.id}
                                                activeOpacity={0.8}
                                                onPress={() => router.push(`/countdown/${memo.id}` as any)}
                                                style={{
                                                    backgroundColor: '#FFFFFF',
                                                    borderRadius: 14,
                                                    padding: 14,
                                                    shadowColor: '#000',
                                                    shadowOffset: { width: 0, height: 1 },
                                                    shadowOpacity: 0.03,
                                                    shadowRadius: 3,
                                                    elevation: 0.5,
                                                }}
                                            >
                                                {/* 类别 + 时间 + 删除 */}
                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.dot, marginRight: 6 }} />
                                                        <Text style={{ fontSize: 12, fontWeight: '600', color: s.text, marginRight: 8 }}>{memo.category}</Text>
                                                        <Text style={{ fontSize: 11, color: '#D1C4B5' }}>{formatTime(memo.timestamp)}</Text>
                                                    </View>
                                                    <TouchableOpacity onPress={() => handleDelete(memo)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                                        <Trash2 size={14} color="#E5DFD6" />
                                                    </TouchableOpacity>
                                                </View>

                                                {/* 正文 */}
                                                <Text style={{ fontSize: 14.5, color: '#1E293B', lineHeight: 22, fontWeight: '400' }} numberOfLines={4}>
                                                    {memo.content}
                                                </Text>

                                                {/* 目标日期标签 */}
                                                {memo.targetDate && (
                                                    <View style={{ marginTop: 10, backgroundColor: '#FEF9EF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' }}>
                                                        <Text style={{ fontSize: 11, color: '#1D4ED8', fontWeight: '600' }}>📅 目标日期 {memo.targetDate}</Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
