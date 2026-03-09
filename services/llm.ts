import { CONFIG } from '@/constants/Config';
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { addMemo } from "./db";

export { SYSTEM_PROMPT } from './prompt';

export interface ChatMessage {
    id: string;
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp?: string;
}

export const llm = new ChatOpenAI({
    model: CONFIG.MODEL_NAME,
    apiKey: CONFIG.VOLC_API_KEY,
    configuration: {
        baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    },
    maxRetries: 2,
    timeout: 15000,
    temperature: 0.7,
    streaming: true,
});

export const titleLLM = new ChatOpenAI({
    modelName: CONFIG.MODEL_NAME,
    apiKey: CONFIG.VOLC_API_KEY,
    configuration: {
        baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    },
    temperature: 0.3,
    streaming: false,
});

// 定义保存备忘录的工具
export const saveMemoTool = new DynamicStructuredTool({
    name: "save_memo",
    description: "当用户要求你记住某件事、提醒某件事，或者添加一条备忘录时，调用此工具将数据存入数据库。",
    schema: z.object({
        content: z.string().describe("备忘录的具体文本内容，简明扼要"),
        category: z.string().describe("备忘录的分类，如：工作、生活、学习等"),
        targetDate: z.string().optional().describe("涉及到的截止日期或时间，必须是合法的 YYYY-MM-DD 格式，如果没有则忽略"),
    }),
    func: async ({ content, category, targetDate }) => {
        try {
            await addMemo(content, category, targetDate);
            return "备忘录保存成功。请口语化地告知用户你已经帮他记下来了。";
        } catch (e) {
            console.error(e);
            return "保存失败，请引导用户重新尝试。";
        }
    },
});

const tools = [saveMemoTool];

import { SystemMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SYSTEM_PROMPT } from './prompt';

// 执行器
export const agentExecutor = createReactAgent({
    llm,
    tools,
    stateModifier: new SystemMessage(`${SYSTEM_PROMPT}\n\n[非常重要！！！当前时间提示]：用户当前设备的真实系统时间是 ${new Date().toLocaleString('zh-CN')}。如果用户说了“下周”、“明天”、“大后天”等相对时间，请利用系统时间推算准确的 YYYY-MM-DD 传给工具使用。如果没有提及日期，不用强行推算。`),
});

export async function generateTitleAgent(content: string) {
    try {
        const response = await titleLLM.invoke([
            { role: 'system', content: '你是标题生成助手。请根据用户的输入生成一个简短的标题（5-8个字以内）。不要包含标点符号。直接输出标题内容。' },
            { role: 'user', content: content }
        ]);
        return response.content.toString().trim();
    } catch (error) {
        console.error('Failed to generate title:', error);
        return '新对话';
    }
}
