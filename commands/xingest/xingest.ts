import type { LocalCommandResult, LocalCommand } from '../../types/command.js'
import { xmemClient } from '../../utils/xmem.js'
import { getInitialSettings } from '../../utils/settings/settings.js'
import type { Message } from '../../types/message.js'

function isModelVisibleMessage(message: Message): boolean {
  return message.type === 'user' || message.type === 'assistant'
}

export const call: LocalCommand<never>['call'] = async (
  args: string,
  context
): Promise<LocalCommandResult> => {
  console.error('[XMem] /xingest command triggered')

  // Check if XMem is enabled
  const settings = getInitialSettings()
  if (!settings.xmemMemoryEnabled) {
    console.error('[XMem] XMem Memory is disabled. Enable it with /memory')
    return {
      type: 'text',
      value: '❌ XMem Memory is disabled. Enable it first with /memory command.',
    }
  }

  // Get messages from context
  const messages = context.messages

  if (!messages || messages.length === 0) {
    console.error('[XMem] No messages to ingest')
    return {
      type: 'text',
      value: '❌ No conversation messages found to ingest.',
    }
  }

  // Filter to only model-visible messages
  const visibleMessages = messages.filter(isModelVisibleMessage)
  
  console.error(`[XMem] Processing ${visibleMessages.length} visible messages`)

  if (visibleMessages.length === 0) {
    return {
      type: 'text',
      value: '❌ No visible conversation messages found to ingest.',
    }
  }

  // Build user query and agent response from the conversation
  let userQuery = ''
  let agentResponse = ''

  for (const msg of visibleMessages) {
    if (msg.type === 'user') {
      const content = msg.message.content
      const text = typeof content === 'string' 
        ? content 
        : (Array.isArray(content) 
            ? content.map(c => c.type === 'text' ? c.text : '').join('\n') 
            : '')
      userQuery += text + '\n'
    } else if (msg.type === 'assistant') {
      const content = msg.message.content
      const text = typeof content === 'string' 
        ? content 
        : (Array.isArray(content) 
            ? content.map(c => c.type === 'text' ? c.text : '').join('\n') 
            : '')
      agentResponse += text + '\n'
    }
  }

  console.error(`[XMem] Ingesting - User query length: ${userQuery.length}, Agent response length: ${agentResponse.length}`)

  try {
    // Call XMem ingest API
    await xmemClient.ingest({
      user_query: userQuery.trim() || 'No user query',
      agent_response: agentResponse.trim() || 'No agent response',
      user_id: 'default_user'
    })

    console.error('[XMem] ✅ Successfully ingested to XMem')

    return {
      type: 'text',
      value: `✅ Successfully ingested ${visibleMessages.length} messages to XMem memory.\n\nUser query preview: ${userQuery.substring(0, 100)}${userQuery.length > 100 ? '...' : ''}`,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[XMem] ❌ Ingest failed: ${errorMsg}`)
    
    return {
      type: 'text',
      value: `❌ Failed to ingest to XMem: ${errorMsg}`,
    }
  }
}
