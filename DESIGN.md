# Hunch design system

> Retired. This file describes the old navy and indigo look. The app now shares the landing page's Sunset paper look: read `APP-LOOK.md` and `src/components/hunch/home/LOOK.md`. Token names below still exist, with new values.

Hunch helps small sellers find out who their product is for. This document is the spec for how the app looks, reads and moves. The living version is at `/design`; tokens and utilities live in `src/app/globals.css`, primitives in `src/components/ds`, instruments in `src/components/ds/instruments`, and restyled shadcn components in `src/components/ui`.

> **Dark system, Nov 12 2026.** Hunch moved from a light paper theme to a dark navy one. Token names did not change, so existing classes keep working: `ink` is now the text color (paper) and `stone` is the ground (navy). Read `text-ink` as "foreground" and `bg-stone` as "page".

## Principles

1. **Navy ground, paper text, one indigo.** Every screen sits on navy. Cards are one step up (navy 2). Indigo marks the one action that moves a test forward. If two things on a screen are indigo, one of them is wrong.
2. **Light comes from behind the answer.** The only strong glow sits behind a hero number or the "Your people" card. At most one per screen area.
3. **Instruments, not decoration.** Dot-matrix numbers, thin arcs, tick dials and dot scatters always draw real numbers from the run or report. Nothing invented.
4. **Square controls, soft panels.** Buttons, inputs, chips and sheets have zero radius. Panels (cards, tiles, GlowCards, dialogs, post cards) use 20px; small blocks and thumbnails inside them use 12px. Round is for dots, meter ends and the round icon buttons.
5. **Plain words.** Short sentences, real numbers, no hype, sentence case.
6. **Soulful motion.** Calm, warm, never flashy. Things arrive in reading order on one expo curve. Reduced motion is honored everywhere.

## Color tokens

All values are on `:root` in `globals.css` and exposed to Tailwind through `@theme inline`. `color-scheme: dark`; the viewport theme color is `#15192e`. There is no light theme and the `dark:` variant is bound to a `.dark` class that is never applied.

### Raw palette

| Name | Var / utility | Value | Usage | Contrast |
| --- | --- | --- | --- | --- |
| Navy | `--navy`, `bg-navy`, `bg-background`, `bg-stone` | `#15192e` | The page | Paper on navy 16.1:1 |
| Navy deep | `--navy-deep`, `bg-navy-deep` | `#0e1120` | `html` background, outer edges, overlay scrim | Decorative |
| Navy 2 | `--navy-2`, `bg-navy-2`, `bg-card`, `bg-field` | `#222844` | Cards, tiles, inputs | Paper 13.4:1 |
| Navy 3 | `--navy-3`, `bg-navy-3`, `bg-popover` | `#2c3254` | Menus, tooltips, toasts, active segmented tab | Paper 11.5:1 |
| Paper | `--paper`, `text-paper`, `text-ink`, `text-foreground` | `#fbf6ef` | Text, icons, focus outline, thin lines | 16.1:1 on navy |
| Mute | `--mute`, `text-mute` | `#a4a2a6` (paper at 62% over navy) | Second lines, labels, quiet headline tail | 6.9:1 on navy, 5.7:1 on navy 2 |
| Mute strong | `--mute-strong`, `text-mute-strong` | `#c4c1c1` | Mono kickers, captions under 13px | 9.7:1 / 8.1:1 |
| Placeholder | `text-placeholder` | `#7c7c85` | Placeholder text only | 3.5:1 on navy 2 |
| Hairline | `--hairline`, `border-border`, `border-hairline`, `.hairline` | `rgb(251 246 239 / 0.12)` | Dividers, tile edges | Decorative |
| Hairline strong | `--hairline-strong`, `border-hairline-strong` | paper 24% | Hover edges, floating layers, outline chips | Decorative |
| Input line | `--input`, `border-input` | paper 16% | Field borders | Decorative |
| Indigo | `--action`, `--indigo`, `bg-primary`, `bg-action` | `#5050c8` | Primary button, selection, meter fill | Paper on it 5.9:1. Only 2.75:1 against navy, so never as text |
| Indigo hover | `--action-strong`, `bg-action-strong` | `#6262dc` | Hover of indigo buttons, chart winner | Paper on it 4.5:1 |
| Indigo soft | `--action-soft`, `text-action-soft` | `#a7a9ef` | The only way indigo appears as text or a thin stroke | 7.9:1 on navy |
| On action | `--on-action`, `text-on-action` | paper | Text on indigo | |
| Tints | `bg-ink/5` to `bg-ink/12` | paper at low opacity | Secondary fills, hover fills, tracks | |

