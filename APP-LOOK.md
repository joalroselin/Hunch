# App look

The app screens (`/start` to `/next-week`) share the landing page's Sunset paper look. Read `src/components/hunch/home/LOOK.md` and `COPY.md` first: everything there holds here. This file adds what a screen builder needs for the app. The reference screen is `/start` (`src/components/hunch/flow/start/`).

The old navy and indigo system is retired. `DESIGN.md` describes it and is out of date.

## Where things live

| File | What |
|---|---|
| `src/app/globals.css` | Tokens on `:root`, Tailwind theme, the old utility names with new values |
| `src/app/app-look.css` | The `ha-*` classes (components layer, so a Tailwind utility on the same element wins) |
| `src/components/hunch/home/look.css` | The `hh-*` classes, loaded on every route by `layout.tsx` (unlayered, so they beat utilities) |
| `src/components/hunch/shell/` | `AppShell`, the step row, `Screen`, `ScreenTitle`, `Bubble`, `EmptyScreen`, `LoadingScreen`, `Wordmark`, `StepAction` |
| `src/components/ui/` | `Button`, `GoLink`, `Input`, `Textarea`, `NativeSelect`, `Tabs`, `Dialog`, `Sheet`, `DropdownMenu`, `Tooltip`, toasts |
| `src/components/hunch/flow/start/start.css` | A screen's own layout CSS. Give each screen one file like it, with a 2-letter prefix (`hs-` is Start) |

## Tokens

Use these names in new work: `--cream`, `--cream-deep`, `--sheet`, `--ink`, `--ink-soft`, `--tint`, `--tint-strong`, `--gold`, `--persimmon`, `--chili`, `--rose`, `--sun`, `--drop`, `--drop-out`, `--bubble`, `--bubble-out`, `--shadow-object`, `--shadow-sheet`, `--shadow-slip`, `--shadow-well`, `--gutter`, `--bar`. Tailwind has `bg-cream`, `bg-cream-deep`, `bg-sheet`, `text-ink`, `bg-gold`, `bg-persimmon`, `bg-chili`, `bg-rose`, `bg-(--tint)`.

The old names still resolve so unrebuilt code stays readable: `--navy` is cream, `--paper` is ink, `--mute` is ink at 62%, `--action` is ink, `--action-soft` is chili, `--hairline` is ink at 12%, `font-mono` is Bricolage. Do not build on them. When you rebuild a screen, take them out of it: no `text-mute`, no `border-hairline`, no `font-mono`, no `bg-navy-*`.

Status text colors that pass on cream and sheet: `--pass`, `--warn`, `--fail`, `--live`. Use them for a word, never as a tinted pill.

## The screen

```tsx
<Screen>
  <ScreenTitle title="Type what you sell." line="Add a photo, a price and where you sell." />
  ...one hero object and the controls...
  <StepAction><GoLink href="/posts">See your 8 posts</GoLink></StepAction>
</Screen>
```

- `Screen` is the page container (`.ha-page`): content starts at `var(--gutter)` on the left, the same edge as the header wordmark and the landing page. No centered column.
- `ScreenTitle` is the one heading and its one support line (`hh-title ha-h1`, `hh-line ha-line`). A string title rises word by word. `size="h2"` for a second block on a long screen. Never add a kicker, a chip row or a second paragraph above or below it.
- Every screen has one hero object, and it is the product: a post in a phone frame, the 8 posts, the winning post. On `/start` the phone is the photo picker. Give posts 3 sizes and let one lead; no grid of equal cards.
- Posts are always `UgcPost` or `HomePost` from `home/ugc-post.tsx` with the real photo. Wrap one in a `<button>` to open it. Set `--ugc-shadow: var(--shadow-object)` on the wrapper and tilt it 3 to 9 degrees. Do not name layout variables `--x`, `--y`, `--size` or `--tilt` near a post.
- A paper object is `.ha-sheet` (sheet color, 24 px radius, `--shadow-sheet`, no border). Use it for something you could pick up: a receipt of numbers, the CSV, a caption. Not as a wrapper around every block. Text and controls can sit straight on cream.
- Result numbers use `hh-dot` (Doto). Counts that are not results are plain text.
- Color fields (`hh-field hh-field-sili` and the others, always with `hh-grain`) are for the one moment of a screen that deserves a poster: the winner, the week. At most one per screen.

## Controls

| Need | Use |
|---|---|
| The step's forward action | `<GoLink href>` or `<Button variant="go" size="lg">`: the ink pill that ends in the drop. One per screen, inside `StepAction` so phones get it in the bottom dock. The label is a plain string. |
| Any other strong action | `<Button>` (ink pill). A plain string label rolls on hover. |
| A quiet action | `<Button variant="secondary">` (tint pill) or `variant="ghost"` |
| A text link | `className="ha-link"` (bold, 1.5 px underline) |
| Toggle one of several on | `<button className="ha-chip" aria-pressed>`: tint when off, ink when on |
| Pick one of a few | `<div className="ha-seg" role="radiogroup">` with `role="radio" aria-checked` buttons, or `Tabs` (both variants render as this segmented control; there is no underlined tab row) |
| Text field | `Input`, `Textarea`, `NativeSelect` (`.ha-field`): a slip of paper on cream, a pressed well on a sheet or dialog. Focus is a 2 px ink ring. |
| The one big field of a screen | `className="ha-field ha-field-lg"` |
| Field label | `className="ha-label"` above the control. No hint line under it; if the control needs explaining, change the label. |
| Caption or note | `className="ha-note"`, at most one per screen, next to the forward button |
| The app says something once | A toast (`toast.success("Caption copied.")`, see `flow/shared/share.ts`) or `<Bubble>` next to the thing it is about. Both are ink message bubbles with the drop as their mark. Errors use the same bubble. |
| Nothing to show | `<EmptyScreen title line href action />` |
| Loading saved state | `<LoadingScreen />` |
| Dialog, side sheet, menu, tooltip | The `ui/` components as they are |

