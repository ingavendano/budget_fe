# Design System Specification: The Architectural Ledger

## 1. Overview & Creative North Star
### The Creative North Star: "The Digital Private Bank"
This design system moves away from the cluttered, "utility-first" look of traditional fintech. Our goal is to create an experience that feels like a bespoke private banking suite—authoritative yet breathable. We achieve this through **Editorial Precision**: a layout strategy that prioritizes high-contrast typography scales, intentional asymmetry, and deep tonal layering over traditional grid lines and borders.

The "template" look is the enemy. By using overlapping surfaces and varying levels of transparency, we create a UI that feels curated, not generated.

---

## 2. Color & Atmospheric Depth
Our palette is anchored in a sophisticated Deep Teal (`primary: #004253`), supported by a range of cool-toned neutrals that provide a foundation of stability and trust.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. Structural separation must be achieved exclusively through background shifts. For example, a `surface-container-low` component should sit on a `surface` background to create a soft, edge-to-edge transition.

### Surface Hierarchy & Nesting
Treat the interface as a series of physical layers—like stacked sheets of frosted glass.
- **Base Layer:** `surface` (#f8f9fa)
- **Secondary Sectioning:** `surface-container-low` (#f3f4f5)
- **Primary Content Cards:** `surface-container-lowest` (#ffffff) for maximum "pop" and perceived elevation.
- **Deep Insets:** Use `surface-dim` (#d9dadb) for inactive or backgrounded utilities to pull them away from the user's focus.

### The Glass & Gradient Rule
To add "soul" to the financial data:
- **Hero CTAs:** Use a subtle linear gradient from `primary` (#004253) to `primary-container` (#005b71) at a 135-degree angle.
- **Floating Modals:** Use `surface_container_lowest` with a `0.8` opacity and a `16px` backdrop-blur to create a "Glassmorphism" effect, allowing the deep teals of the background to bleed through softly.

---

## 3. Typography
We utilize a dual-font strategy to balance character with extreme legibility.

*   **Display & Headlines (Manrope):** Our "Executive" voice. Manrope’s geometric yet warm curves provide a modern, high-end feel. Use `display-lg` (3.5rem) for balance overviews to command attention.
*   **Body & Labels (Inter):** Our "Functional" voice. Inter is used for all data points, form labels, and granular financial details. Its high x-height ensures that a `label-sm` (0.6875rem) remains legible even on mobile devices.

**Hierarchy Tip:** Never settle for uniform weights. Pair a `headline-sm` (Bold) with a `body-md` (Regular) to create a clear "Title-to-Detail" relationship without needing a divider.

---

## 4. Elevation & Depth
Depth is a tool for focus, not just decoration.

### The Layering Principle
Avoid "card-on-gray-background" clichés. Instead, stack your tiers:
1. **Background:** `surface`
2. **Sub-Section:** `surface-container`
3. **Interactive Element:** `surface-container-lowest`

### Ambient Shadows
When an element must float (e.g., a Bottom Sheet or a FAB), use an **Ambient Shadow**:
- **X: 0, Y: 8, Blur: 24px, Spread: -4px.**
- **Color:** Use `on-surface` (#191c1d) at 6% opacity. This mimics natural light and prevents the UI from looking "dirty."

### The "Ghost Border" Fallback
If contrast is legally required for accessibility, use a **Ghost Border**: `outline-variant` (#bfc8cc) at **15% opacity**. It should be felt, not seen.

---

## 5. Components & UI Primitives

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`), white text, `xl` (1.5rem) roundedness.
- **Secondary:** `secondary-container` fill with `on-secondary-container` text. No border.
- **Tertiary:** `surface-container-low` fill. Use for low-emphasis actions like "Cancel."

### Input Fields
- **Container:** `surface-container-highest` (#e1e3e4) with `md` (0.75rem) rounded corners.
- **Active State:** Change background to `surface-container-lowest` and apply a `px` Ghost Border in `primary`.
- **Error:** Background stays the same, but the label and a bottom 2px indicator shift to `error` (#ba1a1a).

### Cards & Data Tables
- **Strict Rule:** Forbid the use of divider lines. 
- **The Financial Row:** Use a vertical spacing of `spacing-4` (1rem) between items. Use a subtle hover state change to `surface-container-high` to indicate interactivity.
- **Data Columns:** Align headers (`label-md`) to the baseline of the data, using `on-surface-variant` to de-emphasize the label relative to the currency value.

### Financial Progress Bars (The Pulse)
For budget tracking, use a `primary-fixed` background for the track and a `primary` fill. For category-specific colors (e.g., "Dining" or "Rent"), utilize the `tertiary` (#00443c) and `secondary` (#4e6266) ranges.

---

## 6. Do's and Don'ts

### Do:
- **Do** use `spacing-12` (3rem) or more for top-level section margins to create an "editorial" feel.
- **Do** use `rounded-full` (9999px) for status chips (e.g., "Cleared," "Pending") to differentiate them from square-ish buttons.
- **Do** leverage `surface-tint` at 5% opacity over images to keep them on-brand.

### Don't:
- **Don't** use pure black (#000000) for text. Always use `on-surface` (#191c1d) for a softer, premium look.
- **Don't** use standard "Drop Shadows" from a software preset. Always tint and diffuse.
- **Don't** use borders to separate list items. Use white space (`spacing-3`) and tonal shifts.
- **Don't** crowd the screen. If the data is complex, use "Progressive Disclosure" (expandable cards) to keep the initial view clean.