`--fog` and `--line` are aliases of paper so `text-fog/80` and `border-line/14` still work.

### Status

Re-tuned for navy. Text color passes 4.5:1 on its own 14% tint over navy and navy 2. Always pair with a word.

| Name | Var / utility | Value | Contrast on 14% tint (navy / navy 2) |
| --- | --- | --- | --- |
| Pass | `--pass`, `text-pass`, `bg-pass/14` | `#6fd394` | 7.1 / 5.8 |
| Warn | `--warn`, `text-warn`, `bg-warn/14` | `#f0bd62` | 7.5 / 6.2 |
| Fail | `--fail`, `--destructive`, `text-fail` | `#ff8f80` | 6.1 / 5.1 |
| Live | `--live`, `bg-live` | `#30d158` | Dot only, next to words like "Test running" |

### shadcn mapping

| shadcn var | Value |
| --- | --- |
| `--background` / `--foreground` | navy / paper |
| `--card` / `--card-foreground` | navy 2 / paper |
| `--popover` / `--popover-foreground` | navy 3 / paper |
| `--primary` / `--primary-foreground` | indigo / paper |
| `--secondary` / `--secondary-foreground` | paper 8% / paper |
| `--muted` / `--muted-foreground` | navy 2 / mute |
| `--accent` / `--accent-foreground` | paper 8% / paper (menu hover, not the brand accent) |
| `--destructive` | fail |
| `--border` / `--input` / `--ring` | paper 12% / paper 16% / `#8a8af0` |
| `--radius` | `0px` |
| `--sidebar-*` | navy 2, indigo primary, paper 8% accent, hairline border, `#8a8af0` ring |
| `--shadow-float` | `0 24px 48px -24px rgb(5 7 16 / 0.8), 0 0 0 1px hairline` for floating layers |

### Chart colors

| Token | Value | Role |
| --- | --- | --- |
| `--chart-1` | `#6262dc` | Winner. Clears 3:1 on navy |
| `--chart-2` | `#fbf6ef` | Runner-up or primary comparison |
| `--chart-3` | `#a4a2a6` | Other series |
| `--chart-4` | `#a7a9ef` | Benchmark or reference line |
| `--chart-5` | `#4a4e66` | Background series |

## Gradients

Only navy, navy 2 and indigo, plus at most a faint paper highlight. No neon, no rainbow, no pink, green or orange gradients, no glassmorphism blur stacks. At most one strong glow per screen area. Mango post images are user content and keep their own colors.

| Utility | What it paints | Use |
| --- | --- | --- |
| `glow-indigo` | Two stacked radial indigo gradients, strongest at center | Behind hero numbers and the "Your people" card |
| `surface-gradient` | Navy 2 to `#1b2039` with a faint paper light at the top and a 1px inner top highlight | Card, dialog and sheet fill (`Card` uses it) |
| `tile` | Same fill as `surface-gradient` plus an inset hairline edge | `<Tile>` and `.tile` |
| `page-backdrop` | Navy body plus a fixed `::before` field (indigo light at the top, navy 2 pool bottom right, deep navy vignette) that drifts over 26s, plus a fixed `::after` grain layer (256px noise, soft-light, 14%) | `body` only |
| `dot-grid` | 1px paper dots at 4.5% on a 20px grid | `body`, or any panel that wants the texture |

Glow pattern (breathing, behind content):

```tsx
<div className="relative isolate">
  <div aria-hidden className="glow-indigo animate-glow pointer-events-none absolute inset-0 -z-10" />
  ...content
</div>
```

## Typography

### Families

All bundled in `src/app/fonts` and loaded with `next/font/local` in `layout.tsx`. No network fonts. Licenses sit next to the files.

