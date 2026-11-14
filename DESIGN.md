---
name: BRINGLY
description: Curated European sourcing & boutique personal concierge hand-carried from Germany to Egypt
colors:
  ground: "#FBF9F5"
  surface: "#FFFFFF"
  surface-soft: "#F5EFE6"
  border: "#E8E0D5"
  border-subtle: "#F0EAE1"
  indigo: "#1A2238"
  indigo-hover: "#263354"
  terracotta: "#C46849"
  terracotta-hover: "#AB5538"
  text: "#1C1917"
  text-muted: "#6B645C"
  text-subtle: "#9C948A"
typography:
  display:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "2.8rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  heading:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0em"
  body:
    fontFamily: "Albert Sans, -apple-system, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  bilingual-ar:
    fontFamily: "Cairo, -apple-system, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.ground}"
    rounded: "{rounded.full}"
    padding: "12px 28px"
  button-primary-hover:
    backgroundColor: "{colors.terracotta}"
  button-accent:
    backgroundColor: "{colors.terracotta}"
    textColor: "{colors.ground}"
    rounded: "{rounded.full}"
    padding: "12px 28px"
  card-product:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: BRINGLY Atelier & Concierge

## Overview
BRINGLY is a specialized boutique personal sourcing showroom connecting Germany and Egypt. Grounded in European-Mediterranean quality and personal concierge trust, it pairs natural linen neutrals with rich Mediterranean indigo and warm Egyptian terracotta accents, celebrating curated items, authentic German goods, and balanced bilingual (English/Arabic) typography.

## Colors
- **Ground (`#FBF9F5`)**: Warm natural linen ground that eliminates cold, stark white glare.
- **Surface (`#FFFFFF`)**: Crisp, elevated card surfaces with subtle hairline separation.
- **Surface Soft (`#F5EFE6`)**: Oatmeal/sand tone used for section backgrounds and concierge cards.
- **Border Hairlines (`#E8E0D5`)**: Delicate sandstone boundaries providing structure without visual clutter.
- **Deep Mediterranean Indigo (`#1A2238`)**: Primary brand anchor, primary CTAs, display brandmark, and nighttime footer.
- **Warm Terracotta (`#C46849`)**: Warm artisanal accent for badges, sale tags, hover interactions, and highlights.
- **Text Primary (`#1C1917`)**: High-contrast warm charcoal for effortless readability.
- **Text Muted (`#6B645C`)**: Secondary guidance and subtext tinted from the warm earth palette.

## Typography
- **Display & Headings**: `Marcellus` — Classical Roman/Mediterranean flared serif delivering poise, stature, and artisan craft.
- **Body & Controls**: `Albert Sans` — Distinctive geometric sans with warm human terminals for scanability, pricing, and form inputs.
- **Bilingual Arabic Pairing**: `Cairo` — Native Arabic sans-serif with natural balance for RTL alignment and localized headers.

## Layout
- Maximum container measure: 1360px centered with 24px responsive horizontal gutters.
- Vertical section rhythm: 56px–80px spacing between major narrative landmarks.
- Responsive grids: Fluid auto-fill apparel grids adapting from 1 column on mobile to 2–4 columns on desktop viewports.

## Elevation & Depth
- Hairline dividers (1px solid `#E8E0D5`) supersede heavy border styling.
- Shadows are soft, ambient, and offset: `0 8px 24px -4px rgba(26, 34, 56, 0.06)` for cards, `0 16px 36px -4px rgba(26, 34, 56, 0.12)` for dropdown menus. Hard zero-blur offset block shadows are banned.

## Shapes
- Buttons and pills: Full pill radius (`9999px`) for primary actions and collection links.
- Product cards and containers: Soft structured corners (`14px`–`18px`) resembling tailored apparel tags.

## Components
- **Header**: Sticky frosted linen bar (`rgba(251, 249, 245, 0.94)`) with bilingual logo mark, pill search bar, understated navigation links, and terracotta cart count badge.
- **Hero Carousel**: Full-bleed campaign banner with deep atmospheric vignette, editorial serif titles, and terracotta slide progression pills.
- **Concierge Request Card**: Sandstone framed concierge card with clean input fields and warm WhatsApp integration for European fashion sourcing.
- **Apparel Product Card**: Image container with subtle linen backdrop, clean typography without price clutter, and an integrated "Inquire on WhatsApp" personal consultation action.
- **Footer**: Deep indigo ground with sand-tinted links, inline newsletter subscription, and localized copyright.

## Do's and Don'ts
- **DO**: Treat Egyptian and Mediterranean apparel heritage as the visual authority.
- **DO**: Maintain strict contrast ratios (≥4.5:1 for body copy).
- **DO**: Keep product cards price-free; direct all purchasing inquiries to WhatsApp.
- **DON'T**: Display intrusive price tags or aggressive commercial discount badges.
- **DON'T**: Use decorative gradient text or neon colored glowing blobs.
- **DON'T**: Use generic cards nested inside other cards.
- **DON'T**: Default to Inter, Plus Jakarta Sans, or generic purple/blue gradients.

