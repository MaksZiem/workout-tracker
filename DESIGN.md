---
name: Workout Tracker
description: A strength-training logger built to the category standard set by Strong and Hevy, dark-first, with a light variant for brightly lit gyms.
colors:
  graphite-ground: "oklch(0.155 0.006 262)"
  graphite-surface: "oklch(0.2 0.007 262)"
  graphite-muted: "oklch(0.245 0.008 262)"
  graphite-strong: "oklch(0.3 0.01 262)"
  chalk-foreground: "oklch(0.96 0.003 262)"
  slate-muted: "oklch(0.71 0.012 262)"
  hairline-border: "oklch(0.3 0.009 262)"
  signal-blue: "oklch(0.66 0.17 256)"
  signal-blue-foreground: "oklch(0.99 0 0)"
  signal-blue-tint: "oklch(0.29 0.06 258)"
  done-green: "oklch(0.7 0.15 152)"
  done-green-foreground: "oklch(0.16 0.03 152)"
  done-green-tint: "oklch(0.28 0.05 152)"
  record-gold: "oklch(0.82 0.14 82)"
  record-gold-foreground: "oklch(0.2 0.04 80)"
  record-gold-tint: "oklch(0.31 0.06 80)"
  danger-red: "oklch(0.7 0.17 25)"
  danger-red-tint: "oklch(0.29 0.06 25)"
typography:
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
    letterSpacing: "-0.025em"
  title-lg:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.75rem"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.375
  body-control:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.5
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
  meta:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"tnum\""
  data-cell:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: "1.5rem"
    fontFeature: "\"tnum\""
  stat:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
    fontFeature: "\"tnum\""
  label-column:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.025em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  sheet: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  sheet-gutter: "20px"
  xl: "24px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.signal-blue-foreground}"
    typography: "{typography.body-control}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-primary-compact:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.signal-blue-foreground}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-accent-tint:
    backgroundColor: "{colors.signal-blue-tint}"
    textColor: "{colors.signal-blue}"
    typography: "{typography.body-control}"
    rounded: "{rounded.md}"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.graphite-muted}"
    textColor: "{colors.chalk-foreground}"
    typography: "{typography.body-control}"
    rounded: "{rounded.md}"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.graphite-strong}"
  set-check:
    backgroundColor: "{colors.graphite-strong}"
    textColor: "{colors.slate-muted}"
    rounded: "{rounded.md}"
    size: "44px"
  set-check-done:
    backgroundColor: "{colors.done-green}"
    textColor: "{colors.done-green-foreground}"
    rounded: "{rounded.md}"
    size: "44px"
  number-cell:
    backgroundColor: "{colors.graphite-strong}"
    textColor: "{colors.chalk-foreground}"
    typography: "{typography.data-cell}"
    rounded: "{rounded.md}"
    height: "44px"
  set-row-active:
    backgroundColor: "{colors.graphite-muted}"
    rounded: "{rounded.md}"
    padding: "4px 6px"
  set-row-done:
    backgroundColor: "{colors.done-green-tint}"
    rounded: "{rounded.md}"
    padding: "4px 6px"
  list-card:
    backgroundColor: "{colors.graphite-surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
  entry-card:
    backgroundColor: "{colors.graphite-surface}"
    textColor: "{colors.chalk-foreground}"
    rounded: "{rounded.lg}"
    padding: "12px"
  entry-card-compact:
    backgroundColor: "{colors.graphite-surface}"
    rounded: "{rounded.lg}"
    padding: "10px"
  entry-card-completed:
    backgroundColor: "{colors.done-green-tint}"
    textColor: "{colors.chalk-foreground}"
    rounded: "{rounded.lg}"
    padding: "12px"
  entry-card-skipped:
    backgroundColor: "transparent"
    textColor: "{colors.chalk-foreground}"
    rounded: "{rounded.lg}"
    padding: "12px"
  entry-card-action:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.signal-blue-foreground}"
    rounded: "{rounded.md}"
    height: "40px"
  sheet:
    backgroundColor: "{colors.graphite-surface}"
    textColor: "{colors.chalk-foreground}"
    rounded: "{rounded.sheet}"
    padding: "16px 20px"
  pr-medal:
    backgroundColor: "{colors.record-gold}"
    textColor: "{colors.record-gold-foreground}"
    rounded: "{rounded.full}"
    size: "32px"
  toast-default:
    backgroundColor: "{colors.chalk-foreground}"
    textColor: "{colors.graphite-ground}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  toast-pr:
    backgroundColor: "{colors.record-gold}"
    textColor: "{colors.record-gold-foreground}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
