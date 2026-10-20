#!/usr/bin/env node
/**
 * Offline verification for the plugin's theme tokens.
 *
 *   1. Loads `client/client.js` the way the app's module loader does, so the
 *      bundle is exercised as-is (no build step, no browser).
 *   2. Fails if the plugin emits a token name the installed theme package does
 *      not define (typos, renamed tokens after an app upgrade).
 *   3. Checks that the transcribed palettes still match the official reference
 *      page (material-theme.com/docs/reference/color-palette).
 *   4. Checks WCAG contrast for the pairs that decide whether the theme is
 *      readable: body/secondary/tertiary text, links, accent buttons, borders,
 *      state colours, code blocks — for every palette × accent combination, in
 *      both halves of the light/dark token pairs.
 *
 * Usage: node scripts/check.mjs [--strict] [--app <path to app resources>]
 */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const DEFAULT_APP = '/Applications/DSH Desktop.app/Contents/Resources/app'

function parseArgs(argv) {
  const out = { app: DEFAULT_APP, strict: false }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--app') out.app = argv[i + 1]
    if (argv[i] === '--strict') out.strict = true
  }
  return out
}

const { strict } = parseArgs(process.argv.slice(2))
const failures = []
const warnings = []

/** Load the plugin bundle through a stub of `window.__ModuleLoader__`. */
function loadBundle() {
  const source = readFileSync(join(root, 'client/client.js'), 'utf8')
  let captured
  const sandbox = {
    console,
    window: {
      __ModuleLoader__: {
        load(spec) {
          captured = spec
        }
      }
    },
    globalThis: undefined,
    document: undefined
  }
  sandbox.globalThis = sandbox
  vm.createContext(sandbox)
  vm.runInContext(source, sandbox, { filename: 'client/client.js' })
  if (!captured) throw new Error('bundle did not call window.__ModuleLoader__.load')
  const stubRequire = (specifier) => {
    if (specifier === 'react') return { createElement: () => null, useState: (v) => [v, () => {}] }
    if (specifier === 'react/jsx-runtime') return { jsx: () => null, jsxs: () => null }
    throw new Error('unexpected require(' + specifier + ') in the client bundle')
  }
  return { spec: captured, exported: captured.factory(stubRequire) }
}

/** Known token names from the installed theme package (see extract-token-names.mjs). */
function knownTokens() {
  return new Set(JSON.parse(readFileSync(join(root, 'scripts/token-names.json'), 'utf8')))
}

const { spec, exported } = loadBundle()
const lib = exported.__lib
if (!lib) {
  console.error('bundle does not export __lib')
  process.exit(1)
}

console.log('bundle id: ' + spec.id)
console.log('exports: ' + Object.keys(exported).join(', '))
console.log('themes: ' + lib.THEMES.length + ' (' + lib.THEMES.filter((t) => t.group === 'material').length + ' material)')
console.log('accents: ' + lib.ACCENTS.map((a) => a.id).join(', '))

// ---------------------------------------------------------------------------
// official reference values (spot checks, so a transcription slip fails loudly)
// ---------------------------------------------------------------------------
const expectTheme = (id, key, value) => {
  const theme = lib.THEMES.find((t) => t.id === id)
  if (!theme) return failures.push('missing palette ' + id)
  const actual = key === 'scheme' ? theme.scheme : theme.ui[key]
  if (actual !== value) failures.push('palette ' + id + ' ' + key + ' = ' + actual + ', expected ' + value)
}
expectTheme('oceanic', 'bg', '#263238')
expectTheme('oceanic', 'accent', '#009688')
expectTheme('palenight', 'bg', '#292d3e')
expectTheme('deep-ocean', 'bg', '#0f111a')
expectTheme('lighter', 'bg', '#fafafa')
expectTheme('lighter', 'scheme', 'light')
expectTheme('volcano', 'bg', '#390000')
expectTheme('sky-blue', 'scheme', 'light')
expectTheme('synthwave-84', 'accent', '#f92aad')

