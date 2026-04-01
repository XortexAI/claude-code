// Stub tool types for SDK

import type { z } from 'zod';
import type { CallToolResult, ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

// Tool definition types
export interface ToolDefinition<T extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  description: string;
  inputSchema: z.ZodObject<T>;
  handler: (args: z.infer<z.ZodObject<T>>, extra: ToolCallExtra) => Promise<CallToolResult>;
  annotations?: ToolAnnotations;
  searchHint?: string;
  alwaysLoad?: boolean;
}

export interface ToolCallExtra {
  sessionId?: string;
  signal?: AbortSignal;
}

// Tool call types
export interface ToolCall {
  id: string;
  name: string;
  input: unknown;
}

export interface ToolResult {
  id: string;
  output: unknown;
  isError?: boolean;
}

// Tool registry
export interface ToolRegistry {
  register<T extends z.ZodRawShape>(tool: ToolDefinition<T>): void;
  unregister(name: string): void;
  get(name: string): ToolDefinition | undefined;
  list(): ToolDefinition[];
}

// Tool execution context
export interface ToolContext {
  sessionId: string;
  workingDir: string;
  abortSignal: AbortSignal;
}

// Tool permission types
export type ToolPermission = 'allow' | 'deny' | 'ask';

export interface ToolPermissionConfig {
  [toolName: string]: ToolPermission;
}

// MCP tool types
export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

export interface McpToolCallRequest {
  method: 'tools/call';
  params: {
    name: string;
    arguments?: Record<string, unknown>;
  };
}

// Legacy types
export type AnyToolDefinition = ToolDefinition<z.ZodRawShape>;

// Internal types
export interface InternalToolCall {
  __type: 'tool_call';
  tool: string;
  input: unknown;
}

export interface InternalToolResult {
  __type: 'tool_result';
  tool: string;
  output: unknown;
  isError: boolean;
}

// Export for backwards compatibility
export type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
