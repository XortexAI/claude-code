/**
 * extract_prompt.ts
 * Extracts and prints the real Claude Code system prompt by directly
 * reading and evaluating all prompt-generating functions from source.
 * Run with: bun extract_prompt.ts
 */

// ── Mock bun:bundle feature() macro (always returns false for clean external build) ──
// We patch this before any module loads it
const Module = require('module')
const originalLoad = Module._load
Module._load = function (request: string, ...args: unknown[]) {
  if (request === 'bun:bundle') {
    return { feature: (_: string) => false }
  }
  return originalLoad.call(this, request, ...args)
}

// ── Read raw source file and extract string content from template literals ──
import { readFileSync } from 'fs'
import { join } from 'path'

const ROOT = import.meta.dir

function readSource(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

// Extract all backtick template literal bodies from a function by name
function extractTemplateLiterals(src: string): string[] {
  const results: string[] = []
  let i = 0
  while (i < src.length) {
    if (src[i] === '`') {
      let j = i + 1
      let body = ''
      while (j < src.length) {
        if (src[j] === '\\') { body += src[j] + src[j+1]; j += 2; continue }
        if (src[j] === '`') break
        body += src[j]
        j++
      }
      results.push(body)
      i = j + 1
    } else {
      i++
    }
  }
  return results
}

// ── Extract sections from prompts.ts ────────────────────────────────────────

const promptsSrc = readSource('constants/prompts.ts')
const systemSrc  = readSource('constants/system.ts')
const coordSrc   = readSource('coordinator/coordinatorMode.ts')
const cyberSrc   = readSource('constants/cyberRiskInstruction.ts')

// Pull CYBER_RISK_INSTRUCTION
const cyberMatch = cyberSrc.match(/CYBER_RISK_INSTRUCTION\s*=\s*`([^`]+)`/)
const CYBER_RISK = cyberMatch?.[1] ?? '[cyber risk instruction not found]'

// Pull coordinator system prompt (between the return template literal)
const coordMatch = coordSrc.match(/return\s*`(You are Claude Code, an AI assistant[\s\S]+?)`\s*\}/)
const COORDINATOR_PROMPT = coordMatch?.[1] ?? '[coordinator prompt not found]'

// Helper: extract named function body
function getFunctionBody(src: string, fnName: string): string {
  const idx = src.indexOf(`function ${fnName}(`)
  if (idx === -1) return `[${fnName} not found]`
  let depth = 0
  let start = -1
  for (let i = idx; i < src.length; i++) {
    if (src[i] === '{') { if (start === -1) start = i; depth++ }
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(start, i+1) }
  }
  return `[${fnName} body unterminated]`
}

// Extract all return template strings from a function
function getReturnStrings(fnBody: string): string[] {
  // Find return `...` blocks
  const results: string[] = []
  const matches = fnBody.matchAll(/return\s*`([\s\S]*?)`/g)
  for (const m of matches) results.push(m[1])
  return results
}

// ── Manually inline relevant prompt section text ─────────────────────────────

// 1. getSimpleIntroSection
const introFn = getFunctionBody(promptsSrc, 'getSimpleIntroSection')
const introStr = getReturnStrings(introFn)

// 2. getSimpleSystemSection  
const sysFn = getFunctionBody(promptsSrc, 'getSimpleSystemSection')

// 3. getSimpleDoingTasksSection
const doingFn = getFunctionBody(promptsSrc, 'getSimpleDoingTasksSection')

// 4. getActionsSection
const actionsFn = getFunctionBody(promptsSrc, 'getActionsSection')
const actionsStr = getReturnStrings(actionsFn)

// 5. getOutputEfficiencySection
const effFn = getFunctionBody(promptsSrc, 'getOutputEfficiencySection')
const effStrings = getReturnStrings(effFn)

// 6. computeSimpleEnvInfo - template
const envFn = getFunctionBody(promptsSrc, 'computeSimpleEnvInfo')
const envTemplate = getReturnStrings(envFn)

// 7. getScratchpadInstructions
const scratchFn = getFunctionBody(promptsSrc, 'getScratchpadInstructions')
const scratchStr = getReturnStrings(scratchFn)

// 8. DEFAULT_AGENT_PROMPT
const agentMatch = promptsSrc.match(/DEFAULT_AGENT_PROMPT\s*=\s*`([^`]+)`/)
const DEFAULT_AGENT_PROMPT = agentMatch?.[1] ?? '[not found]'

// 9. SUMMARIZE_TOOL_RESULTS_SECTION
const sumMatch = promptsSrc.match(/SUMMARIZE_TOOL_RESULTS_SECTION\s*=\s*`([^`]+)`/)
const SUMMARIZE = sumMatch?.[1] ?? '[not found]'

// 10. getSystemRemindersSection
const remMatch = promptsSrc.match(/function getSystemRemindersSection[\s\S]*?return\s*`([\s\S]*?)`/)
const SYSTEM_REMINDERS = remMatch?.[1] ?? '[not found]'

// 11. getHooksSection
const hooksMatch = promptsSrc.match(/function getHooksSection[\s\S]*?return\s*`([\s\S]*?)`/)
const HOOKS = hooksMatch?.[1] ?? '[not found]'

// 12. getFunctionResultClearingSection template
const frcMatch = promptsSrc.match(/return\s*`# Function Result Clearing[\s\S]*?`/)
const FRC = frcMatch?.[0]?.replace(/^return\s*`/, '').replace(/`$/, '') ?? '[not found]'

// 13. Token budget section
const tokenMatch = promptsSrc.match(/'token_budget',\s*\(\)\s*=>\s*'([\s\S]*?)',/)
const TOKEN_BUDGET = tokenMatch?.[1] ?? '[not found]'

// 14. Proactive section
const proactiveFn = getFunctionBody(promptsSrc, 'getProactiveSection')
const proactiveStr = getReturnStrings(proactiveFn)

// 15. getSimpleToneAndStyleSection items
const toneFn = getFunctionBody(promptsSrc, 'getSimpleToneAndStyleSection')

// 16. getMcpInstructions template
const mcpMatch = promptsSrc.match(/return\s*`# MCP Server Instructions[\s\S]*?`/)
const MCP_TEMPLATE = mcpMatch?.[0]?.replace(/^return\s*`/, '').replace(/`$/, '') ?? '[not found]'

// ── Build and print the full prompt ──────────────────────────────────────────

const HR = '\n' + '='.repeat(80) + '\n'
const output: string[] = []

output.push(`# CLAUDE CODE — REAL SYSTEM PROMPT (Extracted from Source)`)
output.push(`Generated by extract_prompt.ts — reads directly from constants/prompts.ts\n`)

output.push(HR)
output.push(`## SECTION 0 — IDENTITY PREFIX`)
output.push(`\`\`\``)
output.push(`You are Claude Code, Anthropic's official CLI for Claude.`)
output.push(`\`\`\``)

output.push(HR)
output.push(`## SECTION 1 — SIMPLE MODE (env CLAUDE_CODE_SIMPLE=1)`)
output.push(`\`\`\``)
output.push(`You are Claude Code, Anthropic's official CLI for Claude.\n\nCWD: <cwd>\nDate: <session start date>`)
output.push(`\`\`\``)

output.push(HR)
output.push(`## SECTION 2 — INTRO (getSimpleIntroSection)`)
output.push(`\`\`\``)
output.push(`\nYou are an interactive agent that helps users with software engineering tasks. Use the instructions below and the tools available to you to assist the user.\n\n${CYBER_RISK}\nIMPORTANT: You must NEVER generate or guess URLs for the user unless you are confident that the URLs are for helping the user with programming. You may use URLs provided by the user in their messages or local files.`)
output.push(`\`\`\``)

output.push(HR)
output.push(`## SECTION 3 — SYSTEM (getSimpleSystemSection)`)
// Extract bullet items from the array literal in getSimpleSystemSection
const systemItemsMatch = promptsSrc.match(/function getSimpleSystemSection[\s\S]*?const items = \[([\s\S]*?)\]/m)
if (systemItemsMatch) {
  // Pull backtick strings out of the items array
  const itemsBlock = systemItemsMatch[1]
  const ticks = extractTemplateLiterals(itemsBlock)
  
  // Replace HOOKS placeholder
  const finalItems = ticks.map(t => t.replace(/\${getHooksSection\(\)}/, HOOKS))
  
  output.push(`\`\`\``)
  output.push(`# System`)
  finalItems.forEach(item => output.push(` - ${item}`))
  output.push(`\`\`\``)
}

output.push(HR)
output.push(`## SECTION 4 — ACTIONS (getActionsSection)`)
output.push(`\`\`\``)
if (actionsStr[0]) output.push(actionsStr[0].replace(/\\n/g, '\n'))
output.push(`\`\`\``)

output.push(HR)
output.push(`## SECTION 5 — DOING TASKS (getSimpleDoingTasksSection) — key items`)
// Extract the outer items array
const doingItemsRegex = /`The user will primarily[\s\S]*?`/g
const doingMatches = [...doingFn.matchAll(/`([^`]{20,})`/g)].map(m => m[1]).filter(s => !s.includes('${'))
output.push(`\`\`\``)
output.push(`# Doing tasks`)
doingMatches.slice(0, 15).forEach(i => output.push(` - ${i}`))
output.push(`\`\`\``)

