# CLAUDE.md

Team MotoMeetables, Innolab Hackathon 2026 (24-hour build).

## Read these first

Our plan and rules live in these files. Follow sections labeled **[AI: FOLLOW]**, use **[AI: REFERENCE]** only when relevant, and ignore **[HUMAN ONLY]**. The Decisions Log in the prep plan is the newest information and wins over anything older.

@docs/hackathon/prep-plan.md
@docs/hackathon/skills.md
@docs/hackathon/tech-stack.md
@docs/hackathon/handoff.md

---

# Coding Guidelines

Behavioral guidelines to reduce common LLM coding mistakes, adapted from [andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills). Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them, don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

**Never simplify away security:** input validation, auth checks, and error handling at trust boundaries always stay.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it, don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

# Git Commits

**Title:** Conventional Commits, `type(scope): short summary`
- Types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`
- Scope is the feature or area, for example `feat(auth): add login page`
- Lowercase imperative, 72 characters max, no period at the end

**Body:** a blank line after the title, then what changed and why. Use short bullets when there is more than one change.

**Rules:**
- One logical change per commit.
- Never commit .env or secrets.

Example:
```
feat(auth): add login page

- add login form with email and password validation
- redirect to the dashboard after a successful login
```
