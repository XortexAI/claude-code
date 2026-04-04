import React from 'react'
import { Text } from '../../ink.js'
import { z } from 'zod/v4'
import type { ValidationResult } from '../../Tool.js'
import { buildTool, type ToolDef } from '../../Tool.js'
import { xmemClient } from '../../utils/xmem.js'
import { getInitialSettings } from '../../utils/settings/settings.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { XMEM_SEARCH_TOOL_NAME, DESCRIPTION } from './prompt.js'

const inputSchema = lazySchema(() =>
  z.strictObject({
    query: z
      .string()
      .describe('The search query to find specific memories'),
    limit: z
      .number()
      .optional()
      .describe('Maximum results to return (default: 10)'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

const outputSchema = lazySchema(() =>
  z.object({
    success: z.boolean().describe('Whether the search was successful'),
    results: z
      .array(
        z.object({
          content: z.string().describe('The memory content'),
          score: z.number().optional().describe('Search relevance score'),
        }),
      )
      .describe('Search results matching the query'),
    count: z.number().describe('Total number of results found'),
    message: z.string().describe('Status message'),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>

export type Output = z.infer<OutputSchema>

export const XMemSearchTool = buildTool({
  name: XMEM_SEARCH_TOOL_NAME,
  searchHint: 'search through stored memories',
  maxResultSizeChars: 100_000,
  async description() {
    return DESCRIPTION
  },
  userFacingName() {
    return 'XMem Search'
  },
  getToolUseSummary(input) {
    return `Searching memories: ${input.query.substring(0, 50)}...`
  },
  getActivityDescription(input) {
    return `Searching memories: ${input.query.substring(0, 40)}...`
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
    return `Search memory: ${input.query}`
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
    return `Searching XMem memory: "${input.query.substring(0, 60)}${input.query.length > 60 ? '...' : ''}"`
  },
  renderToolUseErrorMessage() {
    return React.createElement(Text, null, `Failed to search memories`);
  },
  renderToolResultMessage(output) {
    if (!output.success) {
      return React.createElement(Text, { color: 'error' }, `❌ Failed: ${output.message}`);
    }
    if (output.count === 0) {
      return React.createElement(Text, null, `No memories found matching the query`);
    }
    return React.createElement(Text, null, `✅ Found ${output.count} memory result${output.count > 1 ? 's' : ''}`);
  },
  async call(input) {
    console.error(`[XMem Search] Query: "${input.query.substring(0, 50)}..."`)
    
    const start = Date.now()
    
    try {
      const result = await xmemClient.search({
        query: input.query,
        user_id: 'default_user',
      })
      
      const duration = Date.now() - start
      console.error(`[XMem Search] ✅ Found ${result.results.length} results in ${duration}ms`)
      
      return {
        data: {
          success: true,
          results: result.results.map(r => ({
            content: r.content,
            score: r.score,
          })),
          count: result.results.length,
          message: `Found ${result.results.length} memories`,
        },
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`[XMem Search] ❌ Failed: ${errorMsg}`)
      
      return {
        data: {
          success: false,
          results: [],
          count: 0,
          message: `Failed to search memories: ${errorMsg}`,
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
    
    if (output.count === 0) {
      return {
        tool_use_id: toolUseID,
        type: 'tool_result',
        content: 'No memories found matching this search query.',
      }
    }
    
    const content = [
      `Found ${output.count} memory result${output.count > 1 ? 's' : ''}:`,
      '',
      ...output.results.map((r, i) => {
        const prefix = `[${i + 1}]`
        const score = r.score ? ` (score: ${r.score.toFixed(2)})` : ''
        return `${prefix}${score} ${r.content}`
      }),
    ].join('\n')
    
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