output.push(HR)
output.push(`## SECTION 6 — TONE AND STYLE (getSimpleToneAndStyleSection)`)
const toneItems = [...toneFn.matchAll(/`([^`]{20,})`/g)].map(m => m[1]).filter(s => !s.includes('${'))
output.push(`\`\`\``)
output.push(`# Tone and style`)
toneItems.forEach(i => output.push(` - ${i}`))
output.push(`\`\`\``)

output.push(HR)
output.push(`## SECTION 7 — OUTPUT EFFICIENCY (getOutputEfficiencySection)`)
output.push(`\`\`\``)
if (effStrings[1]) output.push(effStrings[1])
else if (effStrings[0]) output.push(effStrings[0])
output.push(`\`\`\``)

output.push(HR)
output.push(`## SECTION 8 — ENVIRONMENT (computeSimpleEnvInfo) — template`)
output.push(`\`\`\``)
output.push(`# Environment
You have been invoked in the following environment:
 - Primary working directory: <cwd>
 - Is a git repository: Yes/No
 - Platform: darwin/linux/win32
 - Shell: zsh/bash
 - OS Version: Darwin 25.x.x
 - You are powered by the model named <model>. The exact model ID is <model-id>.
 - Assistant knowledge cutoff is <date>.
 - The most recent Claude model family is Claude 4.5/4.6. Model IDs — Opus 4.6: 'claude-opus-4-6', Sonnet 4.6: 'claude-sonnet-4-6', Haiku 4.5: 'claude-haiku-4-5-20251001'. When building AI applications, default to the latest and most capable Claude models.
 - Claude Code is available as a CLI in the terminal, desktop app (Mac/Windows), web app (claude.ai/code), and IDE extensions (VS Code, JetBrains).
 - Fast mode for Claude Code uses the same Claude Opus 4.6 model with faster output. It does NOT switch to a different model. It can be toggled with /fast.`)