| Family | File | CSS var | Tailwind | Role | License |
| --- | --- | --- | --- | --- | --- |
| Geist (variable, wght 100 to 900) | `Geist-VF.ttf` | `--font-geist` | `font-sans` (default) | All interface text | `OFL-Geist.txt` |
| Geist Mono (variable) | `GeistMono-VF.ttf` | `--font-geist-mono` | `font-mono` | Kickers, codes, small labels | `OFL-GeistMono.txt` |
| Doto (variable, ROND and wght) | `Doto-VF.ttf` | `--font-doto` | `font-dot`, or `dot-num` | Hero numbers only | `OFL-Doto.txt` |
| Schibsted Grotesk | `SchibstedGrotesk-VF.ttf` | `--font-schibsted` | none | Post images only (`post-canvas.tsx`) | `OFL-SchibstedGrotesk.txt` |

`dot-num` sets Doto at weight 700 with `ROND 100` (round dots), tabular figures and 0.9 line height. Use it for hero numbers like `62%`, `3.4` or `08`, never for words or body figures.

### Scale

| Role | Utility / component | Size | Weight | Tracking |
| --- | --- | --- | --- | --- |
| Hero number | `dot-num`, `<Stat dot>` | `clamp(4.5rem, 11vw, 8rem)` or larger | Doto 700 | 0 |
| Display | `.display`, `<Display>` | `clamp(4.2rem, 16vw, 13.5rem)` | 600 | -0.045em |
| Headline | `.headline`, `<Headline>` | `clamp(2.2rem, 5.4vw, 4.75rem)` (sizes hero, section, md, sm) | 600 | -0.035em |
| Title | `text-[28px] font-semibold` | 28px (24px mobile) | 600 | -0.025em |
| Card title | `CardTitle` | 19px | 600 | -0.02em |
| Label pair | bold short label + muted second line | 15px 600 + 13px 400 mute | | "Night shift" / "Agents / Pasig" |
| Lead | `<Lead>` | `clamp(1.05rem, 1.6vw, 1.3rem)` | 400 | mute |
| Body | `text-[17px] leading-relaxed` | 17px | 400 | |
| Eyebrow | `.eyebrow` | 16px | 500 | mute |
| Kicker | `.kicker`, `<Kicker>` | 11.5px Geist Mono | 400 | 0.04em, lowercase, `[ 03 · night shift ]` |
| Button | Button | 17 / 15 / 14 / 13px | 500 | -0.01em |

Rules: headlines are two-tone (statement in paper, optional tail in mute). `h1` to `h3` balance. Body caps at about 64 characters. `cn` drops a `leading-*` placed before a `text-*` size, so restate leading after a new size.

## Spacing and layout

- Gutter `--gutter: clamp(16px, 2.4vw, 32px)`, applied as `px-(--gutter)`. No horizontal scroll (`overflow-x: clip` on `html` and `body`).
- Containers: `<Section width="flow">` 1200px (all 7 app steps, so they share one left edge with the header), `max-w-sheet` 1100px, `max-w-page` 1024px, `max-w-list` 860px, `max-w-reading` 820px, `max-w-form` 720px.
- App shell top bar is 56px (`h-14`), sticky, transparent until scrolled, then navy 88% with one `backdrop-blur-md` and a hairline.
- Z-index: content 0 to 1, top bar 50, overlays 50, skip link 70.

## Borders, radii, shadows

- `--radius: 0px` for controls. Panels use `rounded-[20px]` (Card, `.tile`, GlowCard, dialogs, post cards); blocks and thumbnails inside a panel use `rounded-[12px]`. No other radii. `rounded-full` only for status dots, meter and progress ends, and the `round` / `round-accent` buttons.
- Depth comes from navy 2 on navy plus a hairline edge. Floating layers (menus, tooltips, toasts, dialogs, sheets) use `shadow-(--shadow-float)`.
- Focus: global `:focus-visible` is a 2px paper outline at 3px offset. A class list with `outline-none` must add `focus-visible:outline-solid` next to `focus-visible:outline-2`, or Tailwind v4 keeps the outline style at none (Button does this). Fields use an indigo hover border (`#6262dc`) with a `0 0 0 3px rgb(98 98 220 / 0.32)` ring.
- Selection: indigo with paper text.

## Motion

Motion tells the story of a hunch turning into an answer: calm and warm, never flashy.

### Language

