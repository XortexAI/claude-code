// Gemini client wrapper that mimics the Anthropic SDK interface
import { GoogleGenerativeAI, type GenerateContentStreamResult } from '@google/generative-ai';
import type { BetaRawMessageStreamEvent, BetaToolUnion, BetaMessageParam } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs';
import type { Stream } from '@anthropic-ai/sdk/streaming.mjs';
import { randomUUID } from 'crypto';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Convert Anthropic tools to Gemini function declarations
function convertTools(tools: BetaToolUnion[] | undefined): any[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  
  return tools.map((tool: any) => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object',
      properties: tool.input_schema?.properties || {},
      required: tool.input_schema?.required || [],
    },
  }));
}

// Convert Anthropic messages to Gemini content format
function convertMessages(messages: BetaMessageParam[]): any[] {
  return messages.map(msg => {
    const role = msg.role === 'assistant' ? 'model' : 'user';
    const parts: any[] = [];

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
              name: block.tool_use_id,
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

// Create a mock stream that converts Gemini stream to Anthropic format
async function* createGeminiStream(
  model: string,
  systemPrompt: string | undefined,
  messages: BetaMessageParam[],
  tools: BetaToolUnion[] | undefined,
  maxTokens: number,
  signal?: AbortSignal
): AsyncGenerator<BetaRawMessageStreamEvent> {
  const geminiTools = convertTools(tools);
  
  const generativeModel = genAI.getGenerativeModel({
    model,
    tools: geminiTools ? [{ functionDeclarations: geminiTools }] : undefined,
    systemInstruction: systemPrompt ? {
      role: 'system',
      parts: [{ text: systemPrompt }],
    } : undefined,
  });

  // Yield message_start
  yield {
    type: 'message_start',
    message: {
      id: `msg_${randomUUID()}`,
      type: 'message',
      role: 'assistant',
      content: [],
      model,
      stop_reason: null,
      stop_sequence: null,
      usage: {
        input_tokens: 0,
        output_tokens: 0,
      },
    },
  };

  const geminiMessages = convertMessages(messages);
  
  try {
    const result = await generativeModel.generateContentStream({
      contents: geminiMessages,
    });

    let contentBlockIndex = 0;
    let hasToolUse = false;
    let accumulatedText = '';

    for await (const chunk of result.stream) {
      if (signal?.aborted) {
        throw new Error('Request was aborted.');
      }

      const parts = chunk.candidates?.[0]?.content?.parts || [];
      
      for (const part of parts) {
        if (part.text) {
          if (contentBlockIndex === 0 && accumulatedText === '') {
            // First text block - yield content_block_start
            yield {
              type: 'content_block_start',
              index: contentBlockIndex,
              content_block: {
                type: 'text',
                text: '',
              },
            };
          }
          
          accumulatedText += part.text;
          
          // Yield text delta
          yield {
            type: 'content_block_delta',
            index: contentBlockIndex,
            delta: {
              type: 'text_delta',
              text: part.text,
            },
          };
        } else if (part.functionCall) {
          hasToolUse = true;
          
          // Yield content_block_start for tool_use
          yield {
            type: 'content_block_start',
            index: contentBlockIndex,
            content_block: {
              type: 'tool_use',
              id: `toolu_${randomUUID()}`,
              name: part.functionCall.name,
              input: {},
            },
          };
          
          // Yield input_json_delta
          const inputJson = JSON.stringify(part.functionCall.args || {});
          yield {
            type: 'content_block_delta',
            index: contentBlockIndex,
            delta: {
              type: 'input_json_delta',
              partial_json: inputJson,
            },
          };
          
          // Yield content_block_stop
          yield {
            type: 'content_block_stop',
            index: contentBlockIndex,
          };
          
          contentBlockIndex++;
        }
      }
    }

    // If we had text content, stop the text block
    if (accumulatedText.length > 0) {
      yield {
        type: 'content_block_stop',
        index: contentBlockIndex,
      };
    }

    // Yield message_delta
    yield {
      type: 'message_delta',
      delta: {
        stop_reason: hasToolUse ? 'tool_use' : 'end_turn',
        stop_sequence: null,
        usage: {
          output_tokens: Math.ceil(accumulatedText.length / 4), // Rough estimate
        },
      },
      usage: {
        output_tokens: Math.ceil(accumulatedText.length / 4),
        input_tokens: 0,
      },
    };

    // Yield message_stop
    yield {
      type: 'message_stop',
    };

  } catch (error) {
    if (signal?.aborted) {
      throw new Error('Request was aborted.');
    }
    throw error;
  }
}

// Mock Anthropic client that uses Gemini
export class GeminiAnthropicClient {
  apiKey: string;
  
  constructor(options: { apiKey: string }) {
    this.apiKey = options.apiKey;
    if (!process.env.GEMINI_API_KEY) {
      process.env.GEMINI_API_KEY = options.apiKey;
    }
  }

  beta = {
    messages: {
      create: async (
        params: {
          model: string;
          max_tokens: number;
          messages: BetaMessageParam[];
          tools?: BetaToolUnion[];
          tool_choice?: any;
          system?: any;
          stream?: boolean;
        },
        options?: { signal?: AbortSignal; headers?: Record<string, string> }
      ): Promise<Stream<BetaRawMessageStreamEvent>> => {
        if (!params.stream) {
          throw new Error('Non-streaming not implemented for Gemini client');
        }

        const systemPrompt = Array.isArray(params.system) 
          ? params.system.map(s => typeof s === 'string' ? s : s.text).join('\n')
          : typeof params.system === 'string' 
            ? params.system 
            : undefined;

        // Map Anthropic model names to Gemini models
        const modelMap: Record<string, string> = {
          'claude-sonnet-4-6': 'gemini-2.5-flash',
          'claude-sonnet-4-6': 'gemini-2.5-flash',
          'claude-3-7-sonnet': 'gemini-2.5-flash',
          'claude-3-5-sonnet': 'gemini-2.5-flash',
          'claude-3-5-haiku': 'gemini-2.5-flash',
          'claude-haiku-4-5': 'gemini-2.5-flash',
          'claude-3-opus': 'gemini-2.5-flash',
          'claude-opus-4': 'gemini-2.5-flash',
        };

        const geminiModel = modelMap[params.model] || 'gemini-2.5-flash';

        const generator = createGeminiStream(
          geminiModel,
          systemPrompt,
          params.messages,
          params.tools,
          params.max_tokens,
          options?.signal
        );

        // Create a stream object compatible with Anthropic SDK
        const stream = {
          [Symbol.asyncIterator]: () => generator,
          controller: {
            abort: () => {
              if (options?.signal) {
                // Signal is already handled in generator
              }
            },
          },
        } as unknown as Stream<BetaRawMessageStreamEvent>;

        return stream;
      },
    },
  };

  messages = this.beta.messages;
}

export default GeminiAnthropicClient;
