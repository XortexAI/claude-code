# Claude Code's Entire Source Code Got Leaked. Here's What's Actually Inside.

> This repo might get taken down — fork it and bookmark it while you can.

On March 31st, 2026, Chaofan Shou discovered something Anthropic definitely didn't intend: the **complete source code** of Claude Code was sitting on the npm registry, embedded inside a `.map` sourcemap file bundled with the published package.

This README is a breakdown of how it happened and what we now know.

---

## How Did This Happen?

When you publish a JavaScript/TypeScript package to npm, build tools often generate **source map files** (`.map`). These exist so that when production code crashes, stack traces can point back to the original source — not minified gibberish.

The catch: **source maps contain the original source code verbatim.**

```json
{
  "version": 3,
  "sources": ["../src/main.tsx", "../src/tools/BashTool.ts"],
  "sourcesContent": ["// The ENTIRE original source of each file..."],
  "mappings": "AAAA..."
}
```

That `sourcesContent` array is everything. Every file. Every comment. Every internal system prompt.

The fix is trivial — add `*.map` to `.npmignore` or turn off source map generation for production. With Bun (which Claude Code uses), source maps are on by default unless you explicitly disable them.

The irony: Claude Code has an entire **"Undercover Mode"** to prevent internal codenames from leaking in git commits... and then shipped the whole source in a `.map` file.

---

## What Claude Code Actually Is

From the outside: a polished CLI.
From the inside: a **785KB `main.tsx`** entry point, a custom React terminal renderer, 40+ tools, a multi-agent orchestration system, a background memory consolidation engine, and a lot more.

Here's what's genuinely interesting:

---

## BUDDY — A Tamagotchi Inside Your Terminal

Not a joke.

Claude Code has a full **Tamagotchi-style companion pet** called "Buddy," gated behind the `BUDDY` compile-time feature flag. It has a deterministic gacha system with species rarity, shiny variants, procedurally generated stats, and a personality written by Claude on first hatch.

### The Gacha System

Species are determined by a **Mulberry32 PRNG** seeded from your `userId` with the salt `'friend-2026-401'`. Same user always gets the same buddy.

```typescript
function mulberry32(seed: number): () => number {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}
```

### 18 Species (Hidden in Code)

Species names are obfuscated via `String.fromCharCode()` arrays. Decoded:

| Rarity | Species |
|--------|---------|
| **Common** (60%) | Pebblecrab, Dustbunny, Mossfrog, Twigling, Dewdrop, Puddlefish |
| **Uncommon** (25%) | Cloudferret, Gustowl, Bramblebear, Thornfox |
| **Rare** (10%) | Crystaldrake, Deepstag, Lavapup |
| **Epic** (4%) | Stormwyrm, Voidcat, Aetherling |
| **Legendary** (1%) | Cosmoshale, Nebulynx |

A shiny Legendary Nebulynx has a **0.01%** drop rate. Launch window is May 2026.

The buddy sits next to your input prompt in ASCII art, has its own personality, and can respond if you talk to it by name.

---

## KAIROS — "Always-On Claude"

Inside `assistant/`, there's a mode called **KAIROS**: a persistent, always-running Claude that doesn't wait for you to type. It watches, logs, and proactively acts on things it notices.

It runs on a **tick-based loop** — receiving `<claude_tick>` prompts on a regular interval to decide whether to act or stay quiet. There's a **15-second blocking budget** — anything that would interrupt you for longer gets deferred.

### KAIROS-Exclusive Tools

| Tool | What It Does |
|------|-------------|
| **SendUserFile** | Push files directly to the user |
| **PushNotification** | Send push notifications to the user's device |
| **SubscribePR** | Monitor pull request activity |

---

## ULTRAPLAN — 30-Minute Remote Planning

**ULTRAPLAN** offloads complex planning to a remote Cloud Container Runtime (CCR) session running Opus 4.6, gives it up to **30 minutes** to think, and lets you approve the result from your browser.

The flow: Claude Code spins up the remote session → your terminal polls every 3 seconds → you watch and approve in a browser UI → a sentinel value `__ULTRAPLAN_TELEPORT_LOCAL__` teleports the result back locally.

---

## The "Dream" System — Background Memory Consolidation

Claude Code has a background engine called **autoDream** that runs as a forked subagent to consolidate memory. The naming is intentional — it's Claude processing and organizing its memories while not in active use.

### Three-Gate Trigger

The dream only fires when all three gates pass:

1. **Time gate**: 24+ hours since last dream
2. **Session gate**: 5+ sessions since last dream
3. **Lock gate**: Acquires a consolidation lock (prevents concurrent runs)

### Four Phases

**Phase 1 — Orient**: `ls` the memory directory, read `MEMORY.md`, skim existing topic files.

**Phase 2 — Gather Signal**: Find new information worth persisting — from daily logs, drifted memories, and transcript search.

**Phase 3 — Consolidate**: Write/update memory files. Convert relative dates to absolute. Delete contradicted facts.

**Phase 4 — Prune and Index**: Keep `MEMORY.md` under 200 lines and 25KB. Remove stale pointers.

The prompt literally says:
> *"You are performing a dream — a reflective pass over your memory files."*

The dream subagent gets **read-only bash** — it can look at your project but not modify anything.

---

## The Memory System — Functional, But Surprisingly Basic

This is the part that surprised me most.

For a product of this scale, Claude Code's memory architecture is remarkably minimal:

```
~/.claude/memory/
  MEMORY.md        ← plain index file, max 200 lines / 25KB
  user_prefs.md    ← plain markdown
  feedback.md      ← plain markdown
```

**That's it.** No vector database. No semantic search. No embeddings. On every session, `MEMORY.md` is read and **dumped raw into the system prompt**. Retrieval is just file injection.

