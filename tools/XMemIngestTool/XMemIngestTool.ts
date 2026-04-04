import React from 'react'
import { Text } from '../../ink.js'
import { z } from 'zod/v4'
import type { ValidationResult } from '../../Tool.js'
import { buildTool, type ToolDef } from '../../Tool.js'
import { xmemClient } from '../../utils/xmem.js'
import { getInitialSettings } from '../../utils/settings/settings.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { XMEM_INGEST_TOOL_NAME, DESCRIPTION } from './prompt.js'

const inputSchema = lazySchema(() =>
  z.strictObject({
    user_query: z
      .string()
      .describe('The user message or question that led to this memory being saved'),
    agent_response: z
      .string()
      .describe('Your response or the information being remembered'),
    importance: z
      .enum(['high', 'medium', 'low'])
      .optional()
      .describe('How important this memory is (default: medium)'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

const outputSchema = lazySchema(() =>
  z.object({
    success: z.boolean().describe('Whether the memory was saved successfully'),
    memoryId: z.string().optional().describe('ID of the saved memory if successful'),
    message: z.string().describe('Status message'),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>

export type Output = z.infer<OutputSchema>

export const XMemIngestTool = buildTool({
  name: XMEM_INGEST_TOOL_NAME,
  searchHint: 'save information to long-term memory',
  maxResultSizeChars: 10_000,
  async description() {
    return DESCRIPTION
  },
  userFacingName() {
    return 'XMem Ingest'
  },
  getToolUseSummary(input) {
    return `Saving to memory: ${input.user_query.substring(0, 50)}...`
  },
  getActivityDescription(input) {
    return `Saving memory: ${input.user_query.substring(0, 40)}...`
  },
  get inputSchema(): InputSchema {
    return inputSchema()
  },
  get outputSchema(): OutputSchema {
    return outputSchema()
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return false
  },
  toAutoClassifierInput(input) {
    return `Save to memory: ${input.user_query}`
  },
  isSearchOrReadCommand() {
    return { isSearch: false, isRead: false }
  },
  async validateInput(): Promise<ValidationResult> {
    // Check if XMem is enabled
    const settings = getInitialSettings()
    if (!settings.xmemMemoryEnabled) {
      return {
        result: false,
        message: 'XMem Memory is disabled. Enable it with /memory command first.',
        errorCode: 1,
      }
    }
    return { result: true }
  },
  async prompt() {
    return DESCRIPTION
  },
  renderToolUseMessage(input) {
    return `Saving to XMem memory: "${input.user_query.substring(0, 60)}${input.user_query.length > 60 ? '...' : ''}"`
  },
  renderToolUseErrorMessage() {
    return React.createElement(Text, null, `Failed to save to memory`);
  },
  renderToolResultMessage(output) {
    if (output.success) {
      return React.createElement(Text, null, `✅ Memory saved successfully${output.memoryId ? ` (ID: ${output.memoryId})` : ''}`);
    }
    return React.createElement(Text, { color: 'error' }, `❌ Failed to save memory: ${output.message}`);
  },
  async call(input, { getAppState }) {
    console.error(`[XMem Ingest] Saving memory: "${input.user_query.substring(0, 50)}..."`)
    
    const start = Date.now()
    
    try {
      await xmemClient.ingest({
        user_query: input.user_query,
        agent_response: input.agent_response,
        user_id: 'default_user',
      })
      
      const duration = Date.now() - start
      console.error(`[XMem Ingest] ✅ Successfully saved in ${duration}ms`)
      
      return {
        data: {
          success: true,
          memoryId: undefined, // XMem doesn't return an ID in current SDK
          message: 'Memory saved successfully',
        },
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`[XMem Ingest] ❌ Failed: ${errorMsg}`)
      
      return {
        data: {
          success: false,
          message: `Failed to save memory: ${errorMsg}`,
        },
      }
    }
  },
  mapToolResultToToolResultBlockParam(output, toolUseID) {
    if (output.success) {
      return {
        tool_use_id: toolUseID,
        type: 'tool_result',
        content: `Memory saved successfully.`,
      }
    }
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: `Error: ${output.message}`,
      is_error: true,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
