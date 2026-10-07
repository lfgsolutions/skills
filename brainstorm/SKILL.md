---
name: brainstorm
description: Turn a messy, unordered idea dump into an interactive, good-looking brainstorm page that challenges and develops the ideas, asks smart questions (options + "Other" + notes + confidence on every one), saves the answers, and builds Round 2, Round 3... until the user makes it the official version (roadmap, presentation or project map). Use when the user types /brainstorm, says "next round", "round 2", "tour suivant", "make it official", "version officielle", or continues an existing brainstorm. When the user pastes a random burst of ideas WITHOUT asking for /brainstorm, only OFFER it in one line; never start it on your own.
---

# /brainstorm

People think out loud: ideas arrive in bursts, in no particular order or weight. This skill turns a burst into a page the user enjoys working on, makes the thinking sharper round after round, and ends with an official version they can run the project from.

Three things are non-negotiable:
1. **Understand before building.** Read everything the user said, plus the context around it, and separate what the user said from what you assume.
2. **A good sparring partner.** Push ideas forward at least as often as you push back. Challenge only where there is a real risk. See `references/thinking.md`.
3. **The page is fun and good-looking, and its controls never change.** The layout changes with the project. The question controls are always the same kit. See `references/page-contract.md` and `references/formats.md`.

## Triggers