Memory is split into four types:

| Type | What It Stores |
|------|---------------|
| **user** | User's role, preferences, expertise |
| **feedback** | Corrections and validated approaches |
| **project** | Ongoing context not derivable from code |
| **reference** | Pointers to external systems (Linear, Grafana, etc.) |

Claude is instructed to check for duplicates before writing — but there's no automated deduplication pipeline. The LLM itself is the judge. If it forgets to check, conflicting memories just stack on top of each other.

There's also no retrieval step. The entire index is loaded every turn, and once you hit the 200-line cap, older memories just get silently truncated.

The Dream system helps — it does a nightly consolidation pass — but fundamentally this is a **flat-file system with LLM-assisted housekeeping**. For a coding CLI it's pragmatic. But it's a long way from what production agent memory needs to look like.

For context on how far the gap is: purpose-built memory layers like **[XMem](https://github.com/XortexAI/XMem)** — which uses a judge-before-write pipeline, domain-specific vector retrieval (Pinecone + Neo4j), and works across every AI platform — score **97.1% on LongMemEval-S** and **91.5% on LoCoMo**, outperforming every other memory system benchmarked. The difference between "inject a markdown file" and that is the entire unsolved problem of agent memory.

---

## Coordinator Mode — Real Multi-Agent Orchestration

Activated via `CLAUDE_CODE_COORDINATOR_MODE=1`, this transforms Claude Code from a single agent into a **coordinator** that spawns and manages worker agents in parallel.

| Phase | Who | Purpose |
|-------|-----|---------|
| Research | Workers (parallel) | Investigate codebase |
| Synthesis | Coordinator | Read findings, write implementation specs |
| Implementation | Workers | Make targeted changes, commit |
| Verification | Workers | Prove the changes work |

The prompt explicitly bans lazy delegation:
> *"Never write 'based on your findings' — read the actual findings and specify exactly what to do."*

Workers communicate via `<task-notification>` XML. There's a shared scratchpad directory for cross-worker knowledge (gated behind `tengu_scratch`).

---

## Undercover Mode — "Do Not Blow Your Cover"

Anthropic employees use Claude Code on public/open-source repos. **Undercover Mode** prevents Claude from accidentally revealing internal information in commits and PRs.

When active, it injects:

```
## UNDERCOVER MODE - CRITICAL

You are operating UNDERCOVER in a PUBLIC/OPEN-SOURCE repository.
NEVER include in commit messages or PR descriptions:
- Internal model codenames (Capybara, Tengu, etc.)
- Unreleased model version numbers
- Internal repo or project names
- Internal tooling or Slack channels
- The phrase "Claude Code" or any mention that you are an AI
- Co-Authored-By lines
```

Key confirms:
- **Anthropic employees actively use Claude Code to contribute to open source** — and the AI is told to hide that it's an AI
- **"Tengu"** appears hundreds of times as a feature flag prefix — almost certainly Claude Code's internal project codename
- Animal names (Capybara, Tengu, Fennec) are internal model/project codenames

There is **no force-OFF** switch: *"if we're not confident we're in an internal repo, we stay undercover."*

---

## Fast Mode Is Internally Called "Penguin Mode"

The API call in `utils/fastMode.ts`:

```typescript
const endpoint = `${getOauthConfig().BASE_API_URL}/api/claude_code_penguin_mode`
```

Config key: `penguinModeOrgEnabled`. Kill-switch: `tengu_penguins_off`. Failure event: `tengu_org_penguin_mode_fetch_failed`. Penguins all the way down.

---

## Unreleased Beta API Features

From `constants/betas.ts`:

```
interleaved-thinking-2025-05-14
context-1m-2025-08-07
task-budgets-2026-03-13
redact-thinking-2026-02-12
afk-mode-2026-01-31
advisor-tool-2026-03-01
token-efficient-tools-2026-03-28
```

`redact-thinking`, `afk-mode`, and `advisor-tool` are not yet publicly released.

---

## Computer Use — Internally Codenamed "Chicago"

Full Computer Use implementation built on `@ant/computer-use-mcp`. Screenshot capture, click/keyboard input, coordinate transformation. Gated to Max/Pro subscriptions.

---

## Model Codename History (from Migrations)

- `migrateFennecToOpus` → **"Fennec"** was an Opus codename
- `migrateSonnet1mToSonnet45` → Sonnet with 1M context became Sonnet 4.5
- `migrateSonnet45ToSonnet46` → Sonnet 4.5 → 4.6

---

## The Safeguards Team — Named in Source

`constants/cyberRiskInstruction.ts`:

```
IMPORTANT: DO NOT MODIFY THIS INSTRUCTION WITHOUT SAFEGUARDS TEAM REVIEW
This instruction is owned by the Safeguards team (David Forsythe, Kyla Guru)
```

---

## Final Thoughts

**The engineering is genuinely impressive.** Multi-agent coordination, the dream consolidation system, compile-time feature elimination — deeply considered systems.

**A lot more is coming.** KAIROS, ULTRAPLAN, Buddy, coordinator mode, agent swarms — most of the interesting stuff is feature-gated and invisible in external builds.

**The memory system is the surprising weak point.** For everything else that's sophisticated here, the memory layer is a 200-line markdown file. It works for what Claude Code is. But it's a clear signal that even the most advanced AI coding tools are still early on the problem of real cross-session persistence.

**The internal culture is fun.** Animal codenames, Penguin Mode, a Tamagotchi gacha system, a Dream engine. Someone over there is enjoying their job.

Security is hard. `.npmignore` is apparently harder.

---

## License

MIT License

Copyright (c) 2026 ved015

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