- **Entrances:** expo ease-out `cubic-bezier(0.16, 1, 0.3, 1)`, 500 to 900ms. Things rise 8 to 14px from `blur(6px)` and opacity 0, in reading order with 50 to 90ms staggers. Keep a screen's whole entrance under about 1.6s.
- **Small interactive things:** soft springs, stiffness 220 to 280, damping 26 to 32, no overshoot. Gauge needles may settle once (`springNeedle`).
- **Hover and press:** 2px lift with a brighter hairline, press scales to 0.97, 150 to 200ms.
- **Route changes:** the shell wraps page content in `animate-route` (fade plus 8px rise, 500ms).
- **Loops:** only the page backdrop drift (26s) and the hero glow breathing (10s), plus the thinking grid while it works. Loops pause while the tab is hidden: `TabVisibility` (in `layout.tsx`) sets `data-tab-hidden` on `<html>` and CSS pauses every animation. JS loops use `useTabVisible()`.
- Animate only transform, opacity and filter (SVG strokes may animate `stroke-dashoffset`). No layout animation. Nothing blocks clicks.

### Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--ease-out`, `--ease-expo` (`ease-out`, `ease-expo`) | `cubic-bezier(0.16, 1, 0.3, 1)` | Everything that arrives or changes color |
| `--ease-breathe` | `cubic-bezier(0.45, 0, 0.55, 1)` | Loops |
| `--ease-rail` | `cubic-bezier(0.77, 0, 0.175, 1)` | Rails that grow in place |
| `animate-enter` | 700ms, rise 12px from blur 6px | Entrances. Pair with `stagger-N` (N times 70ms) |
| `animate-rise` | 800ms, same keyframes | Legacy name, same look |
| `animate-fade` | 600ms opacity | Plain fades |
| `animate-route` | 500ms, rise 8px | Shell route crossfade |
| `animate-draw` | 900ms `stroke-dashoffset` 1 to 0 | Arcs and lines. Set `pathLength={1}` and `strokeDasharray="1"` |
| `animate-bloom` | 1.6s once, scale 0.4 to 2.4 while fading | Winner dot halo. Set `transform-box: fill-box; transform-origin: center` on SVG |
| `animate-grow-x` | 900ms once, from `scaleX(0)` | Bars and meters. Add `origin-left` |
| `animate-dot-wave` | 2.4s loop, opacity 0.16 to 1 | Thinking grid dots, delay each dot by column and row |
| `animate-glow` | 10s loop, opacity 0.82 to 1, scale 1 to 1.05 | Hero glow layer |
| `animate-drift` | 26s alternate loop | Page backdrop |
| `press` | `:active` scale 0.97, 180ms transitions | Buttons, interactive tiles |
| `lift` | hover `translateY(-2px)` | Pair with `press` and `hover:border-hairline-strong` |
| `[data-reveal]` / `<Reveal>` | 800ms rise from blur | Below-the-fold content only |

JS presets for framer-motion, exported from `@/components/ds` as `motionTokens`: `ease`, `breathe`, `duration` (`fast` 0.18, `enter` 0.7, `slow` 0.9, `count` 1.1), `spring` (250 / 30), `springNeedle` (220 / 22), `staggerStep` (0.07), `enter` (variants with a custom index), `enterChild` and `staggerChildren(step, delay)`. The shell wraps every page in `<MotionConfig reducedMotion="user">`.

### Signature moments (built in `ds/instruments` and the screens)

- Dot-matrix numbers light up dot by dot in a soft sweep, then count up to their value with ease-out over 1.1s, starting 0.12s in.
- Thin arcs draw in, score dots land one by one, and the winner dot arrives last with one indigo halo bloom.
- Gauge needles sweep to their value with `springNeedle`.
- The thinking grid breathes as a slow wave of indigo dots; each finished step locks a row in place.
- The "Your people" reveal is the peak: the glow slowly blooms, the audience name appears word by word, then the supporting numbers settle in.

### Reduced motion

Under `prefers-reduced-motion: reduce`: entrance and route animations become plain fades with no delay, tw-animate slide, scale and blur offsets go to zero, `press` and `lift` stop moving, reveals fade without rising, and every loop (`animate-glow`, `animate-drift`, `animate-dot-wave`, `animate-bloom`, `animate-grow-x`, `animate-draw`, `animate-pulse`, the backdrop) is switched off. Framer-motion follows `MotionConfig reducedMotion="user"`.

## Components

All components keep their shadcn exports, props and variants. Additions are noted.

### Button (`ui/button.tsx`)

Square, Geist 500, `press` plus `lift` on filled and outline variants, paper focus outline.

