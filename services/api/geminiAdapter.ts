import type {
  Content,
  FunctionDeclaration,
  Part,
} from '@google/generative-ai';
import type { Tool } from '../../Tool.js';
import type { Message } from '../../types/message.js';

export function convertToGeminiTools(tools: Tool[]): FunctionDeclaration[] {
  // Add extra tools that might be filtered out but are useful
  const extraTools: FunctionDeclaration[] = [
    { name: 'Glob', description: 'Find files matching a glob pattern like *.ts, **/*.tsx', parameters: { type: 'object', properties: { path: { type: 'string', description: 'Glob pattern' }, exclude: { type: 'string', description: 'Patterns to exclude' } }, required: ['path'] }},
    { name: 'Grep', description: 'Search for text/content in files', parameters: { type: 'object', properties: { pattern: { type: 'string', description: 'Text to search for' }, path: { type: 'string', description: 'File path or glob' }, exclude: { type: 'string', description: 'Patterns to exclude' } }, required: ['pattern'] }},
    { name: 'WebSearch', description: 'Search the web for information', parameters: { type: 'object', properties: { query: { type: 'string', description: 'Search query' } }, required: ['query'] }},
    { name: 'WebFetch', description: 'Fetch content from a URL', parameters: { type: 'object', properties: { url: { type: 'string', description: 'URL to fetch' } }, required: ['url'] }},
  ];
  
  const toolDecls = tools.map((tool) => {
    const desc = typeof tool.description === 'string' ? tool.description : String(tool.description || '');
    
    return {
      name: tool.name,
      description: desc,
      parameters: {
        type: 'object',
        properties: (tool.inputJSONSchema as any)?.properties || {},
        required: (tool.inputJSONSchema as any)?.required || [],
      },
    };
  });
  
  // Combine original tools with extra ones
  return [...toolDecls, ...extraTools];
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
