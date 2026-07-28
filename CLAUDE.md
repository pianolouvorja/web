# PIANO LouvorJA Web — Development Guide

## Responsive Design Pattern

This project uses **two complementary tools** for responsive behavior:

### 1. `useDisplay` (Vuetify) — for JavaScript/template logic

Use when you need to conditionally **show/hide** elements, change component behavior, or branch logic based on viewport size.

```vue
<script setup lang="ts">
import { useDisplay } from 'vuetify'

const { mdAndUp, lgAndUp, mobile, smAndDown } = useDisplay()
</script>

<template>
  <!-- Element only renders on medium screens and up (>= 960px) -->
  <div v-if="mdAndUp">...</div>

  <!-- Element only renders on large screens and up (>= 1280px) -->
  <div v-if="lgAndUp">...</div>
</template>
```

**Available breakpoints (Vuetify 4.x):**

| Property     | Breakpoint  | Meaning              |
|--------------|-------------|----------------------|
| `xs`         | < 600px     | Extra small (mobile) |
| `sm`         | 600–959px   | Small (tablet)       |
| `md`         | 960–1279px  | Medium (desktop)     |
| `lg`         | 1280–1919px | Large                |
| `xl`         | >= 1920px   | Extra large          |
| `smAndDown`  | <= 959px    | Tablet and below     |
| `mdAndUp`    | >= 960px    | Desktop and up       |
| `lgAndUp`    | >= 1280px   | Large and up         |
| `mobile`     | < 960px     | Vuetify mobile flag  |

### 2. `@media` queries (CSS) — for visual/style changes only

Use when you only need to change CSS properties (padding, font-size, grid-template-columns, flex-direction, gap, etc.) without removing elements from the DOM.

```scss
.my-component {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}
```

### Standard breakpoints (must match Vuetify)

| Token | Value  | Usage                    |
|-------|--------|--------------------------|
| `sm`  | 600px  | Mobile → tablet boundary |
| `md`  | 960px  | Tablet → desktop         |
| `lg`  | 1280px | Desktop → large          |
| `xl`  | 1920px | Large → extra large      |

These are also exported from `src/design-system/tokens/breakpoints.ts`.

### Decision matrix

| Scenario                                         | Use            |
|--------------------------------------------------|----------------|
| Hide/show an entire element based on viewport    | `useDisplay`   |
| Change layout structure (grid columns, flex-dir) | `@media`       |
| Toggle component behavior (e.g. drawer vs bar)   | `useDisplay`   |
| Adjust spacing, font-size, padding               | `@media`       |
| Conditionally render decorative elements         | `useDisplay`   |
| Fine-grained style adjustments                   | `@media`       |

### Rule of thumb

**`useDisplay` controls WHAT renders. `@media` controls HOW it looks.**
