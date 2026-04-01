// Stub runtime types for SDK

import type { z } from 'zod';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

// Session types
export interface SDKSession {
  id: string;
  send(message: unknown): Promise<void>;
  close(): Promise<void>;
}

export interface SDKSessionOptions {
  model?: string;
  systemPrompt?: string;
  mcpServers?: McpServerConfig[];
  timeoutMs?: number;
}

export interface McpServerConfig {
  name: string;
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

// Query types
export interface Query {
  [Symbol.asyncIterator](): AsyncIterator<unknown>;
}

export interface InternalQuery extends Query {
  __internal: true;
}

export interface Options {
  model?: string;
  systemPrompt?: string;
  timeoutMs?: number;
  mcpServers?: McpServerConfig[];
}

export interface InternalOptions extends Options {
  __internal?: true;
}

// Zod types
export type AnyZodRawShape = z.ZodRawShape;
export type InferShape<T extends z.ZodRawShape> = z.infer<z.ZodObject<T>>;

// Tool types
export interface SdkMcpToolDefinition<T extends AnyZodRawShape = AnyZodRawShape> {
  name: string;
  description: string;
  inputSchema: T;
  handler: (args: z.infer<z.ZodObject<T>>, extra: unknown) => Promise<unknown>;
  annotations?: unknown;
  searchHint?: string;
  alwaysLoad?: boolean;
}

export interface McpSdkServerConfigWithInstance {
  name: string;
  version: string;
  instance: unknown;
}

// Session options
export interface ListSessionsOptions {
  dir?: string;
  limit?: number;
  offset?: number;
}

export interface GetSessionInfoOptions {
  dir?: string;
}

export interface GetSessionMessagesOptions {
  dir?: string;
  limit?: number;
  offset?: number;
  includeSystemMessages?: boolean;
}

export interface SessionMutationOptions {
  dir?: string;
}

export interface ForkSessionOptions {
  dir?: string;
  upToMessageId?: string;
  title?: string;
}

export interface ForkSessionResult {
  sessionId: string;
}

// Session message types
export interface SessionMessage {
  uuid: string;
  type: 'user' | 'assistant' | 'system';
  content: unknown;
  timestamp: number;
}

// Internal query types
export interface InternalQueryBase {
  prompt: string;
  mcpServers?: McpServerConfig[];
}

// Fork types
export type { ForkSessionResult };

// Callback types
export type OnWriteCallback = (chunk: string) => void | Promise<void>;
export type OnToolUseCallback = (toolUse: unknown) => void | Promise<void>;
export type OnFinishCallback = () => void | Promise<void>;
export type OnErrorCallback = (error: Error) => void | Promise<void>;

// Permission hooks
export interface PermissionHooks {
  onRequest?: (request: unknown) => Promise<boolean>;
  onToolUse?: (toolUse: unknown) => Promise<boolean>;
}

// Server transport
export interface ServerTransport {
  start(): Promise<void>;
  stop(): Promise<void>;
  onMessage(callback: (message: JSONRPCMessage) => void): void;
  send(message: JSONRPCMessage): Promise<void>;
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