| Size | Height | Text |
| --- | --- | --- |
| `lg` | 56px | 17px |
| `default` | 44px | 15px |
| `sm` | 36px | 14px |
| `xs` | 28px | 13px |
| `icon-lg` / `icon` / `icon-sm` / `icon-xs` | 56 / 44 / 36 / 28px square | |

| Variant | Rest | Hover |
| --- | --- | --- |
| `default`, `accent` | indigo, paper text, faint inner top light | indigo hover with a soft indigo shadow |
| `ink` | paper, navy text | paper 90% |
| `secondary` | paper 8% with a hairline | paper 12%, hairline strong |
| `outline` | transparent, paper 16% line | paper 6%, hairline strong |
| `ghost` | transparent | paper 8% |
| `destructive` | fail 12%, fail text | fail 18% |
| `link` | paper, underline at 40% | underline full |
| `round` (new) | round, transparent, hairline strong edge, 1.5px icon strokes | paper 6%, edge paper 45% |
| `round-accent` (new) | round indigo | indigo hover |

Use `round` with the icon sizes for close, edit, download and similar tools, like the reference x and check buttons. With a text size it becomes a pill ("Sun / Manila").

### Inputs (`ui/input.tsx`, `ui/textarea.tsx`, `ui/native-select.tsx`)

Navy 2 fill, paper 16% border, paper text, placeholder `#7c7c85`. Hover border paper 28%. Focus border `#6262dc` with a 3px indigo ring. Error border fail with a soft fail ring. Disabled 50%. Select options render on navy 2.

### Card (`ui/card.tsx`) and Tile (`ds/tile.tsx`)

`Card` uses `surface-gradient` plus a hairline border. `<Tile>` uses `.tile` (same fill, inset hairline). Interactive tiles get `press lift` and brighten their edge to hairline strong on hover.

### Chip (`ds/chip.tsx`) and Badge (`ui/badge.tsx`)

Square. Chip tones: `neutral` (hairline strong edge, paper 85%), `accent` (indigo, paper), `pass`, `warn`, `fail` (14% tint, tone text). Badge variants as before plus `ink`, `pass`, `warn`, `fail`. Weights are 500.

### Tabs (`ui/tabs.tsx`)

`default`: paper 5% track with an inset hairline; the active trigger is navy 3 with a hairline. `line`: hairline under the list; the active trigger gets a 2px indigo soft bar that grows from the left over 500ms. Content fades and rises 4px.

### Dialog and Sheet

Scrim is navy deep at 72% with no blur. Panels use `surface-gradient`, a hairline strong border and `--shadow-float`. Dialogs rise from a slight blur over 600ms on ease-expo. Close buttons are `round` `icon-sm`.

### Tooltip, dropdown, toast

Navy 3 with hairline strong edges and the float shadow. Toasts are dark theme, bottom center, with mute descriptions and an indigo action.

### Progress (`ui/progress.tsx`), Meter (`ds/meter.tsx`), Skeleton

Progress and meter: 3px round track at paper 10%, indigo to indigo hover fill. Progress moves with a 900ms transform; Meter grows once from zero (`animate-grow-x`). Skeleton is paper 7% with the standard pulse.

### Stat (`ds/stat.tsx`)

Adds `dot` (boolean): renders the value with `dot-num` for hero numbers.

### Top bar (`ds/top-bar.tsx`) and app shell (`hunch/shell`)

Both use the light wordmark `public/brand/wordmark-small-stone.svg` (the shell shows `mark.svg` on phones). The app shell step indicator is minimal: Geist Mono `01` to `07`, 13px labels, a small glowing indigo soft dot under the current step, and 1px lines whose filled part grows from the left. The "Sample run" or "Sample data" chip sits on the right. The `body` carries `page-backdrop dot-grid`. See "The 7-step flow" below.

### Instruments

Dot-matrix numbers, line arcs with score dots, tick dials, dot scatter plots and the thinking grid live in `src/components/ds/instruments`. See that folder for components and props. They always encode real data from the run or report.

## Voice and copy

- Plain everyday English, sentence case, no exclamation marks, no emoji.
- No slogans or AI-sounding words: unlock, seamless, leverage, elevate, empower, magic, journey, proven, real results, guesswork.
- Headlines are short statements that end with a period. A quieter second clause may follow in mute.
- Buttons start with a verb or name the thing, two to four words: "Start a test", "Upload results".
- Labels are bold and short with a muted second line: "Night shift" over "Agents / Pasig".
- Numbers are concrete: pesos with ₱, a period for decimals, a middle dot between facts (8 versions · ₱800 · 4 days).
- Errors say what to do next: "That file has no ad names. Export it again with the Ad name column on."
- Taglish is welcome in generated post copy; interface labels stay in plain English.