// ---------------------------------------------------------------------------
// token emission + coverage
// ---------------------------------------------------------------------------
const known = knownTokens()
const allNames = new Set()
let tokenTotal = 0
const sampleAccents = lib.ACCENTS.map((accent) => accent.id)
for (const theme of lib.THEMES) {
  for (const accent of sampleAccents) {
    const tokens = lib.buildTokens(theme.id, accent)
    tokenTotal = Object.keys(tokens).length
    for (const [name, value] of Object.entries(tokens)) {
      allNames.add(name)
      if (!known.has(name)) failures.push('unknown token emitted: ' + name + ' (theme ' + theme.id + ')')
      if (!value || typeof value.light !== 'string' || typeof value.dark !== 'string') {
        failures.push('token ' + name + ' is not a { light, dark } string pair')
      }
    }
  }
}

const groups = {}
for (const name of allNames) {
  const key = name.startsWith('--shiki-')
    ? 'shiki'
    : name.startsWith('--dsw-static-')
      ? 'static'
      : name.startsWith('--dsw-alias-')
        ? 'alias'
        : name.startsWith('--dsw-specific-')
          ? 'specific'
          : 'misc'
  groups[key] = (groups[key] ?? 0) + 1
}
console.log('tokens per palette: ' + tokenTotal + ' ' + JSON.stringify(groups))

for (const name of allNames) {
  const value = lib.buildTokens('oceanic', 'auto')[name]
  if (value && /var\(|undefined|NaN/.test(JSON.stringify(value))) {
    failures.push('token ' + name + ' contains a var()/undefined value')
  }
}

// ---------------------------------------------------------------------------
// contrast
// ---------------------------------------------------------------------------
const alphaColor = (value, background) => {
  const match = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(value)
  if (!match) return value
  const [r, g, b, a] = [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4])]
  const bg = lib.mix(background, '#000000', 0)
  const hex = /^#([0-9a-f]{6})$/.exec(bg)
  if (!hex) return value
  const channels = [0, 2, 4].map((i) => Number.parseInt(hex[1].slice(i, i + 2), 16))
  const blob = (channel, base) => Math.round(channel * a + base * (1 - a))
  return '#' + [blob(r, channels[0]), blob(g, channels[1]), blob(b, channels[2])]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')
}

/** [label, tokenA, tokenB, minimum]. */
const PAIRS = [
  ['label-primary on bg-base', '--dsw-alias-label-primary', '--dsw-alias-bg-base', 7],
  ['label-primary on layer-2', '--dsw-alias-label-primary', '--dsw-alias-bg-layer-2', 7],
  ['label-secondary on bg-base', '--dsw-alias-label-secondary', '--dsw-alias-bg-base', 4.5],
  ['label-tertiary on bg-base', '--dsw-alias-label-tertiary', '--dsw-alias-bg-base', 3],
  ['link on bg-base', '--dsw-alias-link', '--dsw-alias-bg-base', 4.5],
  ['primary button text', '--dsw-alias-label-primary-foreground', '--dsw-alias-button-primary-fill', 4.5],
  ['brand text on bg-base', '--dsw-alias-brand-text', '--dsw-alias-bg-base', 4.5],
  ['state error on bg-base', '--dsw-alias-state-error-primary', '--dsw-alias-bg-base', 3],
  ['state success on bg-base', '--dsw-alias-state-success-primary', '--dsw-alias-bg-base', 3],
  ['state warn on bg-base', '--dsw-alias-state-warn-primary', '--dsw-alias-bg-base', 3],
  ['code text on code block', '--dsw-alias-label-primary', '--dsw-alias-markdown-code-block', 4.5],
  ['shiki foreground on background', '--shiki-foreground', '--shiki-background', 3],
  ['border-l2 visible on bg-base', '--dsw-alias-border-l2', '--dsw-alias-bg-base', 1.05],
  ['bubble differs from bg-base', '--dsw-specific-bubble', '--dsw-alias-bg-base', 1.02],
  ['sidebar differs from bg-base', '--dsw-specific-sidebar-fill', '--dsw-alias-bg-base', 1.01],
  ['menu differs from bg-base', '--dsw-specific-menu', '--dsw-alias-bg-base', 1.02]
]

