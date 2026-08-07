# Xlya (Texalya) Color Palette

Source of truth: [`src/constants/colors.ts`](src/constants/colors.ts) — injected as CSS custom properties at runtime via [`src/utils/theme-injector.ts`](src/utils/theme-injector.ts) and consumed in [`src/app/globals.css`](src/app/globals.css).

Overall theme: **dark background with a gold/champagne accent gradient.**

## Gold gradient (brand palette)

| Name        | Hex       | CSS Variable       | Role                    |
|-------------|-----------|---------------------|--------------------------|
| dark        | `#8a6928` | `--gold-dark`       | Darkest gold (0%)       |
| secondary   | `#ad8c44` | `--gold-secondary`  | Darker gold (20%)       |
| primary     | `#ccac5d` | `--gold-primary`    | Main gold (40%)         |
| light       | `#e3c97e` | `--gold-light`      | Light gold (60%)        |
| accent      | `#f6e8a6` | `--gold-accent`     | Lightest gold (75%)     |
| lightest    | `#fbfcf7` | —                   | Almost white (85%)      |

Full gradient (`goldFull`, 135°):

```css
linear-gradient(
  135deg,
  #8a6928 0%,
  #ad8c44 20%,
  #ccac5d 40%,
  #e3c97e 60%,
  #f6e8a6 75%,
  #fbfcf7 85%,
  #ad8c44 100%
)
```

## Base theme

| Name        | Hex       | CSS Variable   | Role              |
|-------------|-----------|-----------------|--------------------|
| background  | `#0a0a0a` | `--background`  | Near-black base   |
| foreground  | `#ededed` | `--foreground`  | Off-white text    |

## Gray scale

| Shade | Hex       |
|-------|-----------|
| 50    | `#f9fafb` |
| 100   | `#f3f4f6` |
| 200   | `#e5e7eb` |
| 300   | `#d1d5db` |
| 400   | `#9ca3af` |
| 500   | `#6b7280` |
| 600   | `#4b5563` |
| 700   | `#374151` |
| 800   | `#1f2937` |
| 900   | `#111827` |

## Legacy / unused Tailwind tokens

[`tailwind.config.ts`](tailwind.config.ts) defines a separate `texalya` color set that does **not** match the gold palette above and appears stale/unused in the current app:

| Name   | Hex       |
|--------|-----------|
| orange | `#FFA548` |
| gray   | `#918C94` |
| border | `#FEFEFE` |
