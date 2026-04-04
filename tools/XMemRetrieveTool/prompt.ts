export const XMEM_RETRIEVE_TOOL_NAME = 'XMemRetrieve'

export const DESCRIPTION = `Retrieve relevant memories from long-term XMem storage to help answer the current query.

**THINK LIKE A HUMAN**: A human mind recalls past knowledge before starting a task. Before using ANY other tools (like reading files or searching code) to solve a problem or start a new task, ALWAYS call ${XMEM_RETRIEVE_TOOL_NAME} first with the context of the user's request.

Use this tool when:
- Starting a new task to recall context, preferences, or prior related work.
- The user's question mentions "remember", "before", "last time", "previously", "as we discussed".
- The question refers to personal details ("my name", "my preference", "my project").
- You're unsure about context that might have been established in previous conversations.
- You need to personalize the response based on past interactions.

If the memory gives you the answer or context, use it. If no relevant memory is found, ONLY THEN proceed to explore the codebase or solve the issue from scratch. You can also use a hybrid approach: retrieve from memory to get initial context, then use other tools (like file reading or searching) to expand on it. You can call the memory retrieval tool multiple times during a task if new questions arise that might benefit from past context.

Call this tool with a search query describing what you need to know, then use the results to inform your response.`