const rows = []
for (const theme of lib.THEMES) {
  for (const accent of lib.ACCENTS) {
    const tokens = lib.buildTokens(theme.id, accent.id)
    for (const scheme of ['light', 'dark']) {
      const pick = (name) => tokens[name][scheme]
      const bg = pick('--dsw-alias-bg-base')
      for (const [label, a, b, minimum] of PAIRS) {
        const left = alphaColor(pick(a), bg)
        const right = alphaColor(pick(b), bg)
        const value = lib.contrast(left, right)
        const tag = theme.id + '/' + accent.id + ' ' + scheme
        rows.push({ tag, label, value, minimum })
        if (value + 0.001 < minimum) {
          const message = tag + ': ' + label + ' = ' + value.toFixed(2) + ' < ' + minimum + ' (' + left + ' on ' + right + ')'
          if (strict) failures.push(message)
          else warnings.push(message)
        }
      }
    }
  }
}

// A handful of the official schemes (solarized-light, light-owl, arc-dark,
// one-light) deliberately ship low-contrast code text; those show up as 3.0-4.5
// and are reported but not failed, since the palette is the reference.
const soft = rows.filter((row) => row.minimum === 3 && row.value < 4.5 && row.label === 'shiki foreground on background')
if (soft.length > 0) console.log('note: ' + soft.length + ' official palettes keep code text below 4.5:1, by design of the reference palette')

const worst = rows.sort((a, b) => a.value / a.minimum - b.value / b.minimum).slice(0, 12)
console.log('\nweakest contrast pairs:')
for (const row of worst) {
  console.log('  ' + row.value.toFixed(2) + ' / ' + row.minimum + '  ' + row.tag + '  ' + row.label)
}

if (warnings.length > 0) {
  console.log('\nwarnings (' + warnings.length + ', run with --strict to fail):')
  for (const warning of warnings.slice(0, 20)) console.log('  ! ' + warning)
  if (warnings.length > 20) console.log('  … ' + (warnings.length - 20) + ' more')
}

// ---------------------------------------------------------------------------
// runtime smoke test: run apply() against a stub cordis context so a broken
// bundle fails here instead of inside the app shell at boot
// ---------------------------------------------------------------------------
const calls = { registered: [], layers: [], settings: [], setTheme: [] }
const stubTheme = {
  register(definition) {
    calls.registered.push(definition)
    return () => {}
  },
  overrideTokens(source, tokens) {
    calls.layers.push({ source, tokens })
    for (const [name, value] of Object.entries(tokens)) {
      if (!value || typeof value.light !== 'string' || typeof value.dark !== 'string') {
        failures.push('overrideTokens(' + source + ') got a non-pair for ' + name)
      }
      if (!known.has(name)) failures.push('layer emits unknown token ' + name)
    }
    return () => {}
  },
  setTheme(id) {
    calls.setTheme.push(id)
  },
  getTheme() {
    // Pretend the shell currently resolves to the opposite scheme, so apply()
    // must align the appearance with the palette.
    return { preference: 'light', fontSize: 14, active: { id: 'light', colorScheme: 'light', tokens: {} }, themes: [], revision: 0 }
  }
}
const stubCtx = {
  theme: stubTheme,
  locale: {
    register(namespace, dict) {
      if (!dict.zh || !dict.en) failures.push('locale ' + namespace + ' needs zh and en dictionaries')
      return () => {}
    }
  },
  slots: {
    inject(name, callback) {
      calls.settings.push('inject:' + name)
      callback()
      return () => {}
    },
    register(slot) {
      calls.settings.push('register:' + slot.id)
      return () => {}
    }
  },
  effect(run) {
    return run()
  }
}
try {
  exported.apply(stubCtx)
} catch (error) {
  failures.push('apply() threw: ' + ((error && error.stack) || error))
}
if (calls.layers.length !== 1) failures.push('apply() stacked ' + calls.layers.length + ' token layers, expected 1')
if (calls.layers[0] && calls.layers[0].source !== 'dsh-material-theme') failures.push('apply() layer source is ' + calls.layers[0].source)
if (calls.registered.length !== 0) failures.push('apply() registered ' + calls.registered.length + ' variants, expected 0 (palettes are applied as a layer)')
const defaultScheme = lib.THEMES[0].scheme
if (calls.setTheme[0] !== defaultScheme) failures.push('apply() set theme "' + calls.setTheme[0] + '", expected "' + defaultScheme + '"')
if (!calls.settings.includes('register:material-theme')) failures.push('apply() did not register the settings row')
console.log('smoke: layers=' + calls.layers.length + ' layerTokens=' + (calls.layers[0] ? Object.keys(calls.layers[0].tokens).length : 0) + ' setTheme=' + calls.setTheme.join(',') + ' slots=' + calls.settings.join(' '))


