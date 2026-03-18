import { deleteMemo, getMemos, Memo } from '@/services/db';
import { useFocusEffect, useRouter } from 'expo-router';
import { BookOpen, ChevronLeft, ChevronRight, Clock, PenLine, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 类别配色
const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    '倒计时': { bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B' },
    '工作': { bg: '#DBEAFE', text: '#1D4ED8', dot: '#3B82F6' },
    '学习': { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FDFAF6' }} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* ===== 顶部问候区 ===== */}
                <View style={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View>
                            <Text style={{ fontSize: 22, fontWeight: '800', color: '#2D2A26', letterSpacing: 0.3 }}>备忘录</Text>
                            <Text style={{ fontSize: 12.5, color: '#9C8F82', marginTop: 3 }}>{getGreeting()}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <View style={{ backgroundColor: '#F3EDE4', borderRadius: 12, padding: 10 }}>
                                <BookOpen size={20} color="#C9A87A" />
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push('/memo/new' as any)}
                                style={{ backgroundColor: '#2D2A26', borderRadius: 12, padding: 10 }}
                            >
                                <PenLine size={20} color="#F5E6D4" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 统计小胶囊 */}
                    <View style={{ flexDirection: 'row', marginTop: 14, gap: 8 }}>
                        <View style={{ flex: 1, backgroundColor: '#FEF3C7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 12, color: '#92400E', fontWeight: '600' }}>总备忘</Text>
                            <Text style={{ fontSize: 18, fontWeight: '800', color: '#B45309' }}>{memos.length}</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: '#F0FDF4', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 12, color: '#166534', fontWeight: '600' }}>记录天</Text>
                            <Text style={{ fontSize: 18, fontWeight: '800', color: '#166534' }}>{memosByDate.size}</Text>
                        </View>
                    </View>
                </View>

                {/* ===== 月历卡片 ===== */}
                <View style={{ margin: 16, backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#EEE8E0', shadowColor: '#C9A87A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}>

                    {/* 月份导航 */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <TouchableOpacity
                            onPress={() => { setCalDate(new Date(year, month - 1, 1)); setSelectedDate(null); }}
                            style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3EDE4', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <ChevronLeft size={18} color="#C9A87A" />
                        </TouchableOpacity>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 17, fontWeight: '800', color: '#2D2A26' }}>
                                {MONTH_NAMES[month]}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#B0A396', marginTop: 1 }}>{year}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => { setCalDate(new Date(year, month + 1, 1)); setSelectedDate(null); }}
                            style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3EDE4', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <ChevronRight size={18} color="#C9A87A" />
                        </TouchableOpacity>
                    </View>

                    {/* 周天标签 */}
                    <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                        {WEEK_DAYS.map((d, i) => (
                            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 12, color: '#B0A396', fontWeight: '600' }}>{d}</Text>
                            </View>
                        ))}
                    </View>

                    {/* 日历格子 */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {calDays.map((day, idx) => {
                            if (day === null) {
                                return <View key={`e-${idx}`} style={{ width: '14.28%', aspectRatio: 1 }} />;
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
                                    style={{ width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 }}
                                >
                                    <View style={{
                                        width: 34, height: 34,
                                        borderRadius: 10,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: isSelected ? '#2D2A26' : isToday ? '#FEF3C7' : 'transparent',
                                        borderWidth: isToday && !isSelected ? 1.5 : 0,
                                        borderColor: '#E4C27B',
                                    }}>
                                        <Text style={{
                                            fontSize: 14,
                                            fontWeight: hasMemos || isToday ? '700' : '400',
                                            color: isSelected ? '#F5E6D4' : isToday ? '#B45309' : hasMemos ? '#2D2A26' : '#B0A396',
                                        }}>{day}</Text>
                                        {/* 有备忘的小圆点指示 */}
                                        {hasMemos && !isSelected && (
                                            <View style={{
                                                position: 'absolute', bottom: 3,
                                                width: count >= 3 ? 10 : 6,
                                                height: 4, borderRadius: 2,
                                                backgroundColor: '#C9A87A',
                                            }} />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* 图例 + 已选提示 */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: '#F0EAE0' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 8, height: 4, borderRadius: 2, backgroundColor: '#C9A87A', marginRight: 5 }} />
                                <Text style={{ fontSize: 11, color: '#B0A396' }}>有备忘</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: '#FEF3C7', borderWidth: 1.5, borderColor: '#E4C27B', marginRight: 5 }} />
                                <Text style={{ fontSize: 11, color: '#B0A396' }}>今天</Text>
                            </View>
                        </View>
                        {selectedDate && (
                            <TouchableOpacity onPress={() => setSelectedDate(null)}>
                                <Text style={{ fontSize: 11, color: '#C9A87A', fontWeight: '600' }}>
                                    {formatDateLabel(selectedDate)} · 点击清除筛选
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* ===== 时间线 Feed ===== */}
                <View style={{ paddingHorizontal: 16 }}>
                    {/* Feed 标题 */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, paddingHorizontal: 4 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#2D2A26' }}>
                            {selectedDate ? `${formatDateLabel(selectedDate)}的备忘` : '全部记录'}
                        </Text>
                        {!selectedDate && (
                            <Text style={{ fontSize: 12, color: '#B0A396', marginLeft: 8, fontWeight: '400' }}>按时间倒序</Text>
                        )}
                    </View>

                    {timelineGroups.length === 0 ? (
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, backgroundColor: '#F5EFE7', borderRadius: 22 }}>
                            <Text style={{ fontSize: 36, marginBottom: 10 }}>📖</Text>
                            <Text style={{ fontSize: 15, fontWeight: '600', color: '#6B5E52' }}>
                                {selectedDate ? '这一天还没有记录' : '还没有任何记录'}
                            </Text>
                            <Text style={{ fontSize: 13, color: '#9C8F82', marginTop: 5 }}>
                                {selectedDate ? '选择其他日期，或去聊天记录一条' : '去聊天里让 AI 帮你记录第一条吧～'}
                            </Text>
                        </View>
                    ) : (
                        timelineGroups.map(([dateKey, dayMemos]) => (
                            <View key={dateKey} style={{ marginBottom: 22 }}>
                                {/* 日期分组 Header */}
                                {!selectedDate && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#C9A87A', marginRight: 8 }} />
                                        <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#2D2A26' }}>{formatDateLabel(dateKey)}</Text>
                                        <View style={{ flex: 1, height: 1, backgroundColor: '#EDE8E0', marginLeft: 10 }} />
                                        <Text style={{ fontSize: 11, color: '#B0A396', marginLeft: 8 }}>{dayMemos.length} 条</Text>
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
                                                    borderRadius: 18,
                                                    padding: 16,
                                                    borderWidth: 1,
                                                    borderColor: '#EEE8E0',
                                                    shadowColor: '#C9A87A',
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: 0.06,
                                                    shadowRadius: 8,
                                                    elevation: 2,
                                                }}
                                            >
                                                {/* 类别 + 时间 + 删除 */}
                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: s.dot, marginRight: 6 }} />
                                                        <View style={{ backgroundColor: s.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                                                            <Text style={{ fontSize: 11, fontWeight: '600', color: s.text }}>{memo.category}</Text>
                                                        </View>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                            <Clock size={11} color="#B0A396" />
                                                            <Text style={{ fontSize: 11, color: '#B0A396', marginLeft: 3 }}>{formatTime(memo.timestamp)}</Text>
                                                        </View>
                                                        <TouchableOpacity onPress={() => handleDelete(memo)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                                            <Trash2 size={15} color="#D1C4B5" />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>

                                                {/* 正文 */}
                                                <Text style={{ fontSize: 15.5, color: '#2D2A26', lineHeight: 24, fontWeight: '500' }} numberOfLines={4}>
                                                    {memo.content}
                                                </Text>

                                                {/* 目标日期标签 */}
                                                {memo.targetDate && (
                                                    <View style={{ marginTop: 10, backgroundColor: '#FEF9EF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' }}>
                                                        <Text style={{ fontSize: 11, color: '#B45309', fontWeight: '600' }}>📅 目标日期 {memo.targetDate}</Text>
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
