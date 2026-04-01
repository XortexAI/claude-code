import type {
  Content,
  FunctionDeclaration,
  Part,
} from '@google/generative-ai';
import type { Tool } from '../../Tool.js';
import type { Message } from '../../types/message.js';

export function convertToGeminiTools(tools: Tool[]): FunctionDeclaration[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object',
      properties: (tool.inputJSONSchema as any)?.properties || {},
      required: (tool.inputJSONSchema as any)?.required || [],
    },
  }));
}

export function convertToGeminiMessages(messages: Message[]): Content[] {
  const result: Content[] = [];
  
  for (let idx = 0; idx < messages.length; idx++) {
    const msg = messages[idx] as any;
    
    // Handle wrapped message format: {type, message: {role, content}, ...}
    // or direct format: {role, content, ...}
    const innerMsg = msg.message || msg;
    const role = innerMsg.role === 'assistant' ? 'model' : 'user';
    const parts: Part[] = [];
    
    const content = innerMsg.content ?? msg.content;
    
    if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'text') {
          parts.push({ text: block.text });
        } else if (block.type === 'tool_use') {
          parts.push({
            functionCall: {
              name: block.name,
              args: block.input,
            },
          });
        } else if (block.type === 'tool_result') {
          parts.push({
            functionResponse: {
              name: block.name,
              response: { result: block.content },
            },
          });
        }
      }
    } else if (typeof content === 'string') {
      if (content.trim()) {
        parts.push({ text: content });
      }
    }

    // Only add messages that have content
    if (parts.length > 0) {
      result.push({ role, parts });
    }
  }
  
  return result;
}
