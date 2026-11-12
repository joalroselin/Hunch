# Landing page look

Sunset paper with poster color fields. Scope: everything inside `.hunch-home` (set in `home-screen.tsx`). Tokens and helpers live in `look.css`. Other routes keep the old look.

## The one idea

A hunch becomes the people who message you. One shape carries it: **the drop**, a round sun with one tail, which is also the outline of a chat bubble (`border-radius: var(--drop)`, mirrored `var(--drop-out)`). The drop is the mark: the header logo (`HunchMark` in `mark.tsx`), the hero's opening that the posts come out of and that then shows their photos (`HeroMark`, outline path `MARK_PATH`), the send button and the empty-box tooltip. Use it wherever a hunch or a message appears. Do not invent a second shape, and do not set it down as decoration: it is a logo, an opening or a button.

## Palette

| Token | Value | Use |
|---|---|---|
| `--cream` | #F4ECDD | page ground, always flat and clean |
| `--cream-deep` | #EADFCA | a quieter band, footer |
| `--sheet` | #FFFCF5 | paper objects (try box, phone screens), text on color fields |
| `--ink` | #1A110B | all text, the pill button, bubbles |
| `--ink-soft` | ink at 66% | only for a caption under an object, never under a heading |
| `--gold` #FFC233, `--persimmon` #FF6A1F, `--chili` #D8281B, `--rose` #FF5A8C | | accents: numbers, caret, one highlighted word |
| `--sun` | gold to persimmon to chili with a rose corner | the drop only |

No navy, no indigo, no gray text, no hairline borders. Color means something is alive: the drop, a field, a number.

## Color fields

Full-bleed gradient scenes, one mood per scene, at most one every other section: `.hh-field` plus `.hh-field-sili` (red, orange, gold), `.hh-field-dahon` (green, lime), `.hh-field-mangga` (yellow, pink; ink text), `.hh-field-gumamela` (magenta, coral). Always add `.hh-grain`. Text on a field is `--sheet` (ink on Mangga). A field holds one hero object and one headline; the winner's field also carries its two facts and the runner-up line (see "Results and winner"). Focus rings on a dark field are `--sheet`.

## Grain

Very fine, soft, low-contrast film grain, **inside gradients only**: the drop, the send button, the color fields. Add `.hh-grain` to the gradient element (it draws `/textures/grain-fine.png` at 256 px, soft-light, `--grain` 0.5). Never on cream, never on sheets, photos, phones or text. The old `Grain` component and `/textures/grain.png` are too coarse: do not use them on the landing page.

## Type

- **Bricolage Grotesque** (`--display`, bundled in `fonts.ts`) for everything.
- `.hh-display`: weight 800, tracking -0.045em, line-height 0.86. Hero is 120 px on one line on a 1440 poster. One per scene.
- `.hh-title`: weight 800, -0.035em, 0.94. Section headings are 96 px on a 1440 poster in every scene (`.sy-h`, `.pr-title`, `.nw-title`, `.fc-title`), 42 to 52 px on phones. A second heading inside a scene is 84 px.
- `.hh-line`: weight 500, -0.02em, 1.22, 18 to 20 px, `text-wrap: pretty` so no line ends on one word. The one support line.
- `.hh-label`: 12 px, weight 600. A caption next to an object.
- `.hh-dot`: Doto 900, only for an instrument readout (the `14` in the How it works results window, the numbers in the post sheet). Results and winner set their numbers in Bricolage 800.
- TikTok Sans (`--ugc-font`) only inside post frames.
- No mono, no uppercase tracking, no brackets, no counters.

## Layout and scale

