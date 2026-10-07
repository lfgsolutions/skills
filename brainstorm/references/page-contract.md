# Page contract

Layout and look change every time. These parts do not.

## Required blocks (order and styling are free)

1. **Header**: project name, a round chip ("Round 2"), the save status (`<span data-bs-status></span>`), and the convergence meter (`<div data-bs-meter></div>`).
2. **What your answers changed** (round 2+): 3 to 6 short points, each naming their answer and its consequence. Quote their notes when they drove a change.
3. **What I heard**: the north star (labelled "inferred" if the user did not say it), the ideas clustered by theme, each with its stance label. A small "You said / I'm assuming" split.
4. **Locked in** (round 2+): decisions now Sure, collapsed by default once there are many.
5. **Development**: the ideas pushed further, additions the user did not mention, researched facts with source and date.
6. **Questions**: kit cards (`<div data-bs-q="id"></div>` slots), placed where they belong in the story rather than piled at the end when the format allows.
7. **Questions you didn't ask**: 3 to 5, each with a short answer or a proposed angle.
8. **Parking lot**: parked ideas with what would make them "now". Nothing from the dump disappears silently.
9. **New idea inbox**: `<div data-bs-inbox></div>`.
10. **Round bar** at the end: `<div data-bs-roundbar></div>` (Send to round N+1 / Make it the official version) and `<div data-bs-copy></div>` (fallback copy button, shown only when saving to Claude is unavailable).

## Tokens the kit needs

Define all of these on bare `:root` and redefine them in both dark blocks, mapped from the page's own palette:

```css
--bs-surface --bs-surface-2 --bs-ink --bs-ink-2 --bs-line
--bs-accent --bs-accent-ink --bs-accent-soft
--bs-good --bs-warn --bs-bad
--bs-font-display --bs-font-body
```
`--bs-accent-ink` is the text color on a solid accent fill. `--bs-accent-soft` is a light tint for selected states (a dark tint in dark mode). Keep `--bs-good/--warn/--bad` saturated enough for white or dark text in both themes.

## The kit

Inline `assets/kit.css` after the page's tokens, and `assets/kit.js` in a script at the end of the body:

```html
<script>
window.BS = {
  project: 'workshop-launch',          // slug, stable across rounds
  round: 2,
  lang: 'fr',                       // language the brainstorm was prompted in; 'en' and 'fr' labels are built in
  // langName: 'Spanish',          // needed for other languages, with strings: { ...every label in T.en, translated }
  context: 'One paragraph: north star, key decisions so far, constraints. Sent to Claude when the user asks for help on a card.',
  officialLabel: 'Make it the official roadmap',   // optional, adapt to the project
  questions: [
    { id:'q1', kind:'single', kicker:'Offer', q:'Group sessions or 1:1?', short:'Format',
      why:'Sets price, marketing and how many people you need.',
      options:[
        { id:'group', label:'Small groups (4 to 8)', detail:'Lower price, needs sign-ups' },
        { id:'one', label:'1:1 deep sessions', detail:'Higher price, one buyer at a time', rec:true, why:'You have 3 warm leads and no audience yet.' },
        { id:'both', label:'1:1 first, groups later', detail:'Learn with 1:1, then package' }
      ] },
    { id:'q2', kind:'multi', style:'chips', q:'Which tools are in scope?', options:[...] },
    { id:'q3', kind:'scale', q:'Pilot price', min:20, max:300, step:5, start:80, unit:'USD', minLabel:'Friends', maxLabel:'Premium' },
    { id:'q4', kind:'rank', q:'Order these follow-ups', items:['Brand kit','Motion ads','Dashboards'] },
    { id:'q5', kind:'rate', q:'Rate the titles', items:['Second Brain Sprint','AI Ops Day'] },
    { id:'q6', kind:'text', q:'What does success look like in 6 months?' }
  ],
  onChange: function (state, counts) { /* optional: update page-specific visuals, calculators */ }
};
BSKit.init(window.BS);
</script>
```

Kinds:
- `single`, `multi`: options + automatic **Other** with a text field (`allowOther:false` only if "other" is meaningless). Styles: default list, `'duel'` (side by side, for 2 or 3 big directions), `'chips'` (compact).
- `scale`: slider with live value (`unit`, or `format: v => '$' + v`).
- `rank`: up/down reordering, plus "missing one? add it".
- `rate`: 1 to 5 stars per item, plus "add your own".
- `text`: free answer.

Every card automatically gets: the "why", the Suggested badge and its reason (`rec:true` + `why` on the option, or `recWhy` on the question), a **notes** field, the **Unsure / Leaning / Sure** setting, and a **Think it through with Claude** button (hidden when unavailable; `ask:false` to remove it on a card).

Optional per question: `kicker`, `short` (label used in summaries), `notePh` (custom notes placeholder), `placeholder` (text kind).

## Data model (what Claude reads with ArtifactData)

| Collection | Doc id | Fields |
|---|---|---|
| `answers` | `r<round>-<qid>` | `round, qid, kind, choice, choices[], other, value, order[], ranked, ratings{}, added[], text, note, conf (0 none, 1 Unsure, 2 Leaning, 3 Sure), claude (last Claude reply), at` |
| `inbox` | `r<round>-<time>` | `round, text, at` |
| `control` | `r<round>` | `round, action ('next' or 'official'), note, at` |
| `progress` | free (official version only) | whatever the official page tracks |

`choice`/`choices` hold option ids; `_other` means the Other field (`other` holds the text). Read all rounds with `ArtifactData list answers`; filter by `round`.

Data from earlier rounds stays in the store. When building round N+1, write their earlier answers into the page as context ("Round 1, you said...") where they help, instead of loading them at runtime.

## Publishing

- `capabilities: {db:{}, user:{}, sample:{}}` on the first publish; omit `capabilities` on later rounds so they carry forward.
- Same file path every round (same URL). `label: "Round N"`. `icon` only on the first publish.
- Functional check after the first publish: one `ArtifactData list` of `answers`; if empty, write one probe doc `answers/probe` and delete it. Tell them in one line what was checked.
- If the page shows "Saved on this device only", the store is unavailable for them: ask them to paste the "Copy my answers" text.

## Content rules

- The language the brainstorm was prompted in. No em dashes. Short, direct sentences.
- Facts with source and date. Claims about their business only from what the user said or their files.
- No secrets, client personal data, or payment details on the page.
- Phone first: the user often answers while traveling.
