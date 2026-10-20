/**
 * Host half of dsh-material-theme.
 *
 * The theme itself lives entirely in the client half (`client/client.js`): it
 * registers Material palettes with the client theme runtime and adds a picker
 * row to Settings → Appearance. There is nothing to do on the host, but a
 * bundle layer needs a resolvable entry, so this plugin is intentionally inert.
 */

export const name = 'dsh-material-theme'

export function apply() {}
