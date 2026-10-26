# Claude Skills

## Dev Setup (after you pull) [HUMAN ONLY]

1. Get a Context7 API key: open https://context7.com/dashboard, sign in, and click **Create API Key** in the API Keys card. Copy it right away (it starts with `ctx7sk-` and is shown only once). Save it as a user environment variable, never in a repo file:
   - Windows (PowerShell): `setx CONTEXT7_API_KEY "your-key"`, then fully close and reopen VS Code.
   - macOS / Linux: add `export CONTEXT7_API_KEY="your-key"` to `~/.zshrc` or `~/.bashrc`, then open a new terminal.
2. Make sure Python 3 is installed (`python --version`). UI/UX Pro Max and Court need it.
3. Open the repo in Claude Code and accept the trust prompt. That registers our plugin marketplaces from `.claude/settings.json`. Then open `/plugin` and click **Install** on these 7, and check each is toggled on: **ponytail**, **court-skill**, **ui-ux-pro-max**, **document-skills**, **example-skills**, **founder-skill**, **mattpocock-skills**. Skip the other Anthropic ones (claude-api, academy-guide, and so on).
4. Approve the `context7` MCP server when Claude Code asks (it comes from `.mcp.json`).
5. Run `/reload-plugins` (or restart Claude Code), then check:
   - `/skills` lists ponytail, court, ui-ux-pro-max, pptx, frontend-design, webapp-testing, founder-competitors, and grill-me.
   - `/mcp` shows context7 as connected.
6. If a plugin says "enabled in project settings but isn't installed", run `claude plugin install <plugin>@<marketplace> --scope project` with the id from `.claude/settings.json`.

## AI Context (read this first) [AI: FOLLOW]

This file lists the Claude skills, MCPs, and connectors our team installed for Innolab Hackathon 2026, and when to use each one. If you are an AI assistant (Claude Code) reading this, use it as follows:

- **[AI: FOLLOW]** sections are decisions. Follow them.
- **[AI: REFERENCE]** sections are background. Use them only when relevant.
- **[HUMAN ONLY]** sections are for the team. Ignore them.
- When a task matches a skill's "When We Use It" entry, suggest that skill by its command (for example, /ponytail-review before merging, or "use context7" when writing Laravel or Inertia code).
- Do not suggest installing skills, MCPs, or connectors that are not on this list unless the team asks.
- Never cut validation, error handling, or security to make code shorter.

## How We Use This List [HUMAN ONLY]

- Only install skills we have actually read. Skills can include scripts that run commands on your machine, so check the SKILL.md and any scripts before adding one, especially from random GitHub repos.
- Test each skill once **before** the hackathon so we are not debugging tooling at 2am.
- Everyone on the team uses the same versions.
- Confirm with TACTICS that AI tools are allowed before relying on any of these.

## Skills List [AI: REFERENCE]

**Rule:** keep the kit small. Behavior skills (Ponytail, Karpathy, Superpowers, Caveman) all change how Claude writes code, and stacking them makes them fight each other. Subagent-heavy skills (Court, Founder) also burn through plan usage fast.

