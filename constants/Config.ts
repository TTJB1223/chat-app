export const CONFIG = {
    // 火山引擎 API Key（对话大模型）
    VOLC_API_KEY: process.env.EXPO_PUBLIC_VOLC_API_KEY || '',
    VOLC_API_URL: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',  // 火山引擎 Rest API 地址   
    MODEL_NAME: 'doubao-seed-2-0-pro-260215',  //火山引擎模型 ID
    // ✅ 语音识别：百度智能云 ASR  申请地址：https://cloud.baidu.com → 产品 → 语音技术 → 创建应用
    BAIDU_API_KEY: process.env.EXPO_PUBLIC_BAIDU_API_KEY || '',
    BAIDU_SECRET_KEY: process.env.EXPO_PUBLIC_BAIDU_SECRET_KEY || '',
};