---

# Design System: Workout Tracker

## Overview

**Creative North Star: "The Gym Standard"**

This is the category canon for strength logging, played straight, with Strong and Hevy as the bar for craft. Nothing is invented here. The set table has a checkmark column, last session's numbers sit inline, and one blue accent marks every action. The world is dark graphite first, because the phone is usually out between sets under gym lighting. A light variant for bright gyms comes in automatically through `prefers-color-scheme`, and every role token has a value in both modes.

The screens are dense but easy to hit. The main unit is a table row, not a card. Targets are 44 to 48px tall, and the check sits in the far-right column under the right thumb. Hierarchy comes from one sans face at weight 600 against 400. Colour carries meaning: blue means act, green means done, gold means a record was beaten, red means danger or failure. The only motion is a short sheet rise and a single medal pop when a PR lands. Both sit inside `prefers-reduced-motion: no-preference`.

The system turns away from invented worlds, novelty chrome, and ironic or quirky reinterpretations of the category conventions. The owner confirmed that brand commitment when they chose the canon.

**Key Characteristics:**
- Dark-first graphite surfaces with an automatic light variant; every colour is a role token defined for both schemes.
- A single blue accent for primary actions, focus, the active timer, progress, and exercise titles.
- Colours carry state: green for a completed set or a completed scheduled workout, gold only for personal records, red for danger and overdue plans.
- One face (Geist), tabular numerals wherever a number can change, and weight 600 as the only emphasis step.
- Flat, tonal layering. Shadows appear only on floating overlays.
- Touch targets of at least 44px, and the completion check under the right thumb.

## Colors

The palette is neutral graphite in cool 260-hue greys, with four semantic hues, each kept to a single meaning. The frontmatter values are the dark (primary) scheme. The light-scheme counterparts are defined in `frontend/app/globals.css` and recorded in the sidecar.

### Primary
- **Signal Blue** (`signal-blue`): the only action colour. Used for primary buttons (Start, Finish, Finish workout), the focus outline and caret, the elapsed-time readout, the progress-bar fill, exercise titles, the active nav "log" button, and text links. On the planner it fills the single primary "Generuj z planu" button and the entry card's Rozpocznij/Kontynuuj action, marks today (a filled 28–32px circle behind the date number, blue weekday text), rings the selected month day over a Signal Blue Tint fill, and colours the "Dziś" and "Dodaj trening" quiet links. **Signal Blue Tint** (`signal-blue-tint`) is the fill for the secondary-but-affirmative "Add exercise" button and for link hover.

### Secondary
- **Done Green** (`done-green`): completion only. It fills the checked set's check button solid, and **Done Green Tint** (`done-green-tint`) washes the whole completed set row. On the planner a completed scheduled workout gets the same pairing: the entry card is filled Done Green Tint with its border dropped, and its status row reads "Wykonany" in Done Green behind a check icon. In the month grid a completed entry is a Done Green dot.

### Tertiary
- **Record Gold** (`record-gold`): personal records only. Used for the circular medal that replaces the set number, the PR toast, the PR count in the finish summary, and the per-exercise medal on the finish list.

### Neutral
- **Graphite Ground** (`graphite-ground`): the page background, and the sticky header at 85–95% opacity with a backdrop blur.
- **Graphite Surface** (`graphite-surface`): raised planes, meaning sheets, the sidebar, the mobile tab bar, list cards, and menus.
- **Graphite Muted** (`graphite-muted`): the quiet fills. The active set row, secondary buttons, the search field, and hover states on rows and icon buttons.
- **Graphite Strong** (`graphite-strong`): the editable fills. Number cells, the unchecked check button, the progress track, hover on secondary buttons, and the scrollbar thumb.
- **Chalk Foreground** (`chalk-foreground`): primary text, plus the fill of the neutral toast (inverted).
- **Slate Muted** (`slate-muted`): metadata, previous-set numbers, column headers, and inactive nav.
- **Hairline Border** (`hairline-border`): 1px dividers, the sticky-header rule, the stepper outline, and card and menu strokes.
- **Danger Red** (`danger-red`) with **Danger Red Tint** (`danger-red-tint`): destructive menu items, save-failure retry links, invalid number input, form errors, and the planner's overdue status (a red "Zaległy" status row with a warning-triangle icon, and a red dot in the month grid).

### Named Rules
**The One Blue Rule.** Blue is the only colour that means "you can do something here." It never appears as decoration, and no second action colour exists.

