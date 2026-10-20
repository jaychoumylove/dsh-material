Add jaychoumylove/dsh-material to the catalog

## What this adds

One new plugin entry:

- id: `jaychoumylove/dsh-material`
- name: `dsh-material`
- category: `theme`
- repository: https://github.com/jaychoumylove/dsh-material

The plugin is a theme pack for DSH Desktop: it maps the official Material Theme palette set
(32 schemes, 34 accent colours) and the palettes' own syntax-highlighting colours onto the
client theme tokens (`--dsw-*`, `--shiki-*`), and adds a settings row plus a conversation
header switcher for choosing a scheme.

## Manifest / installability

- `package.json` at the repository root declares `dsh.bundle.patch: "./cordis.patch.yml"`,
  and that patch file is committed.
- The npm package is published as `dsh-material-theme` (stable `latest`), so the store can
  resolve an exact version and offer the install command.

## Notes for the reviewer

- The plugin has no runtime dependencies; its client bundle only uses `react` from the
  shell's module graph.
- Colour data comes from the Material Theme reference palette page; the accent table is
  derived from `MTAccents.java` in `ChrisRM/material-theme-jetbrains` (MIT).
- `scripts/check.mjs` is the repository's own offline verification (token coverage,
  WCAG contrast, runtime and render smoke tests); it is not part of the store's review.

Only `catalog/plugins/jaychoumylove--dsh-material.json` is added in this pull request.
