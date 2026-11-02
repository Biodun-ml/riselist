# Riselist — design plan (quiet luxury, calm, smooth)

Concept: "First light". The site is a calm dawn: pale cool mist, deep ink-green, one warm champagne line that rises. Luxury = restraint, space, type, and slow motion that reveals.

Palette (named):
- Mist  #EEF0EF  ground (pale cool grey-green — deliberately NOT cream)
- Linen #F7F7F4  surfaces
- Ink   #121B1C  text + dark sections (green-black, not pure black)
- Moss  #2F5D50  accent: buttons, links, active states (hover #244A40)
- Champagne #E3C9A8  the single warm note: the rising line, used only on ink
- Slate #5B6664  secondary text (5.3:1 on Mist)
- Hairline rgba(18,27,28,.12)

Type: Fraunces (display serif, soft optical sizes, light weights for big sizes; italics for small labels) + Manrope (body/UI).
Scale: 15/17 body, 20 lead, 28/36/52/72(+clamp) display, line-height 1.1 display / 1.6 body. Line length ≤ 70ch.

Layout: max 1160px, section padding 128–160 desktop / 80–96 mobile. Hairline dividers encode section boundaries. Cards only where content is a set (pricing). Radii 18–24. No shadows except a soft ambient on the hero graphic. Left-aligned text; centered only the statement band.

Motion (performance-first, transform/opacity only, prefers-reduced-motion disables all):
1. One orchestrated load moment: hero words rise in sequence (120ms stagger), the dawn gradients begin a 40s breathing drift, the rise-line draws itself over 2.6s.
2. Scroll-driven "window" story: sticky chart, scroll position scrubs week 0→12; copy steps fade in on the side.
3. Interactive demo: picking a category re-ranks cards with a FLIP transition (420ms, ease-out-quint).
4. Reveals only on the big moments (section headlines, list items staggered 60ms). No hover gimmicks beyond colour.
No smooth-scroll hijack; native anchors with scroll-behavior: smooth.

Avoided defaults: cream+clay+serif tell (ground is cool mist, accent is moss), dark+acid, broadsheet grid, SaaS card kit (pricing: one ink card + two borderless), ALL-CAPS eyebrows (italic serif labels instead), middle dots, arrows in buttons, emoji, gradient washes as decoration (the dawn is the hero's subject, not decoration).