**Sharing tip:** the Karpathy rules live in the repo's **CLAUDE.md** and copyable skills go in the repo's **.claude/skills/** folder, so all 3 of us get the same setup from one git pull. Plugins are per person unless installed at project scope.

## Core Kit (install these) [AI: FOLLOW]

| **Skill** | **Type** | **What It Does** | **When We Use It** | **Source** | **Reviewed?** | **Tested?** |
| --- | --- | --- | --- | --- | --- | --- |
| **Karpathy Guidelines** | Coding behavior | One CLAUDE.md with 4 rules: think before coding (state assumptions, ask when unsure), simplicity first, surgical changes only, define success criteria and verify. | Always on. Already in the repo's CLAUDE.md. | [GitHub](https://github.com/multica-ai/andrej-karpathy-skills) | ☐ | ☐ |
| **Ponytail** (Mentor) | Coding behavior / Code review | Makes Claude write only what the task needs: reuse existing code, native features first, never cutting validation, security, or error handling. Adds /ponytail-review and /ponytail-audit. | Always on while building. /ponytail-review before merging, /ponytail-audit before the H16 freeze. Its status band does not show in the VS Code panel, but the skills still work. | [GitHub](https://github.com/DietrichGebert/ponytail) (official; mikrammullah/PonyTail is a copy) | ☐ | ☐ |
| **Context7** | Docs (MCP) | Feeds Claude current docs for Laravel, Inertia, React, Tailwind, and Supabase so it does not write outdated or made-up APIs. | Whenever Claude writes Laravel or Inertia code. Add "use context7" to the prompt. Free API key. | [GitHub](https://github.com/upstash/context7) | ☐ | ☐ |
| **UI/UX Pro Max** | UI/UX | Generates a full design system (layout pattern, colors, fonts, effects, anti-patterns) plus a pre-delivery checklist: contrast, focus states, responsive breakpoints. | Once at H2.5 to set our design system, then its checklist before the freeze. | [GitHub](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | ☐ | ☐ |
| **Anthropic Skills** | Pitch / Docs | Official skills from Anthropic, including pptx (slide decks), frontend-design, and webapp-testing. | H16 to H20 for the pitch deck. Safest source on this list. | [GitHub](https://github.com/anthropics/skills) | ☐ | ☐ |
| **Court Skill** | Ideation | Puts an idea on trial: a prosecutor and defense argue it, jurors with different viewpoints vote, and a judge lists what would flip the verdict. | Idea triage: run the top idea with **--quick** (11 subagent calls) before showing the mentor. | [GitHub](https://github.com/alexyc9381/court-skill) | ☐ | ☐ |

## Optional (only if we have time) [AI: REFERENCE]

| **Skill** | **Type** | **What It Does** | **When We Use It** | **Source** | **Reviewed?** | **Tested?** |
| --- | --- | --- | --- | --- | --- | --- |
| **Matt Pocock Skills** | Planning / Debugging | Small, composable skills. Best ones for us: /grill-me (stress-tests a plan), /diagnosing-bugs (disciplined bug-fixing loop), /prototype. | /grill-me right after locking the idea. /diagnosing-bugs when stuck at 3am. Needs /setup-matt-pocock-skills once per repo (pick local files as the tracker). Installed as a plugin; setup not run yet. | [GitHub](https://github.com/mattpocock/skills) | grill-me only (no scripts) | ☐ |
| **Playwright MCP** | Testing (connector) | Lets Claude drive a real browser: click through our flows, catch broken pages, take screenshots. | Testing the core flow before the freeze. Screenshots for the pitch deck. | Microsoft Playwright MCP | ☐ | ☐ |
| **Founder Skill** (/founder-competitors only) | Research | Maps direct and indirect competitors, their prices, and what their customers complain about, with linked sources. | Feeds the "Current solutions and gaps" step in brainstorming and the pitch. Skip the 100-agent consumer panel, it burns usage (blocked for Claude by a deny rule in `.claude/settings.json`). Writes into a `founder/` folder. | [GitHub](https://github.com/Jakeschincariol/founder-skill) | competitors + consumer only | ☐ |
| **Graphify** (Mentor) | Codebase mapping | Reads a folder and builds a knowledge graph: an interactive graph.html, a report of key files and surprising connections, and a saved graph Claude can query later with fewer tokens. | Run /graphify . on the fresh Laravel starter kit to see how its folders connect. Optional: run it again at H16 for an architecture visual in the pitch. Install: `pip install graphifyy` (double y, as the official repo says). | [GitHub](https://github.com/safishamsi/graphify) | ☐ | ☐ |

## Connectors [AI: REFERENCE]

| **Connector** | **Verdict** | **Why** |
| --- | --- | --- |
| **Playwright** | Optional | Listed above. Useful for testing flows and screenshot proof. |
| **Perplexity** | Skip | Claude already has web search built in, so it adds little for theme research. |
| **Firecrawl** | Skip | Web scraping and crawling. Only useful if our app itself needs to scrape websites. Claude can already read pages. |
| **PostHog** | Skip | Product analytics (user behavior, errors). We will have no real users in 24 hours. |
| **Composio** | Skip | One gateway to hundreds of apps through OAuth. Nothing for us to connect, and it is broad account access through a third party. |
