> This repo might get taken down fork it and bookmark it while you can.


https://github.com/user-attachments/assets/3d765e7f-7bb0-4ed4-8d9e-68d80796a044


## The Memory System Functional, But Surprisingly Basic

This is the part that surprised us most.
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

Claude is instructed to check for duplicates before writing but there's no automated deduplication pipeline. The LLM itself is the judge. If it forgets to check, conflicting memories just stack on top of each other.
There's also no retrieval step. The entire index is loaded every turn, and once you hit the 200-line cap, older memories just get silently truncated.

For context on how far the gap is: purpose-built memory layers like **[XMem](https://github.com/XortexAI/XMem)** which uses a judge-before-write pipeline, domain-specific vector retrieval (Pinecone + Neo4j), and works across every AI platform score **97.1% on LongMemEval-S** and **91.5% on LoCoMo**, outperforming every other memory system benchmarked. The difference between "inject a markdown file" and that is the entire unsolved problem of agent memory.