**The Gold Is Earned Rule.** Record Gold appears only when a set beats a personal record, or when a record is being reported. It is never used for emphasis, badges, premium cues, or warnings.

**The Green Means Done Rule.** Done Green marks completed work and nothing else: a completed set, or a scheduled workout that was completed. A completed row or entry card is tinted in full, and its check is green (solid on the set check, a green check icon beside "Wykonany" on the entry card).

## Typography

**Display Font:** none (the system has no display tier)
**Body Font:** Geist (via `next/font`, latin + latin-ext subsets for Polish), falling back to the system sans
**Label/Mono Font:** none in use. The UI relies on Geist's tabular figures instead.

**Character:** A single, neutral, modern grotesk. Hierarchy comes from size and a 600/400 weight split. It never comes from a second family or from decorative styling.

### Hierarchy
- **Headline** (600, 24px rising to 30px at `sm`, tracking −0.025em): page titles, such as the picker title and auth titles.
- **Title Large** (600, 20px, tracking −0.025em): the workout header date, sentence-cased from the first letter.
- **Title** (600, 17px): exercise names (in Signal Blue) and picker row titles.
- **Body Control** (500–600, 15px): button labels, list items in sheets, and the search input.
- **Body** (400, 14px): sheet copy, menu items, and form labels.
- **Meta** (400, 13px, tabular): the previous-set line, muscle-group lines, and header counters.
- **Data Cell** (600, 16px, tabular, centred): weight and rep inputs. 16px also stops iOS from zooming on focus.
- **Stat** (600, 24px, tabular): the finish-summary figures.
- **Column Label** (600, 11–12px, uppercase, tracking 0.025em, Slate Muted): only for set-table column headers and muscle-group section headers in lists.

### Named Rules
**The Tabular Numbers Rule.** Every number that changes or lines up with another number uses tabular figures: weights, reps, timers, counts, and stats.

**The One Face Rule.** Geist is the only face. Use weight 600 for emphasis. Never add a display face, and never use italics or a monospace for data.

## Layout

The logger is one column capped at 576px (`max-w-xl`) and centred inside the app shell's 1024px content area. The shell pads 16px on phones, 24px at `sm`, and 40px at `md`, with a 256px sidebar from `md` up. On phones a 64px bottom tab bar replaces the sidebar, and the content keeps 112px of bottom padding so the bar never covers it.

The set table is a fixed five-column grid shared by the header and every row: set number (36px) | previous (flexible) | kg (84px) | reps (84px) | check (44px), with an 8px column gap. When a row is active, a second line of the same grid appears under it, holding steppers aligned to the kg and reps columns.

Spacing rhythm: 4px between set rows, 8–12px inside groups, 24px from the header to content, and 32px between exercise blocks. Sheets use a 20px side gutter.

The workout header is sticky. It holds the date and muscle groups, the Finish button, and then a counter line with the elapsed time, the sets done/total, and a 6px progress bar.

### Planner
The planner uses the full 1024px content area rather than the logger's 576px column. The header is two rows. The first row holds the page headline and a fixed-height (20px) "N z M wykonanych" summary on the left, and on the right a Tydzień/Miesiąc segmented control (a Graphite Muted track with 4px padding; the current option is a Surface fill with foreground text, 36px tall) followed by the single Signal Blue primary, "Generuj z planu" (44px, calendar-plus icon). On phones that row spans the full width and the primary pushes to the right edge. The second row is always in the order ‹ Dziś › and then the range label (16px/600, tabular). The chevrons are 40px round muted icon buttons. "Dziś" is a 40px quiet text link: muted while today is inside the visible range, and Signal Blue (hovering to Signal Blue Tint) once the user has navigated away from it.

**Week (default view).** From `xl` up the week is seven equal columns with an 8px gap, each at least 288px tall. Each column has a 40px day header (muted short weekday, 14px/600 date, hairline rule underneath), then compact entry cards, then a 36px muted "+" add button, with a muted "Odpoczynek" beside it on empty days when the week has any plans. Below `xl` the week becomes a vertical day list divided by hairlines. A day with entries has a 48px stacked date column (weekday, 20px/600 date, 11px month) beside full-size entry cards and a trailing "+". An empty day collapses to a single inline row, with the weekday, date, and month in one 112px baseline and then "Odpoczynek" and the "+" button, so the whole week fits on a phone screen.

