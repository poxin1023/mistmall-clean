# Product Asset Naming Rules

This directory currently contains mixed naming styles. To keep future uploads reviewable and deterministic, use the following convention:

## Naming Convention

- Lowercase only (`a-z`, `0-9`)
- Use hyphens as separators
- No spaces or parentheses
- Keep original extension where possible (`.jpg`, `.png`, `.webp`)
- Prefer semantic prefixes by product family

Examples:

- `sp2s-machine-x-1.jpg`
- `meme-disposable-7000-01.jpg`
- `meha-v5-pod-01.jpg`
- `usb-herb-tool-500-red.jpg`

## Directory Policy

- Keep all product images under `public/products/`
- Do not create nested folders unless route logic is updated accordingly
- Keep one canonical filename per logical asset; avoid near-duplicate variants like `(1)`, `(2)`, mixed casing, or inserted spaces

## Current Cleanup Suggestions (No Deletions Yet)

- Normalize mixed-case prefixes: `MEHA*`, `SP2S*`, `XIAOKE*`
- Replace bracketed variants like `meme1 (10).jpg` with zero-padded sequence naming
- Replace spaced names like `SP2s Max hine X.jpg` with hyphenated names
- Record mapping before any rename to keep `src/data/products.ts` references consistent
