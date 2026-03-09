/**
 * 语音识别服务 - 百度智能云语音识别 API
 *
 * ✅ 纯 JS 实现，Expo Go 直接运行，无需原生编译
 * ✅ 免费额度：每天 50,000 次短语音识别
 * ✅ 支持普通话、粤语、英语等
 *
 * 申请地址：https://cloud.baidu.com → 语音技术 → 创建应用 → 获取 API Key & Secret Key
 */

import { CONFIG } from '@/constants/Config';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// 缓存 access_token，避免每次都重新请求
let _cachedToken: string | null = null;
let _tokenExpiry: number = 0;

/**
 * 获取百度 access_token（自动缓存，30天有效期）
 */
async function getBaiduAccessToken(): Promise<string> {
    const now = Date.now();
    if (_cachedToken && now < _tokenExpiry) {
        return _cachedToken;
    }

    const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${CONFIG.BAIDU_API_KEY}&client_secret=${CONFIG.BAIDU_SECRET_KEY}`;

    const res = await fetch(url, { method: 'POST' });
    const data = await res.json();

    if (!data.access_token) {
        throw new Error(`百度 Token 获取失败: ${JSON.stringify(data)}`);
    }

    _cachedToken = data.access_token;
    // 提前60秒刷新，expires_in 单位为秒
    _tokenExpiry = now + (data.expires_in - 60) * 1000;
    return _cachedToken!;
}

/**
 * 将音频文件转写为文字
 * @param audioUri expo-av 录音后返回的本地 URI（file:// 或 blob:）
 */
export async function transcribeAudio(audioUri: string): Promise<string> {
    try {
        const token = await getBaiduAccessToken();

        let base64Audio: string;
        let audioLen: number;
        let format: string;

        if (Platform.OS === 'web') {
            // Web 端：audioUri 是 blob URL
            const response = await fetch(audioUri);
            const blob = await response.blob();
            audioLen = blob.size;
            format = 'webm';
            base64Audio = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const dataUrl = reader.result as string;
                    resolve(dataUrl.split(',')[1]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } else {
            // Native 端：audioUri 是本地 file:// 路径
            const fileInfo = await FileSystem.getInfoAsync(audioUri);
            if (!fileInfo.exists) {
                throw new Error('音频文件不存在');
            }
            format = 'm4a'; // iOS/Android 录音默认格式
            base64Audio = await FileSystem.readAsStringAsync(audioUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            // size 字段在部分版本可能不存在，用 base64 长度反推原始字节数作兜底
            audioLen = (fileInfo as any).size || Math.round(base64Audio.length * 0.75);
        }

        const body = {
            format,
            rate: 16000,    // 采样率：16kHz（需与录音设置一致）
            channel: 1,     // 单声道
            cuid: 'expo-chat-app',
            token,
            speech: base64Audio,
            len: audioLen,
            dev_pid: 1537,  // 1537 = 普通话(含简单英文) | 1737 = 英语 | 1637 = 粤语
        };

        const response = await fetch('https://vop.baidu.com/server_api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (data.err_no !== 0) {
            console.error('[BaiduASR] Error:', data);
            throw new Error(`百度语音识别失败 (${data.err_no}): ${data.err_msg}`);
        }

        return (data.result?.[0] ?? '').trim();
    } catch (error) {
        console.error('[BaiduASR] transcribeAudio error:', error);
        throw error;
    }
}
