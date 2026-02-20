
import { transcribeAudio } from '@/services/audio';
import { addMessageToSession, ChatMessage, ensureSessionCreated, getSession, updateSessionTitle } from '@/services/db';
import { generateTitle, sendToLLM, SYSTEM_PROMPT } from '@/services/llm';
import { useSettings } from '@/services/SettingsContext';
import clsx from 'clsx';
import { Audio } from 'expo-av';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Mic, PlusCircle, Smile } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Image, ImageBackground, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { chatBackground } = useSettings();
    const insets = useSafeAreaInsets();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [sessionTitle, setSessionTitle] = useState('新对话');
    const scrollViewRef = useRef<ScrollView>(null);
    const [isNewSession, setIsNewSession] = useState(false);
    const [inputHeight, setInputHeight] = useState(40);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
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
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

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
                    // Append the transcribed text to whatever is already in the input
                    setInputText(prev => prev ? prev + ' ' + text : text);
                }
            }
        } catch (error) {
            console.error('Error during transcription', error);
        } finally {
            setIsTranscribing(false);
        }
    }

    const loadSession = async (sessionId: string) => {
        const session = await getSession(sessionId);
        if (session) {
            setMessages(session.messages);
            setSessionTitle(session.title);
            setIsNewSession(false);
        } else {
            // New Session State (not saved yet)
            setIsNewSession(true);
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

    const sendMessage = async () => {
        if (!inputText.trim() || isTyping || !id) return;

        const userText = inputText.trim();
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

        // 1. Update UI & DB
        // Use functional state update to ensure we have the latest messages
        setMessages(prev => [...prev, newUserMessage]);
        setInputText('');
        setIsTyping(true);

        await addMessageToSession(id, newUserMessage);

        // 1.5 Generate Title if it's the first user message
        if (sessionTitle === '新对话') { // Check efficiently
            // specific check for first message can be done by checking messages length if needed, 
            // but here we just rely on title state for simplicity or previous logic.
            // Re-implementing specific check:
            const isFirstMessage = messages.filter(m => m.role === 'user').length === 0;
            if (isFirstMessage) {
                generateTitle(userText).then(async (newTitle) => {
                    await updateSessionTitle(id, newTitle);
                    setSessionTitle(newTitle);
                });
            }
        }

        try {
            // 2. Prepare context
            // We need to include the new user message in the history sent to API
            const currentMsgs = [...messages, newUserMessage];
            const historyForAPI = [
                { role: 'system', content: SYSTEM_PROMPT },
                ...currentMsgs
            ].map(m => ({
                role: m.role as 'system' | 'user' | 'assistant',
                content: m.content
            }));

            // 3. Create a temporary AI message placeholder
            const tempAiMsgId = (Date.now() + 1).toString();
            const tempAiMessage: ChatMessage = {
                id: tempAiMsgId,
                role: 'assistant',
                content: '...', // Initial placeholder
                timestamp: new Date().toISOString(),
            };

            setMessages(prev => [...prev, tempAiMessage]);

            // 4. Call API with Streaming
            let accumulatedContent = '';

            await sendToLLM(historyForAPI, (chunk) => {
                accumulatedContent = chunk;

                // Update the UI with the partial content
                setMessages(prev => {
                    return prev.map(msg =>
                        msg.id === tempAiMsgId
                            ? { ...msg, content: chunk || '...' }
                            : msg
                    );
                });
            });

            // 5. Post-processing (Save Memo, Save AI Message to DB)
            const aiReplyContent = accumulatedContent;
            let displayContent = aiReplyContent;

            // --- Core Logic: Extract JSON and Save Memo ---
            const jsonMatch = aiReplyContent.match(/```json\n([\s\S]*?)\n```/);

            if (jsonMatch && jsonMatch[1]) {
                try {
                    const actionData = JSON.parse(jsonMatch[1]);

                    if (actionData.action === 'save_memo') {
                        const { addMemo } = require('@/services/db');
                        await addMemo(actionData.content, actionData.category);
                        console.log("Memo Saved:", actionData);
                    }
                    displayContent = aiReplyContent.replace(/```json[\s\S]*```/, '').trim();
                } catch (e) {
                    console.error("Failed to parse AI JSON", e);
                }
            }
            // ----------------------------------

            // Final Update for UI & DB
            const finalAiMessage: ChatMessage = {
                id: tempAiMsgId,
                role: 'assistant',
                content: displayContent,
                timestamp: new Date().toISOString(),
            };

            // Update UI one last time to ensure clean content (no JSON)
            setMessages(prev => prev.map(msg => msg.id === tempAiMsgId ? finalAiMessage : msg));

            // Persist to DB
            await addMessageToSession(id, finalAiMessage);

        } catch (error) {
            console.log(error);
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '哎呀，网络好像开小差了，请重试一下 😖',
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages, isTyping]);

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
                {/* Recording / Transcribing Overlay */}
                {recording && (
                    <View className="absolute top-1/2 left-1/2 -mt-16 -ml-16 w-32 h-32 bg-black/70 rounded-2xl items-center justify-center z-50">
                        <Mic size={40} color="white" className="mb-2" />
                        <Text className="text-white font-medium">松开 结束</Text>
                    </View>
                )}
                {isTranscribing && (
                    <View className="absolute top-1/2 left-1/2 -mt-16 -ml-16 w-32 h-32 bg-black/70 rounded-2xl items-center justify-center z-50">
                        <Text className="text-white font-medium">识别中...</Text>
                    </View>
                )}

                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1 px-3 py-4"
                    contentContainerStyle={{ paddingBottom: 20 }}
                >
                    {messages.map((msg, index) => {
                        const isUser = msg.role === 'user';

                        return (
                            <View
                                key={msg.id}
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

                                        <Text className="text-[16px] leading-[22px] text-[#181818]">
                                            {msg.content}
                                        </Text>
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
                    })}

                    {isTyping && (
                        <View className="flex-row justify-start mb-4">
                            <View className="mr-3">
                                <View className="w-10 h-10 rounded-md bg-white overflow-hidden shadow-sm">
                                    <Image
                                        source={{ uri: 'https://api.dicebear.com/9.x/notionists/png?seed=Felix' }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                </View>
                            </View>
                            <View className="relative bg-white px-3 py-2.5 rounded-md">
                                <View className="absolute w-3 h-3 top-3 rotate-45 bg-white -left-1.5" />
                                <Text className="text-gray-400">正在输入...</Text>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Input Area (WeChat Style) */}
                <View
                    className="px-2 py-2 bg-[#F7F7F7] border-t border-[#DCDCDC] flex-row items-end"
                    style={{ paddingBottom: keyboardVisible ? 10 : (insets.bottom + 10) }}
                >
                    {/* Voice Icon */}
                    <TouchableOpacity
                        className="p-2 mb-1"
                        onPressIn={startRecording}
                        onPressOut={stopRecording}
                        activeOpacity={0.7}
                    >
                        <Mic size={28} color={recording ? "#07C160" : "#181818"} strokeWidth={1.5} />
                    </TouchableOpacity>

                    {/* Input */}
                    <View className="flex-1 bg-white rounded-md mx-1 mb-1.5 px-3 py-2 min-h-[40px] justify-center">
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
