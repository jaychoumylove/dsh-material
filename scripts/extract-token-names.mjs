#!/usr/bin/env node
/**
 * Extract the token names the installed DSH theme package understands and write
 * them to `scripts/token-names.json`. The check script uses that snapshot to
 * guarantee this plugin never emits a token the current app does not know.
 *
 * Usage: node scripts/extract-token-names.mjs [--app <path to app resources>]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

const DEFAULT_APP = '/Applications/DSH Desktop.app/Contents/Resources/app'

function parseArgs(argv) {
  const out = { app: DEFAULT_APP }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--app') out.app = argv[i + 1]
  }
  return out
}

const { app } = parseArgs(process.argv.slice(2))
const themeClient = join(app, 'node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js')

let css
try {
  css = readFileSync(themeClient, 'utf8')
} catch (error) {
  console.error('cannot read the theme package at ' + themeClient + '\n' + error.message)
  process.exit(1)
}

const clean = new Set()
for (const match of css.matchAll(/--(?:dsw|shiki)-[a-z0-9-]+(?=\s*:)/g)) clean.add(match[0])

const sorted = [...clean].sort()
mkdirSync(join(root, 'scripts'), { recursive: true })
writeFileSync(join(root, 'scripts/token-names.json'), JSON.stringify(sorted, null, 2) + '\n')

const groups = sorted.reduce((acc, name) => {
  const key = name.startsWith('--shiki-')
    ? 'shiki'
    : name.startsWith('--dsw-static-')
      ? 'static'
      : name.startsWith('--dsw-alias-')
        ? 'alias'
        : name.startsWith('--dsw-specific-')
          ? 'specific'
          : name.startsWith('--dsw-font')
            ? 'font'
            : 'misc'
  acc[key] = (acc[key] ?? 0) + 1
  return acc
}, {})

console.log('theme package: ' + themeClient)
console.log('tokens: ' + sorted.length + ' ' + JSON.stringify(groups))
console.log('written: ' + join(root, 'scripts/token-names.json'))
