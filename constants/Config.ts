export const CONFIG = {
    // ⚠️ 注意：在实际生产环境中，不应该将 API Key 直接写在代码里，
    // 应该使用环境变量 (process.env.EXPO_PUBLIC_...) 或后端代理。
    // 但为了演示方便，我们在本地直接使用。
    ALIYUN_API_KEY: 'sk-931e7a328df84ddc96421ca9694b0897',
    ALIYUN_API_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    AUDIO_API_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/audio/transcriptions',
    MODEL_NAME: 'qwen-plus', // 或 qwen-max
    AUDIO_MODEL: 'sensevoice-v1', // 语音识别大模型
};