| Situation | Do |
|---|---|
| `/brainstorm` + ideas (or `/brainstorm` then ideas) | Run **Round 1**. |
| The user dumps random ideas without asking | One line only: offer to run it as a /brainstorm. Do not start. |
| An artifact comment sent to Claude from the page containing `[bs:next:rN]` (the round bar's button posts it automatically) | Run **Next round** right away, no confirmation needed. |
| "next round", "round N", "tour suivant", or `control/rN` says `next` | Run **Next round**. |
| A comment from the page containing `[bs:official:rN]`, "make it official", "version officielle", or `control/rN` says `official` | Run **Official version**. |
| "reopen the brainstorm" on an official project | Run a new round on the brainstorm page, starting from the official version. |

This skill makes pages, not websites: website-building workflows do not apply. Use `artifact-design` + `artifact-capabilities` when available.

## Round 1

1. **Gather context first, ask nothing yet.**
   - Read the whole dump twice. List every idea, even half sentences.
   - Look for what already exists: the project folder, memory notes, an Obsidian vault if the user has one (ask once where it lives if you can't find it, and remember the answer), earlier brainstorm notes, related past sessions when your tools can search them.
   - Only if you truly cannot tell what the brainstorm is about, ask one or two questions with AskUserQuestion. Everything else goes on the page.
2. **Analyse** with `references/thinking.md`:
   - North star: the outcome the user is after, stated or inferred (label inferred).
   - Cluster the ideas into themes. Mark each idea with a stance: Build on it, Sharpen, Stress-test, Reframe, Fact-check, Park, Drop.
   - Develop the strongest ideas (concrete version, bigger version, first step).
   - Add what the user did not mention: 3 to 5 high-value additions, and the questions the user did not ask.
   - Research facts that change decisions (prices, rules, competitors, visas, tools) with WebSearch. Cite and date them.
3. **Pick the questions** (6 to 10, ranked by how much each answer unlocks). Mix question kinds. Options must be genuinely different directions, one marked Suggested with a reason. The kit adds "Other", notes and confidence on its own.
4. **Pick the format** from `references/formats.md`. Choose what fits this project, not what was used last time.
5. **Build the page** (load `artifact-design` and `artifact-capabilities` first):
   - Follow `references/page-contract.md`: required blocks, tokens, and the kit.
   - Inline `assets/kit.css` into the `<style>` and `assets/kit.js` into a `<script>` at the end of the body, then `BSKit.init(window.BS)`.
   - Write the page in the language the brainstorm was prompted in (the language of the `/brainstorm` message and dump), never a regional variant unless the prompt itself uses one. Set `lang` to that language's code; for a language other than `en` or `fr`, also pass `langName` and translated `strings` for every kit label (see page-contract). Keep the same language every round unless the user switches. No em dashes anywhere on the page.
   - File: `<project folder>/brainstorm-<slug>.html` if a project folder exists, else the scratchpad.
6. **Publish** with `capabilities: {db:{}, user:{}, sample:{}, comments:{}}`, `label: "Round 1"`, an `icon`, a one-sentence `description`. Then the functional check from the contract: one `ArtifactData` list of `answers` (write and delete one probe doc if empty). Confirm the page opens.
7. **Save the trail** (see Memory below), then reply in chat with the link and 2 to 3 lines: what the page covers and how many questions. Do not repeat the page content in chat.

## Next round

1. Read everything the user left, with `ArtifactData`: `answers` (where round == N), `inbox`, `control/rN`. If the page was saved locally only, ask the user to paste the "Copy my answers" text and use that.
2. Read every note line by line. Notes often hold the real answer, a new idea, or a question to answer directly. Every question in a note gets an answer on the next page.
3. Weigh confidence: Sure = settled (move to "Locked in"), Leaning = keep with a sharper follow-up, Unsure = dig deeper or reframe, Open = re-ask only if it still matters, otherwise park it. A "Think it through with Claude" reply saved on a card is context, not a decision.
4. Build round N+1 on the **same file and URL** (republish, `label: "Round N+1"`, same full `capabilities` set every time). The format can change if a better one fits now. Open with **What your answers changed**. Fewer, sharper questions each round; never re-ask a settled question.
5. If an important decision stays Unsure after two rounds, change approach for it: a concrete example to react to, a side-by-side duel, or splitting it into smaller decisions.
6. Update the vault note and the memory note, if they exist.
7. If the round was triggered by a page comment, reply in that comment thread with one line: round N+1 is ready. The open page reloads by itself.

## Official version

When the user locks the round with "official" (or says so):
1. Read the last round's answers the same way.
2. Pick the official format from `references/formats.md` (roadmap, presentation, project map, playbook, launch board...) based on what the project is. For a pitch deck, run `Artifact action:"quickstart" intent:"slides"` and use the Slides type.
3. Build it as a **new artifact** (new file `<slug>-official.html`), designed to be used every day: clear next actions, owners and dates where known, progress the user can tick (`db` collection `progress`), open risks, and a link back to the brainstorm.
4. Republish the brainstorm page once with a banner linking to the official version. It stays as the history.
5. If the request came from a page comment, reply in that comment thread with one line and the link.
6. If a vault note exists, its status becomes `official`, with both links. Suggest a next step or skill if one fits (building a site, writing a doc, scheduling reminders).

## Memory

After every round and at official:
- **Obsidian vault (optional, only if the user has one)**: one note per brainstorm, in their projects folder if they have one (`Projects/<Project>/Brainstorm - <Topic>.md`), else at the vault root. Follow the vault's own conventions. Frontmatter: `status: round-N | official`, `artifact:` link, `updated:` date. Body: north star, locked-in decisions, open questions, parked ideas, a dated log line per round. Link `[[ ]]` to the project note, people and concepts, and add a link from today's daily note if they keep daily notes. Keep it short: the page holds the detail.
- **Persistent memory (if your environment has one)**: one project memory per brainstorm (`brainstorm-<slug>.md`) holding the artifact URL, file path, current round, the collections to read, and the key decisions so far. Add it to the memory index if there is one.
- Never put secrets, client personal data or payment details in either.

## Quality bar before handing over a page

- Every idea from the dump appears somewhere (developed, questioned, parked, or explicitly dropped with a reason).
- Every question has a Suggested option with a one-line reason, and the kit's Other + notes + confidence.
- At least one interactive element besides question cards when it helps (slider, calculator, ranking, duel, map).
- Facts that drive decisions are sourced and dated.
- Works on a phone at 400px, in light and dark, with no em dashes.