- Every scene is a poster: one hero object, one heading of 7 words or fewer, one support line. If a scene needs a second paragraph, it needs a working mock instead.
- Scale contrast: something very big next to something small. Hero type at 12% of the viewport width, a post at 240 px next to posts at 90 px. Never a grid of equal boxes; when there are 8 of something, give them 3 sizes and let one lead.
- Objects are physical: they tilt 3 to 9 degrees, overlap, bleed off the edge, and cast a warm shadow down and to the right (`--shadow-object`, `--shadow-sheet`). Light comes from the top left.
- Instruments: thin 1 px ink rings, tick rings (`stroke-dasharray: 1 8.25`), dot rows built from data. Only where they measure something real.
- Gutter is `var(--gutter)` (18 to 48 px). Headings align to it on the left. No centered column of text, except the hero: mark, headline, line and box sit in one centered column with the posts scattered around it.
- Posts are always phone frames with the real photos: `<HomePost version={v} />` from `ugc-post.tsx`. Give the wrapper a width; the post scales itself. Never a typographic card, never a Notes mock.

## Motion

Calm, slow, and it tells the story.
- Entrance (hero): the mark draws its outline and fills from the tail, a few posts rush out of it past the viewer, the 8 leave it in its color and turn into photos as they land around the headline, the fill drains, the headline rises word by word, the box starts typing, the nav fades in. Then the mark opens on one post photo after another.
- Arrivals: `rise` (12 px up, 6 px blur to sharp, 0.7 to 0.8 s, `--ease-out`). Stagger 60 to 80 ms.
- Idle: objects drift 4 to 8 px over 6 to 9 s; the hero mark loops 4 post photos and the sun in 11 s; tick rings turn once in 180 s.
- Hover: nav, footer links and every pill use `LetterRoll`; a post lifts 3 px and comes alive (see "Posts"); the send drop turns its tail up; a list name or step draws a thin gold line. Pressed: pills and posts shrink a hair, text buttons and links dim to 60%.
- Photos fade in over 0.5 s once decoded (`.ugc-photo[data-in]`); the frame holds its size from the start. Clips follow the budget in "Posts".
- Scroll: see "The scroll film".
- `prefers-reduced-motion`: fades only, no drift, no loops. Everything must look finished without motion.

## The scroll film

Every section boundary is one designed, scroll-linked move that carries something into the next scene. No two use the same move. All of them are transform and opacity only, driven by framer-motion `useScroll` and `useTransform` (no CSS scroll timelines, so Safari plays them), and all reverse when scrolling back up. `scroll/film.ts` has the two switches: `useFilm()` (900 px and wider, motion allowed; the pinned scenes) and `useMoving()` (motion allowed at any width). With reduced motion nothing moves with the scroll and every scene simply appears; How it works stays pinned, so the scroll still picks the step.

| Boundary | Move | What carries over | Phones |
|---|---|---|---|
| Hero to the 8 hunches | The posts fly outward past the edges while the column slides up; in the next scene they come back from in front and land as one deck. | the posts | same |
| 8 hunches to How it works | The green stage is laid down like a sheet: it comes up tilted and small and levels as it reaches its place. | the color field | smaller tilt |
| How it works to results | After step 4 the page goes through the results window: the window grows past the screen, turns into the cream page, and the real results heading comes up inside it. | the results window | the stage is lifted off, tilting away |
| Results to the winner | The red field rises as a dome that flattens (a cream cut-out scaled away); the winning post settles from 5 to 1 degree as it passes. | the winning post and its color | same |
| Winner to next week | Next week is a cream sheet with round corners that slides up over the red field while the field's words hang back. The 7 posts are dealt from the left like cards. | the winner's photo | sheet only, no deal |
| Next week to the questions | The band's top edge comes in on a slant and levels; the chat pops up from its tail corner like a message. | the drop (as the chat's sender) | same |
| Questions to the closing | The mark rises through the band, the scene pins, the mark swells until it is the yellow field, then the headline and the try box come up inside it. | the mark | no pin: the mark hangs from the scene's top edge and grows down into the field |
| Closing to the footer | The field lifts off with a soft shadow; the footer row waits underneath and comes up at half speed. | the field's edge | same |
| Footer to the hidden ending | Keep scrolling at the bottom and the magenta field of dots rises. | the page's last color | same |

