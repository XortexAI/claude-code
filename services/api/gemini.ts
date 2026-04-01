import { GoogleGenerativeAI, type GenerateContentStreamResult } from '@google/generative-ai';
import type { AssistantMessage, Message, StreamEvent } from '../../types/message.js';
import type { Tool } from '../../Tool.js';
import type { SystemPrompt } from '../../utils/systemPromptType.js';
import { convertToGeminiMessages, convertToGeminiTools } from './geminiAdapter.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface QueryWithModelOptions {
  tools?: Tool[];
  // Other options from Claude...
}

export async function queryModelWithoutStreaming({
  systemPrompt,
  messages,
  model = 'gemini-2.0-flash',
  tools = [],
}: {
  systemPrompt: SystemPrompt;
  messages: Message[];
  model?: string;
  tools?: Tool[];
}): Promise<AssistantMessage> {
  const geminiTools = tools.length > 0 ? [{ functionDeclarations: convertToGeminiTools(tools) }] : undefined;
  
  const generativeModel = genAI.getGenerativeModel({
    model,
    tools: geminiTools as any,
    systemInstruction: {
      role: 'system',
      parts: [{ text: Array.isArray(systemPrompt) ? systemPrompt.join('\n') : systemPrompt as unknown as string }],
    },
  });

  const geminiMessages = convertToGeminiMessages(messages);
  const result = await generativeModel.generateContent({
    contents: geminiMessages,
  });

  const response = result.response;
  const parts = response.candidates?.[0]?.content?.parts || [];
  
  // Convert Gemini response back to Anthropic-style AssistantMessage
  const content: any[] = [];
  for (const part of parts) {
    if (part.text) {
      content.push({ type: 'text', text: part.text });
    } else if (part.functionCall) {
      content.push({
        type: 'tool_use',
        id: `call_${Math.random().toString(36).substring(7)}`,
        name: part.functionCall.name,
        input: part.functionCall.args,
      });
    }
  }

  return {
    message: {
      role: 'assistant',
      content,
    } as any,
    uuid: 'uuid_not_used',
  } as any;
}

export async function queryHaiku(options: any) {
  return queryModelWithoutStreaming({ ...options, model: 'gemini-1.5-flash' });
}

export async function* queryWithModel({
  systemPrompt,
  userPrompt,
  options,
}: {
  systemPrompt: SystemPrompt;
  userPrompt: string;
  signal: AbortSignal;
  options: QueryWithModelOptions;
}): AsyncGenerator<StreamEvent, AssistantMessage, void> {
  const tools = options.tools || [];
  const geminiTools = tools.length > 0 ? [{ functionDeclarations: convertToGeminiTools(tools) }] : undefined;

  const generativeModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    tools: geminiTools as any,
    systemInstruction: {
      role: 'system',
      parts: [{ text: Array.isArray(systemPrompt) ? systemPrompt.join('\n') : systemPrompt as unknown as string }],
    },
  });

  const messages: Message[] = [{ role: 'user', content: userPrompt } as any];
  const result = await generativeModel.generateContentStream({
    contents: convertToGeminiMessages(messages),
  });

  const content: any[] = [];
  
  for await (const chunk of result.stream) {
    const parts = chunk.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.text) {
        yield { type: 'text', text: part.text } as any;
        // Append text to last block if it's text
        if (content.length > 0 && content[content.length - 1].type === 'text') {
          content[content.length - 1].text += part.text;
        } else {
          content.push({ type: 'text', text: part.text });
        }
      } else if (part.functionCall) {
        const toolUse = {
          type: 'tool_use',
          id: `call_${Math.random().toString(36).substring(7)}`,
          name: part.functionCall.name,
          input: part.functionCall.args,
        };
        yield toolUse as any;
        content.push(toolUse);
      }
    }
  }

  return {
    message: {
      role: 'assistant',
      content,
    } as any,
    uuid: 'uuid_not_used',
  } as any;
}

export function getCacheControl(options: any = {}) {
  return { type: 'ephemeral', ttl: '1h', scope: options.scope };
}

export function getAPIMetadata() {
  return { user_id: 'gemini_user' };
}

export async function verifyApiKey(apiKey: string, isNonInteractive: boolean) {
  if (isNonInteractive) return true;
  if (!apiKey || apiKey.trim() === '') return false;
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    await model.generateContent("hello");
    return true;
  } catch (e) {
    return false;
  }
}

export function updateUsage(usage: any, partUsage: any) {
  if (!partUsage) return { ...usage };
  return {
    input_tokens: (usage?.input_tokens || 0) + (partUsage?.input_tokens || 0),
    output_tokens: (usage?.output_tokens || 0) + (partUsage?.output_tokens || 0),
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    server_tool_use: usage?.server_tool_use || {},
    service_tier: usage?.service_tier,
    cache_creation: usage?.cache_creation || {},
    inference_geo: usage?.inference_geo,
    iterations: usage?.iterations,
    speed: usage?.speed,
  };
}

export function accumulateUsage(totalUsage: any, messageUsage: any) {
  return {
    input_tokens: (totalUsage?.input_tokens || 0) + (messageUsage?.input_tokens || 0),
    output_tokens: (totalUsage?.output_tokens || 0) + (messageUsage?.output_tokens || 0),
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    server_tool_use: totalUsage?.server_tool_use || {},
    service_tier: totalUsage?.service_tier,
    cache_creation: totalUsage?.cache_creation || {},
    inference_geo: totalUsage?.inference_geo,
    iterations: totalUsage?.iterations,
    speed: totalUsage?.speed,
  };
}

export async function* queryModelWithStreaming(options: any) {
  const tools = options.tools || [];
  const geminiTools = tools.length > 0 ? [{ functionDeclarations: convertToGeminiTools(tools) }] : undefined;

  const generativeModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    tools: geminiTools as any,
    systemInstruction: {
      role: 'system',
      parts: [{ text: Array.isArray(options.systemPrompt) ? options.systemPrompt.join('\n') : options.systemPrompt as unknown as string }],
    },
  });

  const result = await generativeModel.generateContentStream({
    contents: convertToGeminiMessages(options.messages),
  });

  const content: any[] = [];
  
  for await (const chunk of result.stream) {
    const parts = chunk.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.text) {
        yield { type: 'text', text: part.text } as any;
        if (content.length > 0 && content[content.length - 1].type === 'text') {
          content[content.length - 1].text += part.text;
        } else {
          content.push({ type: 'text', text: part.text });
        }
      } else if (part.functionCall) {
        const toolUse = {
          type: 'tool_use',
          id: `call_${Math.random().toString(36).substring(7)}`,
          name: part.functionCall.name,
          input: part.functionCall.args,
        };
        yield toolUse as any;
        content.push(toolUse);
      }
    }
  }

  return {
    message: {
      role: 'assistant',
      content,
    } as any,
    uuid: 'uuid_not_used',
  } as any;
}