## Brand

- Wordmark: `public/brand/wordmark-small-stone.svg` (paper, for dark backgrounds). `wordmark-small.svg` is the navy version for light surfaces such as exported images.
- App icon: `public/brand/mark.svg` (paper h on indigo), also `src/app/icon.svg`.
- Nothing from reference brands is reused: no logos, product names, mascots, 3D scenes, signature interactions, copy or photography.

## Home page

The front page at `/` lives in `src/components/hunch/home`. It is not one of the 7 steps: the prompt box sends its line to `/start?d=<text>`, and "Try with a sample seller" opens `/studio?demo=1`. Every name and number on the page comes from Elle's sample run (`home/data.ts` wraps `demo-snapshot.json`, the same file as `elle/elle-snapshot.json`): the winner, the runner-up, the cost per message and the confidence are read from `report.verdict`, never typed in. Sample views are labeled "Sample data". The page never writes the sample into the store.

### The one idea

One product becomes 8 posts for 8 kinds of buyers, and a small test shows which people respond. The shape is the dot (a person, the same dot as the dot-matrix numbers and dot fields) plus the post cards. The motion is the product bursting into its 8 posts, the 12 audiences not picked flying past, and later one post's people lighting up. The copy says it plainly: "8 posts for 8 kinds of buyers." with the muted tail "A ₱800 test shows which one responds." (the amount is `report.totalSpend`).

### Entrance

Web Animations in `hero/intro.ts`, about 2.8s, once per tab session (`sessionStorage` key `hunch-home-intro`).

| ms | Beat |
| --- | --- |
| 0 to 420 | A paper dot breathes in and sends out one soft ring |
| 330 | The dot opens into the product card; one indigo glow blooms behind it |
| 610 | The card takes a small breath |
| 740 | The 8 posts fly out of the card toward the viewer, 54ms apart, and land on a loose ring; the 12 unpicked audiences show for a beat, then rush past and fade |
| 1560 | The glow drains, the card becomes the prompt box, the kicker and the 11 headline words rise from a soft mask, 50ms apart |
| 1940 to 2800 | Box contents, hint, post labels and header land; the typewriter starts |

Any wheel, key, tap or touch rushes the rest into place in 180ms. Reduced motion gets a 400ms fade. Afterwards the posts drift 4 to 8px, follow the cursor by depth (10px at most) and fly outward as the hero scrolls away; the glow breathes over 10s. Both rest offscreen and on hidden tabs.

### Shared pieces

- **Letter roll** (`letter-roll.tsx`): on every nav link and button label. Letters roll up in a wave 18ms apart while a copy rolls in from below, driven by the nearest `group` parent. Off under reduced motion.
- **Cursor pill** (`cursor-pill.tsx`): a small navy 3 pill that follows the mouse over anything that opens a post ("See the post"). Mouse only, drawn in a portal so moving parents never pull it off the cursor.
- **Post sheet** (`post-sheet.tsx`): every post on the page opens the real post with `usePostSheet().open(id, { tab })`: Made for, Caption (working Copy caption and the 1080 x 1350 download), Checks, First draft and How it did. Arrow keys step through the set.
- **Grain rule**: every gradient carries `<Grain />` (tiled 256px noise, soft-light, 0.1 to 0.32 opacity): the hero glow, the product card, the prompt box, demo frames, the Your people card, the closing band, the wash curtain, the post sheet, and every `.tile` on the page through a `::after` under its content. Post images never get grain.

### Tab wash

On an Audiences tab switch, an indigo-to-navy curtain with grain sweeps down each visible card: 520ms per card, 40ms apart from left to right. The old card leaves under the curtain's lower edge and the new one shows above its upper edge, then the row glides back to its first card. Transforms only; reduced motion gets a crossfade.

### Scroll scenes

