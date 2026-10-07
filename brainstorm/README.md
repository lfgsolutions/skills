# /brainstorm

A skill for Claude that turns a messy burst of ideas into an interactive brainstorm page, then improves it round after round until you make it the official version.

## What it does

1. You type `/brainstorm` and dump your ideas in any order.
2. Claude reads everything, sorts the ideas into themes, develops the strong ones, challenges the risky ones (only where there is a real risk), adds what you missed, and looks up facts that matter.
3. You get a colourful, interactive page. Its layout changes with the project (idea map, duels, scenario lab with sliders, canvas, timeline, name lab and more).
4. Every question has options, one suggested choice with a reason, an "Other" field, a notes field, and an Unsure / Leaning / Sure setting. A "Think it through with Claude" button gives a quick answer on any card.
5. At the end of the page: **Send to next round** or **Make it the official version**. Next round reads your answers and builds a sharper page at the same link. Official rebuilds the project as a roadmap, presentation, project map, playbook or launch board.

The page is written in the language you prompt it in. If you use an Obsidian vault, it also keeps a short note per brainstorm there.

## Install

**Claude Code**: unzip so the folder sits at `~/.claude/skills/brainstorm/` (the folder must contain `SKILL.md`), then type `/brainstorm` in a new session.

**Claude app or claude.ai**: Settings, Capabilities, Skills, upload `brainstorm.zip`.

## Requirements

- Claude with Artifacts enabled. Saving answers so Claude can read them, and the "Think it through with Claude" button, need artifacts with saved data (the Claude desktop app or claude.ai).
- Without that, the page still works: answers are saved on your device and you send them back with the "Copy my answers" button.

## Files

- `SKILL.md`: the workflow (round 1, next rounds, official version, memory).
- `references/thinking.md`: how ideas are developed and challenged, and how questions are written.
- `references/formats.md`: page formats for rounds and for the official version.
- `references/page-contract.md`: the blocks every page has, the data model, and how to use the kit.
- `assets/kit.css`, `assets/kit.js`: the reusable question cards inlined into every page.