Rules for anyone adding to it:
- Target a wrapper that is not sticky and not transformed by something else, and put the `motion` style on an inner element when the outer one already has a CSS entrance.
- Pinned scenes take their extra height from CSS inside `@media (min-width: 900px) and (prefers-reduced-motion: no-preference)`, the same query as `useFilm()`. How it works adds 70svh for the zoom (`--exit`), and the results overlap it by 52svh. The closing scene is 210svh and overlaps the questions by 68svh.
- `#try` is an anchor inside the closing scene placed where the scene is fully open; link to it, not to the section.
- The header strip, post sheet and anchors must keep working at any scroll position: check `#how-it-works`, `#next-week` and `#try`.

## Header (`header.tsx`, strip in `look.css`)

- Clear over the hero. Once the page moves (`data-solid`), a cream strip fades in behind the row, frosted, with a soft lower edge so posts and headings slide under it instead of being cut in a line. The row moves up by transform; nothing animates height.
- Over a color field (`data-field`, set only while the field covers the whole strip, top and bottom, so the text never turns light over the cream above a field's edge) the cream goes and only the frost stays: the field runs to the top, the text takes the field's color (`--sheet` on dark fields, ink on Mangga), and anything sliding under softens.
- The header box is 64 px tall at every width; the taller top row overflows it.

## Posts (`ugc-post.tsx`, `ugc.css`)

- On-video text breaks like a careful creator's: fewest lines of at most 24 letters, even lengths, a leading `POV:` alone, breaks after a colon or before a particle, never a line under 10 letters.
- Counts sit under the rail icons only when the post has results; a post that has not run shows the icons alone.
- Clips share one budget: at most two play at a time, only posts at least 180 px wide (30% of a phone screen), mostly on screen and at least 60% visible through their parents, never during the hero entrance, never behind an open sheet. Each clip plays once and dissolves back to its photo (its own first frame), then rests 3 to 6 s; a clip off screen lets go of its file.
- A cursor resting 120 ms on a post brings it to life (`alive`, landing page only): its clip plays, the bottom line follows the clip, the heart fills `#fe2c55` with a small pop and the count rolls up one. Reduced motion: the heart's color only.

## Questions chat (`faq.tsx`, `faq.css`)

- The window is only as tall as what has been said. It starts with the name and the unasked questions, and grows with a 0.55 s height ease as each message lands; the tray rides the bottom edge.
- On wide screens the band keeps room for the whole thread (`--full`, measured once), so nothing below moves. On phones the page below simply moves down as the thread grows.

## Results and winner (`proof/results.*`, `proof/winner.*`)

- Results is a chart, so it is strict: 8 upright posts, best first from the left, each standing on a bar of thin slabs, one slab per message (12 design px a step). No tilt, no scatter. The count sits above its post in Bricolage 800 (46 px; the winner's is 116 px in `--chili`), the audience name under the bar. Only the winner's bar and count carry color: the bar is `--sun` with grain, the rest are ink.
- The heading runs on one line across the top and the support line sits in the open corner above the short bars.
- Motion: all bars climb at the same speed (0.13 s a message) and lift their posts while the counts tick up, so the winner arrives last. It is transform and clip only, nothing below moves. Under 900 px the board is a list, best first, with the bars lying down.
- Winner is the poster: a small kicker (Most messages came from), the audience name in `.hh-display`, the post tilted and left clean, then two facts as figure and word (messages, spent) and the runner-up line. No pill, no next step.
- Scroll: the red field comes up as a dome that flattens (`.pw-dome`, a cream cut-out scaled to nothing), the post settles from 5 to 1 degree as it passes, and the words hang back as next week slides over. All in `winner.tsx`, off under reduced motion.
- Nothing sits on a post: no number bubbles, no coins, no price sticker, no tags. A number is type in the layout next to what it describes. These two scenes use no dot face; keep Doto for a real instrument readout.

## Try box (`prompt-box.tsx`, `hero/prompt.css`)

- One sheet, one line, the drop as the send button. The line and the drop share one center; padding is 0.74em on three sides and 1.12em on the left.
- Focus: the sheet lifts 2 px, its shadow deepens and a 1.5 px ink line seats itself on the box edge. The field itself never draws an outline or a ring. The example stays, dimmed, until the first letter.
- Typewriter examples are one line at every width. The placeholder never wraps; if a longer one is added it is cut at the box edge, so keep them at 26 characters or fewer.
- Typed text that wraps grows the box one line at a time, up to 3 lines, with a 0.28 s height transition. The drop stays on the last line.

## How it works (`how-it-works.tsx`, `how/`)

- On cream. The only color is the stage: one rounded green field (`.hw-stage`) with fine grain. The lime light fills most of it and the edges stay emerald and teal; no dark corners, no small spotlight.
- One set of 8 posts lives on the stage and travels between the steps; each step only lays out empty slots (`data-slot`) and its own furniture. Start screen (the posts come out of the added photo), the 8 on the field with their buyers (the winner leads, 3 sizes), the same 8 lined up with their ₱99 and days, then the ranking sheet: the winner moves into its slot and the rest drop into their rows. Posts are never covered: money, days and messages are set in type under or beside them.
- Steps 1 and 4 are sheet windows; steps 2 and 3 put the posts straight on the field with ink type.
- Numbers: Bricolage 800 in the layout. Doto only for the winner's `14`, as a readout. One dot is one message; the winner's row is the only one in color.
- Steps on the left: the open one in full ink at weight 800 with its line; the others step back; a thin rail beside them fills with the sun step by step. No numbers.
- The section is pinned for 4 steps of scroll (about 60% of a screen each). Scroll picks the step; clicking a step scrolls to it.
- Step change: the posts travel on a slightly springy curve, lead first, 55 ms apart; sheets come up from below and leave upward (reversed when scrolling back); bar titles roll; captions follow once the posts land; one band of warm light passes over the field. Inside a step, things happen once: the line types, the photo lands, the days fill, the dots count in. The lime light and the sun rail move with the scroll.
- Phones: the stage and the open step pin together; the same moves on a taller stage, and only the lead post is named.
- Reduced motion: scenes cross-fade, the posts fade instead of travelling, everything shows finished.

## Banned

Mono bracket labels (`[ A3 · post 3 of 8 ]`), "01 of 20" counters, dot-progress rows as decoration, thin-bordered rounded cards, cards on a dark field, bordered pill chips, status badges ("Passed 3 checks"), tab rows with a colored underline as a section's navigation, gray text under every title, glow blobs, generic icons, "See the post" arrow links, cursor-following pills, identical card templates, symmetric grids of equal boxes, a Notes mock for a post, eyebrow plus headline plus subline, coarse grain or grain on flat fields, em dashes.

## Notes for builders

- Use `--cream`, `--sheet`, `--ink`, `--sun` and the `hh-` classes. The old names (`--navy`, `--paper`, `--mute`, `--action`...) still resolve from the app root for other routes; do not build on them here.
- Styles in plain CSS files are unlayered and beat Tailwind utilities. Do not rely on `hidden md:flex` on an element that has an `hh-` or `hx-` class with its own `display`.
- `.ugc` reads `--x`, `--y`, `--size`, `--tilt` from its ancestors. Do not use those names for layout variables around a post (the hero uses `--at-x`, `--at-y`, `--at-w`).
- `main` sits above the footer (`z-index: 1`) so the footer can wait under the closing field. Do not give `main` a background.
- Tap targets: pills are 44 px tall at every width. Small text links and the tight list names get their finger room from an invisible `::after`, not from padding.
- Nothing is stuck on a post anywhere: `HomePost` has no price sticker any more.