- **How it works** pins for 4 viewports. A rail and dot track progress, the previous demo steps back into a stack, and only the active demo loops while it is on screen.
- **Your people** pins for about 3 viewports. Each post's column has one dot per message and its cost per message under it. The headline fades, the winner's dots light indigo while the other posts step back, the winning post lifts out of the row and zooms to the center, then blurs into the Your people card as its glow blooms and the name rises word by word. Phones, short screens and reduced motion get the same beats once, unpinned.
- **Hidden ending**: extra scroll past the footer raises a field of paper dots that slowly light indigo near the cursor.

Ambient motion stays slow and stoppable: the audience row drifts at 36px/s and pauses on hover, focus and touch; demos loop only while visible; everything pauses on a hidden tab. The FAQ answer height is the one layout animation (grid rows, 500ms, measured without dropped frames); everything else moves by transform, opacity and filter.

## The 7-step flow

The app follows the partner build spec: 7 screens, one job and one primary button each. The front page sits before them.

| Step | Route | Primary button |
| --- | --- | --- |
| 1 Start | `/start` | Find my audiences |
| 2 Studio | `/studio` | See your 8 hunches |
| 3 Your 8 hunches | `/audiences` | See your 8 posts |
| 4 Your 8 posts | `/posts` | Set up my test |
| 5 Run the test | `/test` | I have my results |
| 6 Results | `/results` | Plan my next week |
| 7 Next week | `/next-week` | Copy all captions |

- **Shell** (`hunch/shell`): every step page renders `<AppShell step="studio" serverMode={getMode()}>`. Desktop shows the 7 numbered steps; labels appear from 1280px, below that only the current one. Done steps get a check and stay clickable, and so does any later step whose data exists. Phones collapse to "Step 3 of 7 · Your 8 hunches", which opens the list of steps, with 7 thin segments under the header.
- **Primary button on phones**: wrap it in `<StepAction>`. It renders inline from 768px and in a sticky bottom bar on phones (`[data-step-bar]`, navy 92% with blur and a hairline, safe-area padding).
- **Sample label**: the shell shows "Sample data" when sample results or a sample plan are on screen (Results, Next week) and "Sample run" for Elle's replayed run. Typed numbers are the seller's own, so they never read "Sample data". Screens do not repeat the header chip; they add "Sample data" only next to sample numbers (the results grid, the Your people card, the report notes).
- **Width and numbers**: every step uses `<Section width="flow">` (1200px). Doto stays for one or two hero answers per screen (₱100 each on Run the test, ₱7 and 14 on Results); day numbers and list counts use Geist Mono.
- **Empty store**: with no product, run or Studio log saved, any step after Start redirects to `/start`. `?demo=1` skips the redirect and loads Elle's sample for that step. `/focus` redirects to `/next-week`.
- **Rules that hold on every step**: codes A1 to A8 (old H1 to H8 still match), the language is called Tagalog, pesos have no decimals (₱7 per message; exact values only in notes), the measure is cost per message, no exclamation marks, no emoji, no em dashes, and every step works at 375px and 1440px with visible focus.

## File map

| Path | What it holds |
| --- | --- |
| `src/app/globals.css` | Tokens, shadcn mapping, containers, easings, keyframes, base styles, utilities (`display`, `headline`, `eyebrow`, `kicker`, `tabular`, `dot-num`, `spectrum`, `hairline`, `tile`, `glow-indigo`, `surface-gradient`, `dot-grid`, `page-backdrop`, `link-inline`, `link-arrow`, `press`, `lift`, `stagger-*`, `pill`, `pill-accent`), reveal, reduced motion, tab-hidden pause |
| `src/app/layout.tsx` | Font loading, metadata, viewport, body backdrop, toaster, `TabVisibility` |
| `src/app/fonts/*` | Geist, Geist Mono, Doto, Schibsted Grotesk and their OFL licenses |
| `src/components/ui/*` | Restyled shadcn components plus `native-select.tsx` |
| `src/components/ds/*` | Hunch primitives and `motionTokens`, exported from `index.ts` |
| `src/components/ds/instruments/*` | Data instruments |
| `src/components/hunch/shell/*` | App shell, 7-step indicator and phone step menu (`step-indicator.tsx`), step model (`steps.ts`), `StepAction`, `TabVisibility` |
| `src/components/hunch/home/*` | The home page: entrance (`hero/`), story sections (`story/`), post sheet and Your people (`proof/`), shared `Grain`, `LetterRoll`, `CursorPillArea`, `PromptBox` |
| `src/app/design/*` | The living style guide |
