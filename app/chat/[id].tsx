
import { transcribeAudio } from '@/services/audio';
import { addMessageToSession, ChatMessage, ensureSessionCreated, getSession, getSessionMessages, updateSessionTitle } from '@/services/db';
import { agentExecutor, generateTitleAgent } from '@/services/llm';
import { useSettings } from '@/services/SettingsContext';
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import clsx from 'clsx';

import { Audio } from 'expo-av';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Keyboard as KeyboardIcon, Mic, PlusCircle, Smile } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ImageBackground, Keyboard, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// 动态跳跳点（AI 思考中动画）
function TypingDots() {
    const [dots, setDots] = React.useState(1);
    useEffect(() => {
        const timer = setInterval(() => setDots(d => (d % 3) + 1), 500);
        return () => clearInterval(timer);
    }, []);
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', height: 22, gap: 4 }}>
            {[1, 2, 3].map(i => (
                <View
                    key={i}
                    style={{
                        width: 7, height: 7, borderRadius: 4,
                        backgroundColor: i <= dots ? '#07C160' : '#CCCCCC',
                    }}
                />
            ))}
        </View>
    );
}
const MessageBubble = React.memo(({ msg }: { msg: ChatMessage }) => {
    const isUser = msg.role === 'user';
    return (
        <View
            className={clsx(
                "flex-row mb-4 w-full",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            {!isUser && (
                <View className="mr-3">
                    <View className="w-10 h-10 rounded-md bg-white overflow-hidden shadow-sm">
                        <Image
                            source={{ uri: 'https://api.dicebear.com/9.x/notionists/png?seed=Felix' }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    </View>
                </View>
            )}

            <View className={clsx("max-w-[70%]", isUser ? "items-end" : "items-start")}>
                {/* Bubble */}
                <View
                    className={clsx(
                        "px-3 py-2.5 rounded-md relative",
                        isUser
                            ? "bg-[#95EC69]"
                            : "bg-white"
                    )}
                    style={{
                        borderRadius: 6,
                    }}
                >
                    {/* Tail */}
                    <View
                        className={clsx(
                            "absolute w-3 h-3 top-3 rotate-45",
                            isUser
                                ? "bg-[#95EC69] -right-1.5"
                                : "bg-white -left-1.5"
                        )}
                    />

                    {msg.content === '__typing__' ? (
                        <TypingDots />
                    ) : (
                        <Text className="text-[16px] leading-[22px] text-[#181818]">
                            {msg.content}
                        </Text>
                    )}
                </View>
            </View>

            {isUser && (
                <View className="ml-3">
                    <View className="w-10 h-10 rounded-md bg-gray-300 overflow-hidden">
                        <Image
                            source={{ uri: 'https://api.dicebear.com/9.x/avataaars/png?seed=Jett' }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    </View>
                </View>
            )}
        </View>
    );
}, (prevProps, nextProps) => {
    // Only re-render if content changes (vital for streaming AI responses hitting the *same* message ID)
    return prevProps.msg.id === nextProps.msg.id && prevProps.msg.content === nextProps.msg.content;
});

export default function ChatDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { chatBackground } = useSettings();
    const insets = useSafeAreaInsets();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [sessionTitle, setSessionTitle] = useState('新对话');
    const flatListRef = useRef<FlatList>(null);
    const [isNewSession, setIsNewSession] = useState(false);
    const [inputHeight, setInputHeight] = useState(40);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);

    // Initial Load & Keyboard Listeners
    useEffect(() => {
        if (id) {
            loadSession(id);
        }

        const showSubscription = Platform.OS === 'ios' ?
            Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true)) :
            Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const hideSubscription = Platform.OS === 'ios' ?
            Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false)) :
            Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, [id]);


    async function startRecording() {
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    }

    async function stopRecording() {
        if (!recording) return;
        setIsTranscribing(true);
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);
            if (uri) {
                const text = await transcribeAudio(uri);
                if (text) {
                    // 识别完直接发送，无需手动点发送
                    sendMessageText(text);
                    setInputMode('text');
                }
            }
        } catch (error) {
            console.error('Error during transcription', error);
        } finally {
            setIsTranscribing(false);
        }
    }

    const PAGE_SIZE = 30;
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const loadSession = async (sessionId: string) => {
        const session = await getSession(sessionId);
        if (session) {
            setSessionTitle(session.title);
            setIsNewSession(false);

            const initialMessages = await getSessionMessages(sessionId, 0, PAGE_SIZE);
            setMessages(initialMessages);
            if (initialMessages.length < PAGE_SIZE) {
                setHasMore(false);
            }
        } else {
            // New Session State (not saved yet)
            setIsNewSession(true);
            setHasMore(false);
            setMessages([
                {
                    id: 'welcome',
                    role: 'assistant',
                    content: '嗨！我是小语，你的私人智能备忘录助理。你可以告诉我任何事情，我会帮你记住并整理好！🐱',
                    timestamp: new Date().toISOString()
                }
            ]);
        }
    };

    const loadMoreMessages = async () => {
        if (!id || !hasMore || isLoadingMore || isNewSession) return;
        setIsLoadingMore(true);
        try {
            const olderMessages = await getSessionMessages(id, messages.length, PAGE_SIZE);
            if (olderMessages.length > 0) {
                // olderMessages are ASC (older to newer). Prepend them to the current ASC messages list
                setMessages(prev => [...olderMessages, ...prev]);
            }
            if (olderMessages.length < PAGE_SIZE) {
                setHasMore(false);
            }
        } finally {
            setIsLoadingMore(false);
        }
    };

    // 核心发送逻辑，接受直接传入的文字（供语音识别调用）
    const sendMessageText = async (text: string) => {
        if (!text.trim() || isTyping || !id) return;

        const userText = text.trim();
        setInputText(''); // 清空输入框
        await _doSendMessage(userText);
    };

    const sendMessage = async () => {
        if (!inputText.trim() || isTyping || !id) return;
        const userText = inputText.trim();
        setInputText('');
        await _doSendMessage(userText);
    };

    const _doSendMessage = async (userText: string) => {

        const newUserMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: userText,
            timestamp: new Date().toISOString(),
        };

        // 0. Ensure session exists in DB before adding message
        if (isNewSession) {
            await ensureSessionCreated(id, sessionTitle);
            setIsNewSession(false);
        }

        // 1. 立刻插入用户消息 + AI 占位气泡（避免双头像）
        const tempAiMsgId = (Date.now() + 1).toString();
        const tempAiMessage: ChatMessage = {
            id: tempAiMsgId,
            role: 'assistant',
            content: '__typing__',
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, newUserMessage, tempAiMessage]);
        setIsTyping(true);

        await addMessageToSession(id, newUserMessage);

        // 1.5 Generate Title if it's the first user message
        if (sessionTitle === '新对话') { // Check efficiently
            // specific check for first message can be done by checking messages length if needed, 
            // but here we just rely on title state for simplicity or previous logic.
            // Re-implementing specific check:
            const isFirstMessage = messages.filter(m => m.role === 'user').length === 0;
            if (isFirstMessage) {
                generateTitleAgent(userText).then(async (newTitle) => {
                    await updateSessionTitle(id, newTitle);
                    setSessionTitle(newTitle);
                });
            }
        }

        try {
            // 2. 准备历史消息上下文
            const currentMsgs = [...messages, newUserMessage];
            const chatHistory = currentMsgs
                .filter(m => m.id !== 'welcome' && m.id !== newUserMessage.id)
                .map(m => m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content));

            // 3. 调用 API 流式输出
            let accumulatedContent = '';
            let lastUpdateTime = 0;

            const stream = await agentExecutor.streamEvents(
                {
                    messages: [...chatHistory, new HumanMessage(userText)]
                },
                { version: "v2" }
            );

            for await (const event of stream) {
                const eventType = event.event;

                if (eventType === "on_chat_model_stream") {
                    const chunk = event.data.chunk?.content;
                    if (chunk && typeof chunk === 'string') {
                        accumulatedContent += chunk;

                        // Throttling UI updates to avoid freezing RN thread
                        const now = Date.now();
                        if (now - lastUpdateTime > 80) {
                            lastUpdateTime = now;
                            setMessages(prev => {
                                return prev.map(msg =>
                                    msg.id === tempAiMsgId
                                        ? { ...msg, content: accumulatedContent || '思考中...' }
                                        : msg
                                );
                            });
                        }
                    }
                } else if (eventType === "on_chat_model_end") {
                    const outputContent = event.data.output?.content;
                    if (outputContent && typeof outputContent === 'string') {
                        // If streaming is broken/disabled on RN, it comes here bulk.
                        if (!accumulatedContent.includes(outputContent)) {
                            accumulatedContent = outputContent;
                            setMessages(prev => prev.map(msg => msg.id === tempAiMsgId ? { ...msg, content: accumulatedContent || '已处理完毕。' } : msg));
                        }
                    }
                } else if (eventType === "on_tool_start" && event.name === 'save_memo') {
                    // Update UI to show that a tool is being called
                    setMessages(prev => {
                        return prev.map(msg =>
                            msg.id === tempAiMsgId
                                ? { ...msg, content: accumulatedContent ? accumulatedContent + '\n\n[正在保存备忘录...]' : '[正在保存备忘录...]' }
                                : msg
                        );
                    });
                }
            }

            // Final Update for UI & DB
            const finalAiMessage: ChatMessage = {
                id: tempAiMsgId,
                role: 'assistant',
                content: accumulatedContent || '已处理完毕。',
                timestamp: new Date().toISOString(),
            };

            // Update UI one last time to ensure clean content (no JSON)
            setMessages(prev => prev.map(msg => msg.id === tempAiMsgId ? finalAiMessage : msg));

            // Persist to DB
            await addMessageToSession(id, finalAiMessage);

        } catch (error: any) {
            console.log(error);
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '哎呀，网络好像开小差了，请重试一下 😖\n错误信:\n' + (error?.message || error?.toString()),
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#EDEDED]" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Background Image Layer */}
            {chatBackground ? (
                <ImageBackground
                    source={{ uri: chatBackground }}
                    className="absolute inset-0 w-full h-full"
                    resizeMode="cover"
                />
            ) : null}

            {/* Header */}
            <View className={`flex-row items-center justify-between px-4 py-3 border-b border-[#DCDCDC] z-10 ${chatBackground ? 'bg-white/80' : 'bg-[#EDEDED]'}`}>
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ChevronLeft size={24} color="#181818" />
                </TouchableOpacity>
                <Text className="text-[17px] font-medium text-[#181818] flex-1 text-center truncate" numberOfLines={1}>
                    {sessionTitle}
                </Text>
                <TouchableOpacity className="p-2 -mr-2 w-10">
                    {/* Placeholder for More icon */}
                    <View className="w-5 h-1 bg-[#181818] rounded-full opacity-0" />
                </TouchableOpacity>
            </View>

            {/* Chat Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className={`flex-1 ${chatBackground ? 'bg-transparent' : 'bg-[#EDEDED]'}`}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {/* 录音中 / 识别中 覆盖层 */}
                {recording && (
                    <View className="absolute top-1/2 left-1/2 -mt-16 -ml-16 w-32 h-32 bg-black/70 rounded-2xl items-center justify-center z-50">
                        <Mic size={40} color="white" />
                        <Text className="text-white font-medium mt-2">松开 结束</Text>
                    </View>
                )}
                {isTranscribing && (
                    <View className="absolute top-1/2 left-1/2 -mt-16 -ml-16 w-32 h-32 bg-black/70 rounded-2xl items-center justify-center z-50">
                        <ActivityIndicator color="white" size="large" />
                        <Text className="text-white font-medium mt-2">识别中...</Text>
                    </View>
                )}

                <FlatList
                    ref={flatListRef}
                    className="flex-1 px-3"
                    data={[...messages].reverse()}
                    keyExtractor={(item) => item.id}
                    inverted
                    onEndReached={loadMoreMessages}
                    onEndReachedThreshold={0.5}
                    contentContainerStyle={{ paddingVertical: 16, flexGrow: 1, justifyContent: 'flex-end' }}
                    renderItem={({ item }) => <MessageBubble msg={item} />}
                    ListHeaderComponent={null}
                    ListFooterComponent={() => (
                        isLoadingMore ? (
                            <View className="py-4 items-center">
                                <ActivityIndicator size="small" color="#999" />
                            </View>
                        ) : null
                    )}
                />

                {/* Input Area (WeChat Style) */}
                <View
                    className="px-2 py-2 bg-[#F7F7F7] border-t border-[#DCDCDC] flex-row items-end"
                    style={{ paddingBottom: keyboardVisible ? 10 : (insets.bottom + 10) }}
                >
                    {/* Voice/Keyboard Toggle Icon */}
                    <TouchableOpacity
                        className="p-2 mb-1"
                        onPress={() => setInputMode(prev => prev === 'text' ? 'voice' : 'text')}
                        activeOpacity={0.7}
                    >
                        {inputMode === 'text' ? (
                            <Mic size={28} color="#181818" strokeWidth={1.5} />
                        ) : (
                            <KeyboardIcon size={28} color="#181818" strokeWidth={1.5} />
                        )}
                    </TouchableOpacity>

                    {/* Input Area */}
                    <View className="flex-1 mx-1 mb-1.5 justify-center">
                        {inputMode === 'text' ? (
                            <View className="bg-white rounded-md px-3 py-2 min-h-[40px] justify-center">
                                <TextInput
                                    className="text-[16px] text-[#181818] leading-[20px] pt-0 pb-0"
                                    placeholder=""
                                    multiline
                                    value={inputText}
                                    onChangeText={setInputText}
                                    onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
                                    style={{ maxHeight: 100 }}
                                />
                            </View>
                        ) : (
                            <TouchableOpacity
                                className={`rounded-md min-h-[40px] justify-center items-center ${recording ? 'bg-[#c6c6c6]' : 'bg-white'}`}
                                activeOpacity={1}
                                onPressIn={startRecording}
                                onPressOut={stopRecording}
                            >
                                <Text className="text-[16px] font-medium text-[#181818]">
                                    {recording ? '松开 结束' : '按住 说话'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Smile Icon */}
                    <TouchableOpacity className="p-2 mb-1">
                        <Smile size={28} color="#181818" strokeWidth={1.5} />
                    </TouchableOpacity>

                    {/* Send Button or Plus Icon */}
                    {inputText.trim() ? (
                        <TouchableOpacity
                            onPress={sendMessage}
                            activeOpacity={0.7}
                            className="mb-1.5 px-3 py-1.5 bg-[#07C160] rounded-[4px] ml-1 mr-1 justify-center"
                            style={{ height: 34 }}
                        >
                            <Text className="font-medium text-white text-sm">发送</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity className="p-2 mb-1">
                            <PlusCircle size={28} color="#181818" strokeWidth={1.5} />
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