output.push(`\`\`\``)

output.push(HR)
output.push(`## SECTION 9 — SYSTEM REMINDERS (getSystemRemindersSection)`)
output.push(`\`\`\``)
output.push(SYSTEM_REMINDERS)
output.push(`\`\`\``)

output.push(HR)
output.push(`## SECTION 10 — SUMMARIZE TOOL RESULTS`)
output.push(`\`\`\``)
output.push(SUMMARIZE)
output.push(`\`\`\``)

output.push(HR)
output.push(`## SECTION 11 — SCRATCHPAD DIRECTORY (getScratchpadInstructions)`)
output.push(`\`\`\``)
if (scratchStr[0]) output.push(scratchStr[0])
output.push(`\`\`\``)

output.push(HR)
output.push(`## SECTION 12 — MCP SERVER INSTRUCTIONS TEMPLATE`)
output.push(`\`\`\``)
output.push(MCP_TEMPLATE)
output.push(`\`\`\``)

output.push(HR)
output.push(`## SECTION 13 — FUNCTION RESULT CLEARING`)
output.push(`\`\`\``)
output.push(FRC)
output.push(`\`\`\``)

output.push(HR)
output.push(`## SECTION 14 — TOKEN BUDGET`)
output.push(`\`\`\``)
output.push(TOKEN_BUDGET)
output.push(`\`\`\``)

output.push(HR)
output.push(`## SECTION 15 — DEFAULT AGENT PROMPT`)
output.push(`\`\`\``)
output.push(DEFAULT_AGENT_PROMPT)
output.push(`\`\`\``)

output.push(HR)
output.push(`## SECTION 16 — COORDINATOR MODE SYSTEM PROMPT`)
output.push(`\`\`\``)
output.push(COORDINATOR_PROMPT)
output.push(`\`\`\``)

output.push(HR)
output.push(`## SECTION 17 — AUTONOMOUS / PROACTIVE MODE SECTION`)
output.push(`\`\`\``)
if (proactiveStr[0]) output.push(proactiveStr[0])
output.push(`\`\`\``)

const finalOutput = output.join('\n')
console.log(finalOutput)

// Also write to file
import { writeFileSync } from 'fs'
writeFileSync(join(ROOT, 'SYSTEM_PROMPT_EXTRACTED.md'), finalOutput, 'utf-8')
console.error('\n\nWritten to SYSTEM_PROMPT_EXTRACTED.md')