`Chip`, `Badge`, `GlowCard`, `Tile`, `Card`, `FlowHeader`, `ScreenHero`, `BlockHeader`, `StatusMark`, `SampleLabel` and `StepFooter` still render in the new look so old screens hold together, but they are the old patterns. Do not use `Chip`, `Badge`, `GlowCard`, `FlowHeader` or `ScreenHero` in a rebuilt screen.

## Shell

- Header: wordmark, the 7 step names, and "Sample run" or "Sample data" as plain text. One small drop sits before the current step and travels there from the step the seller came from. Below 1024 px the step row becomes a menu with a thin sunset line for progress.
- Steps that cannot be opened yet are ink at 36%. No numbers, no checks, no connecting lines.
- Phones: `StepAction` moves the forward button into a dock at the bottom (`.ha-dock`). Keep `main`'s bottom padding.
- The shell says the run is a sample. Screens do not repeat it with their own chip.

## Motion

- Arrivals: `ha-rise` with `style={{ "--i": n }}` for a 70 ms stagger, or `Appear` from `screens/shared.tsx` for things below the fold.
- An object lands: it comes up 36 px and settles from 11 to 4 degrees over 1.1 s (`hs-land` in `start.css`).
- A photo arriving in a frame comes up through the drop's color (`hs-develop`).
- Idle: one object per screen drifts 7 px over 8 s. Hover: a post lifts 3 px, the go button's drop turns its tail up, pill labels roll. Nothing else moves.
- Everything has a `prefers-reduced-motion` branch that fades only. Check each screen with it on.

## Copy

Enter's voice, from `COPY.md`: headings of 7 words or fewer, verb first, one idea; exactly one support line; concrete nouns (₱100, 3 days, 8 posts, Facebook, messages); sentence case; no exclamation marks; nothing that explains how Hunch reasons. Pro-tool rules on top: no "we", "us" or "I" from the app, no greetings, no questions from the app, no cute verbs, no " · " strings, no counters ("3 of 8", "01"), no codes shown to the seller ("A3") where the audience name will do. A label names exactly what it shows. Toasts are a noun and a past participle with a period: "Caption copied."

Copy now in the app (keep these when you rebuild):

| Screen | Heading | Support line | Forward button |
|---|---|---|---|
| `/start` | Type what you sell. | Add a photo, a price and where you sell. | Write my 8 posts |
| `/studio` | the live line from the run | none | See your 8 hunches |
| `/audiences` | Meet your 8 hunches. | Read who each kind of buyer is. Each one gets a post. | See your 8 posts |
| `/posts` | Post these 8. | Copy each caption and save its image. | Run the test |
| `/test` | Boost all 8 the same. | Give every post the same budget, days and goal. | Add my results |
| `/results` (entry) | unchanged, yours to write | | See who messaged |
| `/results` (verdict) | {Audience name} messaged most. | | Get next week's posts |
| `/next-week` | Post to them next week. | Post 6 days for {winner} and 1 for {runner-up}. | |

Other strings: empty states read "No posts yet." with "Type what you sell to get 8 posts."; the phone asks "Add a product photo"; photo errors are "Not a photo. Use a JPG, PNG or WebP." and "Over 10 MB. Use a smaller photo."; Start's missing-field bubble is "Add a photo and where you sell first."; post actions are "Copy the caption" and "Save the image"; the sample notes are "Elle's sample. It runs without your photo." and "Sample run of Kaye's Matcha. Your product's name and price go into it."

Still to remove when the screens are rebuilt (they survive inside cards and sheets): "Kept because", "Buying moment", "The angle", "for themselves / to share" tags, the `A1` codes as labels, "20 ideas · 8 kept · 12 cut", "round 1", "What the Reviewer checked", "Fixed in review", "High confidence" pill, "What this means", "Written for the sample data", "Lower is better", "Day 04", "Testing runner-up" chip, the Notes mock in `PostCanvas` previews, the dashed empty boxes in the Studio columns, the "01" row numbers in the Studio.

## Avoid

Everything in LOOK.md's Banned list, plus, for the app: a sheet around every block; a label and a gray hint on every field; icons inside buttons (the drop on the go button is the only one); a disabled forward button where a bubble could say what is missing; two forward buttons; status as a colored pill; `rounded-none` and 1 px borders; any gray text (use ink, or ink at 36% for a step that cannot be opened); em dashes.

## Checks

`npx tsc --noEmit`, `npx eslint src`, `npx vitest run`. Capture each screen at 1440 and 390 with and without `?demo=1`, and once with reduced motion. Keep `?demo=1`, the Studio replay and Shift+Right, the CSV upload and manual entry, and the copy and save buttons working.