// ---------------------------------------------------------------------------
// palette ordering: Material / Other categories, each split into light then
// dark, every list running from the lightest to the deepest background
// ---------------------------------------------------------------------------
{
  const lists = [
    ['Material · light', lib.MATERIAL_LIGHT],
    ['Material · dark', lib.MATERIAL_DARK],
    ['Other · light', lib.OTHER_LIGHT],
    ['Other · dark', lib.OTHER_DARK]
  ]
  const seen = new Set()
  for (const [name, list] of lists) {
    if (list.length === 0) failures.push('palette list "' + name + '" is empty')
    for (let i = 0; i < list.length; i += 1) {
      if (seen.has(list[i].id)) failures.push('palette ' + list[i].id + ' appears in more than one group')
      seen.add(list[i].id)
      if (i > 0 && lib.luminance(list[i - 1].ui.bg) + 0.0001 < lib.luminance(list[i].ui.bg)) {
        failures.push(name + ' is not ordered light -> deep at ' + list[i].id)
      }
      const scheme = list[i].scheme
      if (scheme !== name.split(' · ')[1]) failures.push(list[i].id + ' sits in "' + name + '" but is a ' + scheme + ' palette')
      const group = list[i].group
      if (group !== name.split(' · ')[0].toLowerCase()) failures.push(list[i].id + ' sits in "' + name + '" but belongs to "' + group + '"')
    }
  }
  if (seen.size !== lib.THEMES.length) failures.push('palette groups cover ' + seen.size + ' of ' + lib.THEMES.length + ' themes')
  if (lib.MATERIAL_LIGHT.length + lib.MATERIAL_DARK.length !== lib.THEMES.filter((t) => t.group === 'material').length) {
    failures.push('Material category lost themes')
  }
  if (lib.OTHER_LIGHT.length + lib.OTHER_DARK.length !== lib.THEMES.filter((t) => t.group === 'other').length) {
    failures.push('Other category lost themes')
  }
  console.log('groups: material ' + lib.MATERIAL_LIGHT.length + ' light + ' + lib.MATERIAL_DARK.length + ' dark, other '
    + lib.OTHER_LIGHT.length + ' light + ' + lib.OTHER_DARK.length + ' dark')

  // header menu follows the same order: light palettes first, then dark
  const expected = [
    [...lib.MATERIAL_LIGHT, ...lib.MATERIAL_DARK].map((t) => t.id).join(','),
    [...lib.OTHER_LIGHT, ...lib.OTHER_DARK].map((t) => t.id).join(',')
  ]
  const actual = lib.MENU_GROUPS.map((group) => group.themes.map((t) => t.id).join(','))
  if (expected[0] !== actual[0] || expected[1] !== actual[1]) failures.push('header menu order does not follow the light -> deep grouping')
  if (lib.MENU_GROUPS.map((group) => group.labelKey).join('|') !== 'material.group.material|material.group.other') {
    failures.push('header menu group label keys are ' + lib.MENU_GROUPS.map((group) => group.labelKey).join('|'))
  }
}