**Month.** A grid of full Monday-first weeks, 7 columns with a 4px gap under muted short weekday labels. Cells are 8px-cornered buttons, 56px tall on phones and 96px from `md`. Days outside the month are shown at 40% opacity. Hover gives a Graphite Muted fill, and the selected day has a Signal Blue Tint fill with a 1px Signal Blue ring. From `md` a cell lists up to two entries as template labels (12px, 16px line height, led by a 6px status dot). A single entry wraps to two lines and two entries clamp to one line each, with a muted tabular "+N" for the rest. Skipped labels are muted and struck through. On phones a cell shows up to three 6px status dots instead of labels. The selected day's full entry cards and a "Dodaj trening" link open in a panel below the grid (two card columns from `sm`), and only from `2xl` does that panel sit beside the grid as a 272px column.

**The Thumb Column Rule.** The completion check always sits in the far-right column and is at least 44px square, so the right thumb can reach it while the phone is held one-handed.

**The 44 Floor Rule.** No interactive element on the logging surface is shorter than 44px, except compact header actions (40px) and icon buttons (40px round).

## Elevation & Depth

The system is flat and builds depth through tonal steps: Ground, then Surface, then Muted, then Strong. Each step reads as nearer and more interactive. Resting surfaces carry no shadow. List cards sit on Ground with a hairline border and no shadow. Shadows exist only on elements that float above content and might overlap it: the action menu popover and the toast. Modal sheets use a native dialog backdrop (black at 50%) rather than their own shadow.

### Shadow Vocabulary
- **Popover** (`box-shadow: 0 8px 24px -8px oklch(0 0 0 / 0.35)`): action menus that drop from a set number or an exercise's overflow button.
- **Toast** (`box-shadow: 0 12px 32px -12px oklch(0 0 0 / 0.5)`): the bottom toast for undo, offline, PR, and AI results.

### Named Rules
**The Tonal Stack Rule.** Depth is shown by stepping up the surface ramp, not by adding shadows. A shadow means the element floats over other content.

## Shapes

Corners are soft and they nest. Controls, rows, and buttons use 8px. Menu items and shell nav rows, which sit inside those containers, use 6px. List cards and toasts use 12px. Sheets use 16px, on the top corners only when they are bottom sheets on phones and on all corners when centred on desktop. Round shapes are reserved for icon buttons, avatars, the PR medal, the primary tab-bar button, and the progress bar. Borders are always 1px Hairline Border. Steppers are a single outlined pill split by a 1px divider, not two separate buttons.

## Components

### Buttons
Buttons are solid, full-width on phones, and confident without being loud.
- **Shape:** gently rounded (8px).
- **Primary:** Signal Blue fill with white 15px/600 text, 48px tall, and 20px horizontal padding. The header Finish button is the 40px compact size. Hover lowers opacity to 90%. When pending, the button is disabled at 60% opacity with a wait cursor, and its label changes to the in-progress verb.
- **Accent Tint:** a Signal Blue Tint fill with blue text, for the second affirmative action (Add exercise).
- **Secondary:** a Graphite Muted fill with foreground text that steps to Graphite Strong on hover. Used for Add set, Add from description, and Empty workout.
- **Quiet:** transparent with muted or blue text, taking a Muted or Tint fill on hover (Cancel, To planner).
- **Focus:** the global 2px Signal Blue outline with a 2px offset.

### Set Row (signature)
This is the core of the product.
- **Default:** transparent, showing the set number, the previous numbers (tap to copy), two number cells, and the check.
- **Active:** a Graphite Muted wash, with a stepper line underneath (±2.5 kg, ±1 rep).
- **Completed:** a Done Green Tint wash. The number cells drop their fill, and the check turns solid Done Green with a heavier stroke.
- **Record:** the set number is replaced by a 32px round Record Gold medal holding a trophy icon, which pops in once.
- **Sync:** unsaved rows show a muted cloud-off note. A failed save shows a red underlined retry link.

### Number Cell
A Graphite Strong fill with 8px corners, 44px tall, and centred 16px/600 tabular text. Focus shows a 2px Signal Blue ring. An invalid draft turns the text Danger Red. The whole value is selected on focus so the next keystroke replaces it.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** Graphite Surface on the Ground page.
- **Shadow Strategy:** none (see the Tonal Stack Rule).
- **Border:** 1px Hairline Border.
- **Internal Padding:** 16px.
- Cards are used for picker rows and for planner entry cards (scheduled workouts; see Entry Card), plus the planner's single empty-state panel (20px padding). Exercise blocks are open sections, not cards.

