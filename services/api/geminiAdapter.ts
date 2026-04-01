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
  return messages.map((msg) => {
    const role = msg.role === 'assistant' ? 'model' : 'user';
    const parts: Part[] = [];

    // Assuming msg.content is an array of Anthropic-style blocks
    if (Array.isArray(msg.content)) {
      for (const block of msg.content as any[]) {
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
    } else if (typeof msg.content === 'string') {
      parts.push({ text: msg.content });
    }

    return { role, parts };
  });
}
