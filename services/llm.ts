
import { CONFIG } from '@/constants/Config';

// Re-export specific prompt
export { SYSTEM_PROMPT } from './prompt';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export async function sendToLLM(messages: ChatMessage[], onProgress?: (content: string) => void) {
    try {
        const response = await fetch(CONFIG.ALIYUN_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.ALIYUN_API_KEY}`,
                'Accept': 'text/event-stream'
            },
            body: JSON.stringify({
                model: CONFIG.MODEL_NAME,
                messages: messages,
                stream: true,
                incremental_output: true
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('LLM API Error:', errorText);
            throw new Error(`API Endpoint Error: ${response.status}`);
        }

        if (!onProgress) {
            const data = await response.json();
            return data.choices?.[0]?.message?.content || data.output?.text || '';
        }

        const reader = response.body?.getReader();
        if (!reader) {
            const data = await response.json();
            return data.choices?.[0]?.message?.content || data.output?.text || '';
        }

        const decoder = new TextDecoder('utf-8');
        let fullContent = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const jsonStr = line.replace('data:', '').trim();
                    if (jsonStr === '[DONE]') break;
                    try {
                        const data = JSON.parse(jsonStr);
                        // Aliyun DashScope usually returns 'output.text' which is the FULL text so far if incremental_output is NOT set, 
                        // or DIFF if incremental_output IS set.
                        // We set incremental_output: true, so we expect DIFFs.
                        // However, OpenAI format is choices[0].delta.content.

                        const content = data.choices?.[0]?.delta?.content || data.output?.text || '';

                        if (content) {
                            fullContent += content;
                            onProgress(fullContent);
                        }
                    } catch (e) {
                        // ignore
                    }
                }
            }
        }

        return fullContent;

    } catch (error) {
        console.error('Failed to fetch from LLM:', error);
        return '网络好像有点问题... 😵‍💫';
    }
}

export async function generateTitle(content: string) {
    try {
        const messages = [
            { role: 'system', content: '你是标题生成助手。请根据用户的输入生成一个简短的标题（5-8个字以内）。不要包含标点符号。直接输出标题内容。' },
            { role: 'user', content: content }
        ];

        const response = await fetch(CONFIG.ALIYUN_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.ALIYUN_API_KEY}`,
            },
            body: JSON.stringify({
                model: CONFIG.MODEL_NAME,
                messages: messages,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`API Endpoint Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();

    } catch (error) {
        console.error('Failed to generate title:', error);
        return '新对话';
    }
}