### Entry Card (planner)
One scheduled workout, used in the week columns, the phone day list, and the month's selected-day panel.
- **Shape:** 12px corners, 1px border, 12px padding (10px in the compact variant used in the 7-column desktop week). No shadow.
- **Structure:** the template name as the title (15px/600, or 14px when compact, snug leading, breaking onto as many lines as it needs, typically two in the compact column), linked to the template unless skipped. Under it sits a 12px muted tabular meta line with the exercise count. Then comes the status row: a 12px status label with an optional 14px icon on the left and a 36px round muted ⋯ button on the right that opens the Action Menu (view workout, move, skip, restore, delete in Danger Red). Last is the action slot, a full-width 40px Signal Blue button with 14px/600 text. It reads "Rozpocznij" for a planned entry dated today and "Kontynuuj" for an entry in progress. Otherwise the slot is left out.
- **Status vocabulary:**
  - **Zaplanowany (Planned):** a Surface fill with a Hairline Border and a muted status label with no icon.
  - **W trakcie (In progress):** the Planned card, with the status in foreground weight 500 behind a CircleDot icon. Blue appears only on the Kontynuuj button.
  - **Wykonany (Completed):** a Done Green Tint fill with the border made transparent, and the status in Done Green weight 500 behind a check icon (see the Green Means Done Rule).
  - **Pominięty (Skipped):** a dashed Hairline Border on a transparent fill, with the status in muted text behind a skip-forward icon. The title stays at full foreground contrast. The card is never dimmed, only unlinked.
  - **Zaległy (Overdue):** derived on the client, not stored. It applies to a planned entry whose date is before today. The card keeps the Planned surface, and the status reads in Danger Red weight 500 behind a warning-triangle icon.
- **Month-grid dots** (6px round): Planned is Slate Muted, In progress is Chalk (foreground; blue stays reserved for actions), Completed is Done Green, Skipped is a 1px Slate Muted ring with no fill, and Overdue is Danger Red.

### Inputs / Fields
- **Style:** the search field is a Graphite Muted fill, 44px, 8px corners, and a leading muted search icon. Auth fields are a Surface fill with a hairline border and 6px corners.
- **Focus:** the Signal Blue caret plus the global blue outline. Auth fields shift their border to blue.
- **Error:** Danger Red text, with a Danger Red Tint panel for form-level errors.

### Sheets
A native modal dialog. On phones it is a bottom sheet (16px top corners, max 88dvh), and from `sm` it is a centred 512px panel. The title row pairs a 16px/600 title with a 40px round close button. The body scrolls. An optional footer sits above a hairline and respects the safe-area inset. It enters with a 220ms rise and fade.

### Action Menu
A 176px-minimum popover on Surface with a hairline border, 8px corners, 4px inner padding, and the Popover shadow. Items are 14px text in 6px-cornered rows. Destructive items are Danger Red and hover to Danger Red Tint.

### Navigation
On desktop, a 256px Surface sidebar with grouped links (14px, 6px rows). The active link gets a Graphite Muted fill and weight 500. Inactive links are muted and hover to foreground. On phones, a five-slot bottom tab bar with 11px labels, where the centre "log" slot is a 36px round Signal Blue button. A "More" slot opens a bottom sheet.

### Toast
A bottom-centred bar, max width 384px, with 12px corners and the Toast shadow. The neutral version is inverted (foreground fill, ground text) and has an underlined Undo. The error version uses Danger Red. The PR version uses Record Gold with a trophy icon.

## Do's and Don'ts

### Do:
- **Do** use Signal Blue for every primary action, focus state, and progress indicator, and for nothing decorative.
- **Do** keep the five-column set grid (36px | flexible | 84px | 84px | 44px) identical across the header and every row.
- **Do** use tabular figures for every weight, rep, time, and count.
- **Do** keep interactive targets at 44px or taller on the logging surface, with the check in the far-right column.
- **Do** define every new colour as a role token with both a light value and a dark value in `globals.css`.
- **Do** show depth by stepping Ground, Surface, Muted, Strong, and keep shadows for floating overlays only.
- **Do** gate motion behind `prefers-reduced-motion: no-preference`, and keep it to the sheet rise (220ms) and the PR pop (420ms).

### Don't:
- **Don't** use Record Gold for anything except a personal record.
- **Don't** use Done Green for anything except a completed set or a completed scheduled workout.
- **Don't** nest cards inside cards. Exercise blocks are open sections, not containers.
- **Don't** add a second typeface, a display face, or monospace data. Geist and its tabular figures cover everything.
- **Don't** put uppercase tracked labels above headings. Uppercase is only for table column headers and list-group headers.
- **Don't** add shadows to resting surfaces, cards, or buttons.
- **Don't** add invented-world chrome, novelty treatments, or ironic takes on category conventions.