// ---------------------------------------------------------------------------
// component smoke test: mount the settings row with a recording React stub, so
// a broken JSX tree fails here instead of inside the app shell
// ---------------------------------------------------------------------------
const recordingReact = {
  createElement(type, props, ...children) {
    return { type, props: props || {}, children }
  },
  useState(initial) {
    // React calls a function initializer; mirror that so the row/menu get real state.
    const value = typeof initial === 'function' ? initial() : initial
    // Render popups already open (`open` starts as false) so their contents exist.
    return [value === false ? true : value, () => {}]
  },
  useEffect() {},
  useRef() {
    return { current: null }
  }
}
function loadWithReact(reactModule) {
  const source = readFileSync(join(root, 'client/client.js'), 'utf8')
  let captured
  const styleNode = { style: {}, textContent: '', setAttribute() {}, appendChild() {} }
  const sandbox = {
    console,
    window: { __ModuleLoader__: { load(spec) { captured = spec } } },
    globalThis: undefined,
    document: {
      createElement: () => ({ ...styleNode, style: {}, dataset: {} }),
      head: { appendChild() {} },
      querySelector: () => null,
      getElementById: () => null
    }
  }
  sandbox.globalThis = sandbox
  vm.createContext(sandbox)
  vm.runInContext(source, sandbox, { filename: 'client/client.js' })
  return captured.factory((specifier) => {
    if (specifier === 'react') return reactModule
    if (specifier === 'react/jsx-runtime') return { jsx: reactModule.createElement, jsxs: reactModule.createElement }
    throw new Error('unexpected require(' + specifier + ')')
  })
}
try {
  const rowExport = loadWithReact(recordingReact)
  const components = {}
  let rowComponent
  const rowTheme = {
    register: () => () => {},
    overrideTokens: () => () => {},
    setTheme() {},
    getTheme: () => ({ preference: 'dark', fontSize: 14, active: { id: 'dark', colorScheme: 'dark', tokens: {} }, themes: [], revision: 0 })
  }
  rowExport.apply({
    theme: rowTheme,
    locale: { register: () => () => {} },
    effect: (run) => run(),
    slots: {
      inject: (name, callback) => callback(),
      register: (slot, component) => { components[slot.name] = component; return () => {} }
    }
  })
  rowComponent = components['settings.general.item']
  const menuComponent = components['conversation.session.header.utilities']
  if (typeof menuComponent !== 'function') failures.push('conversation header menu was not registered as a component')
  else {
    const translate = (key) => lib.zh[key] ?? lib.en[key] ?? key
    const menuTree = menuComponent({ t: translate })
    const nodes = []
    const walkMenu = (node) => {
      if (!node || typeof node !== 'object') return
      if (Array.isArray(node)) { for (const child of node) walkMenu(child); return }
      if (typeof node.type === 'function') { walkMenu(node.type(node.props || {})); return }
      nodes.push(node)
      for (const child of node.children || []) walkMenu(child)
    }
    walkMenu(menuTree)
    const hasClass = (node, name) => node.props && typeof node.props.className === 'string'
      && node.props.className.split(/\s+/).includes(name)
    const options = nodes.filter((node) => node.props && node.props.role === 'option')
    const legends = nodes.filter((node) => hasClass(node, 'dmt_panelLegend')).map((node) => node.children.join(''))
    const swatches = nodes.filter((node) => hasClass(node, 'dmt_optSwatch'))
    const names = nodes.filter((node) => hasClass(node, 'dmt_optName')).map((node) => node.children.join(''))
    const trigger = nodes.filter((node) => hasClass(node, 'dmt_triggerName')).map((node) => node.children.join(''))
    if (options.length !== lib.THEMES.length + 1) failures.push('header menu rendered ' + options.length + ' options, expected ' + (lib.THEMES.length + 1))
    const expectedLegends = [lib.zh['material.group.material'], lib.zh['material.group.other']].join('|')
    if (legends.join('|') !== expectedLegends) failures.push('header menu legends are ' + legends.join('|') + ', expected ' + expectedLegends)
    if (swatches.length !== (lib.THEMES.length) * 3) failures.push('header menu rendered ' + swatches.length + ' colour previews, expected ' + lib.THEMES.length * 3)
    if (options.filter((node) => node.props['aria-selected'] === true).length !== 1) failures.push('header menu must mark exactly one selected option')

    // every palette name is Chinese and 3-4 characters, so the list stays uniform
    const hanzi = /^[\u4e00-\u9fff]{3,4}$/
    for (const theme of lib.THEMES) {
      if (!hanzi.test(theme.zh)) failures.push('palette ' + theme.id + ' name "' + theme.zh + '" is not 3-4 Chinese characters')
    }
    if (new Set(lib.THEMES.map((theme) => theme.zh)).size !== lib.THEMES.length) failures.push('palette names are not unique')
    const menuNames = names.slice(1)
    if (menuNames.some((name) => !hanzi.test(name))) failures.push('header menu uses non-conforming names: ' + menuNames.filter((n) => !hanzi.test(n)).slice(0, 3).join(', '))
    const menuOrder = lib.MENU_GROUPS.flatMap((group) => group.themes.map((theme) => lib.zh['material.theme.' + theme.id]))
    if (menuNames.join(',') !== menuOrder.join(',')) {
      failures.push('header menu names do not follow the grouped palette order')
    }
    const defaultName = lib.zh['material.theme.' + lib.DEFAULT_CONFIG.palette]
    if (trigger.join('') !== defaultName) failures.push('header menu trigger shows ' + trigger.join('') + ', expected ' + defaultName)
    console.log('menu: options=' + options.length + ' legends=' + legends.join('/') + ' swatches=' + swatches.length + ' current=' + trigger.join(''))
  }
  if (typeof rowComponent !== 'function') failures.push('settings row was not registered as a component')
  else {
    const tree = rowComponent({ t: (key) => key, onApply: () => {} })
    let radios = 0
    let cards = 0
    const walk = (node) => {
      if (!node || typeof node !== 'object') return
      if (Array.isArray(node)) { for (const child of node) walk(child); return }
      if (typeof node.type === 'function') { walk(node.type(node.props || {})); return }
      if (node.props && node.props.role === 'radio') radios += 1
      if (node.props && typeof node.props.className === 'string' && node.props.className.split(/\s+/).includes('dmt_card')) cards += 1
      for (const child of node.children || []) walk(child)
    }
    walk(tree)
    const expectedCards = lib.THEMES.length
    const expectedRadios = lib.THEMES.length + lib.ACCENTS.length + 1
    if (cards !== expectedCards) failures.push('settings row rendered ' + cards + ' palette cards, expected ' + expectedCards)
    if (radios !== expectedRadios) failures.push('settings row rendered ' + radios + ' radios, expected ' + expectedRadios)
    console.log('row: cards=' + cards + ' radios=' + radios)
  }
} catch (error) {
  failures.push('settings row render threw: ' + ((error && error.stack) || error))
}

if (failures.length > 0) {
  console.error('\nFAILED (' + failures.length + '):')
  for (const failure of failures.slice(0, 40)) console.error('  x ' + failure)
  if (failures.length > 40) console.error('  … ' + (failures.length - 40) + ' more')
  process.exit(1)
}

console.log('\nOK — ' + allNames.size + ' distinct tokens, ' + lib.THEMES.length + ' themes × ' + lib.ACCENTS.length + ' accents')
