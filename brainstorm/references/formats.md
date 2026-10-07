# Formats

The page has a lead concept that fits the project, plus the required blocks from the page contract. Pick the concept that makes his next decision easiest, and give it a visual identity from the subject's own world (a travel project feels different from an accounting one). Avoid reusing the previous brainstorm's look by default.

## Round page concepts

| Concept | Fits | How it works |
|---|---|---|
| **Idea map** | Many scattered ideas, early round 1 | Themes as zones or islands; each idea a chip with its stance label; tap to open its development card. |
| **Keep / Park / Drop deck** | Too many ideas, needs triage | One card per idea with a three-way choice (single kind, `style:'chips'`) and a note. |
| **Duels** | Two or three competing directions | Side-by-side columns (single kind, `style:'duel'`), trade-offs listed under each. |
| **Fork path** | Sequential decisions where one choice changes the next | A path of decision nodes; later nodes show what each earlier choice implies. |
| **Scenario lab** | Money, time, pricing, capacity | Sliders and a live calculator (scale kind + `onChange`) with a small chart; break-even and best/worst cases. |
| **Canvas** | A business or offer | Lean canvas or offer canvas grid; each box shows his idea, a stance, and a question. |
| **Timeline / storyboard** | Events, courses, launches, trips | The experience in order, with questions pinned to the moment they affect. |
| **Name lab** | Naming, titles, taglines | Candidates rated with stars (rate kind), plus "add your own". |
| **Vibe board** | Brand, creative direction, content | Direction tiles with palette, type, sample lines; duel or rate. |
| **Customer journey** | Funnels, client experience | Stages from first contact to repeat; friction and ideas per stage. |
| **Pre-mortem front page** | A big bet that needs honest testing | A fake future headline "Why X failed" with the top reasons as cards to defuse. |

Combine one lead concept with secondary sections. A round can switch concept when the work moves (round 1 idea map, round 2 duels, round 3 scenario lab).

## Interactive pieces beyond question cards

Sliders with live numbers, small calculators, ranking, star ratings, toggles that show and hide consequences, a 2x2 impact vs effort grid, progress meter (kit), a "new idea" inbox (kit). Keep each one honest: numbers come from his inputs or sourced facts, never invented precision.

## Official version formats

Pick by what the project is and how he will use it:

| Format | Fits | Core pieces |
|---|---|---|
| **Roadmap** | Projects with phases (launch, course, product) | Phases with milestones and dates, next 3 actions highlighted, checkable progress (`db` collection `progress`), risks to watch. |
| **Presentation** | Something to pitch or show (clients, partners) | Slides type via `Artifact action:"quickstart" intent:"slides"`; the story from problem to offer to next step. |
| **Project map** | Many connected parts (systems, teams, offers) | A visual map of parts and how they connect, each part with owner, status and next step. |
| **Playbook** | A repeatable method or service | Steps, templates, checklists, prompts to copy. |
| **Launch board** | Time-boxed launches and campaigns | Countdown, workstreams, checklist per workstream, go / no-go criteria. |
| **One-page brief** | Handing off to someone (designer, developer, VA) | Goal, audience, scope, constraints, decisions, open questions, deadline. |

The official version keeps the same visual identity as the brainstorm unless a presentation needs a cleaner look. It always links back to the brainstorm page.
