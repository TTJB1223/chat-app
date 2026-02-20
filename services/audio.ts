import { CONFIG } from '@/constants/Config';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export async function transcribeAudio(audioUri: string): Promise<string> {
    try {
        const formData = new FormData();
        formData.append('model', CONFIG.AUDIO_MODEL);

        if (Platform.OS === 'web') {
            // Web environment: audioUri is a blob URL (e.g., blob:http://localhost:8081/...)
            const response = await fetch(audioUri);
            const blob = await response.blob();

            // Append as a standard File object polyfill for web FormData
            formData.append('file', blob, 'recording.webm');
        } else {
            // Native environment: audioUri is a local file:// path
            const fileInfo = await FileSystem.getInfoAsync(audioUri);
            if (!fileInfo.exists) {
                throw new Error('Audio file does not exist');
            }

            const fileType = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4';
            const fileName = audioUri.split('/').pop() || 'recording.m4a';

            formData.append('file', {
                uri: audioUri,
                name: fileName,
                type: fileType,
            } as any);
        }

        const response = await fetch(CONFIG.AUDIO_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.ALIYUN_API_KEY}`,
                // Fetch automatically sets the correct Content-Type with boundary for FormData
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Audio transcription error:', errorData);
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // SenseVoice compatible API returns { text: '...' }
        if (data && data.text) {
            return data.text.trim();
        }

        return '';
    } catch (error) {
        console.error('Failed to transcribe audio:', error);
        throw error;
    }
}
