---
name: commit
description: Read this skill before making git commits
---

# Git Commit Skill

Create a git commit for the current changes following a Conventional Commits style with structured body and agent attribution.

## When to use

Trigger this skill when the user asks to commit, stage, or check in changes to git.

## Commit format

```
type(scope): summary

<body — optional for trivial or self-evident changes; use the two-paragraph
style when the work is substantial enough to warrant further breakdown>

Generated-with: <agent-name> (<provider>/<model-id>) via pi
```

### Subject line

- **type** REQUIRED — `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `perf`
- **scope** OPTIONAL — short noun for the affected area (e.g., `extensions`, `deps`, `api`)
- **summary** REQUIRED — imperative mood, <= 72 characters, no trailing period

### Body

- **Optional** for trivial or self-evident changes
- **Use the two-paragraph style** when the work is substantial enough to warrant further breakdown or explanation
- When present, write **two paragraphs** separated by a blank line:
  - **First paragraph:** What changed and why — the user's direction, motivation, and any personal contributions they made to the commit (e.g., manual edits, design decisions, file modifications done directly by the user).
  - **Second paragraph:** How it was realized — the agent's specific implementation choices, tools used, files created or modified, and any architectural decisions made on the user's behalf.
- No breaking-change markers (`BREAKING CHANGE:`)

### Footer

- **Non-optional** — always include the signed footer
- Format: `Generated-with: <agent-name> (<provider>/<model-id>) via pi`
- Use `get_current_model` to discover the active model if you do not already know it

## Steps

1. Review `git status` and `git diff --staged` (or `--cached`) to understand the current changes.
2. If the user provided specific file paths/globs, limit review to those files and stage only those.
3. If there are ambiguous extra files not clearly part of the requested commit, ask the user for clarification before proceeding.
4. Draft the full multi-line commit message using the **write** tool to a temp file (e.g., `/tmp/msg.txt`). Never use `echo` or heredocs to compose commit messages.
5. Stage the intended files with `git add <paths>`.
6. Commit with `git commit -F /tmp/msg.txt`.
7. Do **not** push. Only commit.

## Notes

- If committing on a dirty worktree where some changes should be discarded, stash them first instead of deleting.
- Every commit closes with `Generated-with: <agent-name> (<provider>/<model-id>) via pi`.
