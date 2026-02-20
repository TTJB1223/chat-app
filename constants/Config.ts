export const CONFIG = {
    // ⚠️ 注意：前端直接调用大模型，即使使用了 .env 并且不会上传到 Github 
    // 但在客户端打包 (APK/IPA/Web) 后，API Key 依然会以明文存在于包体中。
    // 在真正的生产环境中，强烈建议使用后端服务器作代理中转！
    ALIYUN_API_KEY: process.env.EXPO_PUBLIC_ALIYUN_API_KEY || '',
    ALIYUN_API_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    AUDIO_API_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/audio/transcriptions',
    MODEL_NAME: 'qwen-plus', // 或 qwen-max
    AUDIO_MODEL: 'sensevoice-v1', // 语音识别大模型
};
