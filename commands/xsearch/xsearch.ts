import type { LocalCommandResult, LocalCommand } from '../../types/command.js'
import { xmemClient } from '../../utils/xmem.js'
import { getInitialSettings } from '../../utils/settings/settings.js'

export const call: LocalCommand<never>['call'] = async (
  args: string,
  context
): Promise<LocalCommandResult> => {
  console.error('[XMem] /xsearch command triggered')

  // Check if XMem is enabled
  const settings = getInitialSettings()
  if (!settings.xmemMemoryEnabled) {
    console.error('[XMem] XMem Memory is disabled. Enable it with /memory')
    return {
      type: 'text',
      value: '❌ XMem Memory is disabled. Enable it first with /memory command.',
    }
  }

  // Get the query from args
  const query = args.trim()

  if (!query) {
    return {
      type: 'text',
      value: 'Usage: /xsearch <your search query>\nExample: /xsearch what was the user name?',
    }
  }

  console.error(`[XMem] Searching with query: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`)

  try {
    // Call XMem retrieve API
    const result = await xmemClient.retrieve({
      query: query,
      user_id: 'default_user'
    })

    console.error(`[XMem] ✅ Successfully retrieved memory`)
    console.error(`[XMem] Retrieved answer: ${result.answer.substring(0, 100)}${result.answer.length > 100 ? '...' : ''}`)

    // Append to system message if appendSystemMessage is available
    if (context.appendSystemMessage) {
      context.appendSystemMessage({
        role: 'system',
        content: `## XMem Context (Retrieved Memory)\n\nQuery: "${query}"\n\nRetrieved Information:\n${result.answer}`,
      })
    }

    return {
      type: 'text',
      value: `✅ Successfully retrieved from XMem memory.\n\nQuery: "${query}"\n\nRetrieved Context:\n${result.answer}`,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[XMem] ❌ Search failed: ${errorMsg}`)
    
    return {
      type: 'text',
      value: `❌ Failed to search XMem: ${errorMsg}`,
    }
  }
}
