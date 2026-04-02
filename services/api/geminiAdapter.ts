import type {
  Content,
  FunctionDeclaration,
  Part,
} from '@google/generative-ai';
import type { Tool } from '../../Tool.js';
import type { Message } from '../../types/message.js';
import { zodToJsonSchema } from '../../utils/zodToJsonSchema.js';

export function convertToGeminiTools(tools: Tool[]): FunctionDeclaration[] {
  return tools.map((tool) => {
    const desc = typeof tool.description === 'string'
      ? tool.description
      : (tool.searchHint || (tool.userFacingName ? tool.userFacingName({}) : `A tool for ${tool.name}`));
    
    const jsonSchema: any = 'inputJSONSchema' in tool && tool.inputJSONSchema
      ? tool.inputJSONSchema
      : zodToJsonSchema(tool.inputSchema);
      
    // Strip $schema if it exists, as Gemini might reject it
    const { $schema, ...parameters } = jsonSchema || {};
    
    // Gemini also rejects additionalProperties in objects and propertyNames
    // We need to recursively strip these out
    const cleanSchema = (schema: any): any => {
      if (!schema || typeof schema !== 'object') return schema;
      
      if (Array.isArray(schema)) {
        return schema.map(cleanSchema);
      }
      
      const cleaned: any = {};
      for (const [key, value] of Object.entries(schema)) {
        if (key === 'additionalProperties' || key === 'propertyNames' || key === 'exclusiveMinimum') {
          continue;
        }
        if (key === 'const') {
           // Gemini does not support const, map it to enum
           cleaned['enum'] = [value];
           continue;
        }
        cleaned[key] = cleanSchema(value);
      }
      return cleaned;
    };
    
    return {
      name: tool.name,
      description: desc,
      parameters: cleanSchema(parameters) as any,
    };
  });
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
          const toolName = block.name || 'unknown_tool';
          // Gemini expects args as an object, not a JSON string
          let toolArgs: any = block.input;
          // If input is a string, try to parse it
          if (typeof block.input === 'string') {
            try {
              toolArgs = JSON.parse(block.input);
            } catch {
              toolArgs = { value: block.input };
            }
          }
          parts.push({
            functionCall: {
              name: toolName,
              args: toolArgs || {},
            },
          });
        } else if (block.type === 'tool_result') {
          // Tool result needs name and response - use id if name is missing
          const toolName = block.name || block.id || 'unknown_tool';
          const toolContent = typeof block.content === 'string' ? block.content : JSON.stringify(block.content || '');
          parts.push({
            functionResponse: {
              name: toolName,
              response: { result: toolContent },
            },
          });
        }
      }
    } else if (typeof content === 'string') {
      if (content.trim()) {
        parts.push({ text: content });
      }
    }

    // Only add messages that have content and have valid parts
    // Skip messages that would result in empty parts (which causes Gemini API errors)
    const validParts = parts.filter(p => 
      (p as any).text !== undefined || 
      (p as any).functionCall !== undefined || 
      (p as any).functionResponse !== undefined
    );
    
    if (validParts.length > 0) {
      result.push({ role, parts: validParts });
    }
  }
  
  return result;
}
