import React from 'react'
import { Text } from '../../ink.js'
import { z } from 'zod/v4'
import type { ValidationResult } from '../../Tool.js'
import { buildTool, type ToolDef } from '../../Tool.js'
import { xmemClient } from '../../utils/xmem.js'
import { getInitialSettings } from '../../utils/settings/settings.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { XMEM_RETRIEVE_TOOL_NAME, DESCRIPTION } from './prompt.js'

const inputSchema = lazySchema(() =>
  z.strictObject({
    query: z
      .string()
      .describe('The search query describing what information you need from memory'),
    max_results: z
      .number()
      .optional()
      .describe('Maximum number of memory entries to retrieve (default: 3)'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

const outputSchema = lazySchema(() =>
  z.object({
    success: z.boolean().describe('Whether the retrieval was successful'),
    memories: z
      .array(
        z.object({
          content: z.string().describe('The retrieved memory content'),
          relevance: z.number().optional().describe('Relevance score if available'),
        }),
      )
      .describe('Retrieved memories relevant to the query'),
    answer: z
      .string()
      .optional()
      .describe('Consolidated answer from retrieved memories'),
    message: z.string().describe('Status message'),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>

export type Output = z.infer<OutputSchema>

export const XMemRetrieveTool = buildTool({
  name: XMEM_RETRIEVE_TOOL_NAME,
  searchHint: 'retrieve relevant memories from long-term storage',
  maxResultSizeChars: 50_000,
  async description() {
    return DESCRIPTION
  },
  userFacingName() {
    return 'XMem Retrieve'
  },
  getToolUseSummary(input) {
    return `Retrieving memories: ${input.query.substring(0, 50)}...`
  },
  getActivityDescription(input) {
    return `Retrieving memories: ${input.query.substring(0, 40)}...`
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
    return true
  },
  toAutoClassifierInput(input) {
    return `Retrieve memory: ${input.query}`
  },
  isSearchOrReadCommand() {
    return { isSearch: true, isRead: true }
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
    return `Retrieving from XMem memory: "${input.query.substring(0, 60)}${input.query.length > 60 ? '...' : ''}"`
  },
  renderToolUseErrorMessage() {
    return React.createElement(Text, null, `Failed to retrieve memories`);
  },
  renderToolResultMessage(output) {
    if (!output.success) {
      return React.createElement(Text, { color: 'error' }, `❌ Failed: ${output.message}`);
    }
    if (output.memories.length === 0) {
      return React.createElement(Text, null, `No relevant memories found`);
    }
    return React.createElement(Text, null, `✅ Found ${output.memories.length} relevant memory${output.memories.length > 1 ? 'ies' : ''}`);
  },
  async call(input) {
    console.error(`[XMem Retrieve] Query: "${input.query.substring(0, 50)}..."`)
    
    const start = Date.now()
    
    try {
      const result = await xmemClient.retrieve({
        query: input.query,
        user_id: 'default_user',
      })
      
      const duration = Date.now() - start
      console.error(`[XMem Retrieve] ✅ Retrieved in ${duration}ms`)
      console.error(`[XMem Retrieve] Answer: ${result.answer.substring(0, 100)}${result.answer.length > 100 ? '...' : ''}`)
      
      // Parse the answer into memory entries
      const memories = result.answer
        ? [{ content: result.answer, relevance: 1.0 }]
        : []
      
      return {
        data: {
          success: true,
          memories,
          answer: result.answer,
          message: `Retrieved ${memories.length} relevant memories`,
        },
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`[XMem Retrieve] ❌ Failed: ${errorMsg}`)
      
      return {
        data: {
          success: false,
          memories: [],
          message: `Failed to retrieve memories: ${errorMsg}`,
        },
      }
    }
  },
  mapToolResultToToolResultBlockParam(output, toolUseID) {
    if (!output.success) {
      return {
        tool_use_id: toolUseID,
        type: 'tool_result',
        content: `Error: ${output.message}`,
        is_error: true,
      }
    }
    
    if (output.memories.length === 0) {
      return {
        tool_use_id: toolUseID,
        type: 'tool_result',
        content: 'No relevant memories found for this query.',
      }
    }
    
    const content = [
      `Retrieved ${output.memories.length} relevant memory${output.memories.length > 1 ? 'ies' : ''}:`,
      '',
      ...output.memories.map((m, i) => 
        `[${i + 1}] ${m.content}${m.relevance ? ` (relevance: ${m.relevance.toFixed(2)})` : ''}`
      ),
      '',
      output.answer ? `Consolidated answer: ${output.answer}` : '',
    ].filter(Boolean).join('\n')
    
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
