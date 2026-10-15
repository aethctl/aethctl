import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const DIR = new URL('./', import.meta.url)
const USER = 'aethctl'
const FLAGSHIP = 'Ryoku-on-NixOS'
const W = 880
const PAD = 32
const SIGNAL = '#ff4d4d'
const RAW = `https://raw.githubusercontent.com/${USER}/${USER}/main/profile/`
const SITE = 'https://aethctl.github.io/Ryoku-on-NixOS/'

const THEMES = {
  light: { fg: '#0e0e0c', line: 'rgba(14,14,12,.16)' },
  dark: { fg: '#e9e5db', line: 'rgba(233,229,219,.16)' },
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const r = (n, d = 2) => +n.toFixed(d)
const pct = (i, n = 1) => `${r((i / n) * 100, 2)}%`
const monoW = (n, size = 11) => n * size * 0.62

function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function wrap(text, size, width) {
  const max = Math.max(16, Math.floor(width / (size * 0.62)))
  const lines = ['']
  for (const word of text.split(' ')) {
    const cur = lines[lines.length - 1]
    if ((cur + ' ' + word).trim().length > max) lines.push(word)
    else lines[lines.length - 1] = (cur + ' ' + word).trim()
  }
  return lines
}

function keyframes(vals, steps) {
  return vals.map((v, i) => `${pct(i, steps)}{${v}}`).join('')
}

const appear = (id, on, off = 0.92, dur = 10) =>
  `@keyframes ${id}{0%,${pct(Math.max(0, on - 0.001))}{opacity:0}${pct(on)},${pct(off)}{opacity:1}${pct(Math.min(1, off + 0.04))},100%{opacity:0}}.${id}{animation:${id} ${dur}s linear infinite}`

const header = (num, title) => `
<text class="m" x="${PAD}" y="30"><tspan class="sig">${num}</tspan> ${esc(title)}</text>
<line class="hair" x1="${PAD}" x2="${W - PAD}" y1="44.5" y2="44.5"/>`

const upRight = (x, y, s = 8) => `<path class="ar" d="M${x},${y + s}L${x + s},${y}M${x + s * 0.3},${y}H${x + s}V${y + s * 0.7}"/>`
const chevron = (x, y) => `<path class="ar" d="M${x},${y - 7}l4.5,4.5l-4.5,4.5"/>`
const NUDGE = '@keyframes nudge{0%,70%,100%{transform:none}80%{transform:translate(3px,-3px)}}.nudge{animation:nudge 3.2s ease-in-out infinite}'

function svg(theme, h, css, body, label, w = W) {
  const t = THEMES[theme]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}">
<title>${esc(label)}</title>
<style>
.m{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;fill:${t.fg}}
.d{font-family:'Arial Narrow','Roboto Condensed',Arial,sans-serif;font-weight:900;fill:${t.fg}}
.dim{fill-opacity:.5}.mid{fill-opacity:.72}.sig{fill:${SIGNAL}}.hair{stroke:${t.line};stroke-width:1}
.ln{fill:none;stroke:${t.fg};stroke-opacity:.5}.fill{fill:${t.fg}}.ar{fill:none;stroke:${SIGNAL};stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
${css}
@media(prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
${body}
</svg>\n`
}

function surface(theme) {
  const line = { text: 'AETHCTL', y: 205, size: 108, span: 560 }
  const STEPS = 32
  const DUR = 9
  let css = ''
  let body = `
<text class="m" x="${PAD}" y="30">aethctl <tspan class="sig">@</tspan> linux</text>
<line class="hair" x1="${PAD}" x2="${W - PAD}" y1="44.5" y2="44.5"/>`

  const chars = [...line.text]
  const step = line.span / chars.length
  const start = (W - line.span) / 2
  chars.forEach((ch, i) => {
    const id = `lens0_${i}`
    const frames = []
    for (let s = 0; s <= STEPS; s++) {
      const p = s / STEPS
      const phase = p < 0.46 ? p / 0.46 : p < 0.54 ? null : (1 - p) / 0.46
      if (phase === null) {
        frames.push('transform:scaleX(1) translateX(0px)')
        continue
      }
      const lens = phase * 1.35 - 0.18
      const c = (i + 0.5) / chars.length
      const bump = Math.exp(-(((c - lens) / 0.14) ** 2))
      const scale = 1 + bump * 0.38
      const drift = (bump - 0.12) * (i - (chars.length - 1) / 2) * 1.35
      frames.push(`transform:scaleX(${r(scale, 3)}) translateX(${r(drift, 1)}px)`)
    }
    css += `@keyframes ${id}{${keyframes(frames, STEPS)}}.${id}{animation:${id} ${DUR}s linear infinite;transform-box:fill-box;transform-origin:center}`
    body += `<text class="d ${id}" x="${r(start + i * step + step / 2, 1)}" y="${line.y}" text-anchor="middle" font-size="${line.size}">${ch}</text>`
  })
  css += `@keyframes bar0{0%{transform:translateX(-180px);opacity:0}10%{opacity:1}44%{transform:translateX(810px);opacity:1}51%,100%{opacity:0}}.bar0{animation:bar0 ${DUR}s ease-in-out infinite}`
  body += `<clipPath id="clip0"><rect x="${PAD}" y="${line.y + 16}" width="${W - PAD * 2}" height="8"/></clipPath><g clip-path="url(#clip0)"><rect class="bar0" x="${PAD}" y="${line.y + 18}" width="150" height="3" fill="${SIGNAL}"/></g>`
  body += `
<line class="hair" x1="${PAD}" x2="${W - PAD}" y1="262.5" y2="262.5"/>`

  return svg(theme, 282, css, body, 'aethctl. Linux desktop developer.')
}

function intro(theme) {
  const text = 'I build Linux desktop systems that feel deliberate instead of assembled from unrelated config files. Most of my time goes into Ryoku on NixOS: packaging the shell, integrating compositors, fixing platform-specific breakage, and keeping the whole experience reproducible without sanding off what makes NixOS useful.'
  const lines = wrap(text, 15, W - PAD * 2)
  let body = lines.map((line, i) => `<text class="m" x="${PAD}" y="${34 + i * 26}" font-size="15">${esc(line)}</text>`).join('\n')
  const y = 34 + lines.length * 26 + 20
  body += `<text class="m sig" x="${PAD}" y="${y}" font-size="13">${SITE.replace('https://', '').replace(/\/$/, '')}</text><g class="nudge">${upRight(280, y - 9)}</g><text class="m dim" x="305" y="${y}">the flagship, running on NixOS</text>`
  return svg(theme, y + 24, NUDGE, body, 'I build Linux desktop systems, with most of my work focused on Ryoku on NixOS.')
}

function layers(theme) {
  const t = THEMES[theme]
  const DUR = 8
  const L = [
    ['L1', 'SHELL', 'Quickshell · QML · interaction design', 'surface ready'],
    ['L2', 'WAYLAND', 'Niri · Hyprland · compositor integration', 'session attached'],
    ['L3', 'NIXOS', 'flakes · modules · packaging · generations', 'system reproducible'],
    ['L4', 'TOOLING', 'Go · Python · Lua · Bash · Git', 'diagnostics online'],
  ]
  const x0 = PAD + 8
  const sw = 270
  const sk = 64
  const sd = 42
  const gap = 88
  const top = 150
  const cx = x0 + sk / 2 + sw / 2
  const hit = [0.16, 0.32, 0.48, 0.64]
  let css = ''
  let body = `${header('02', 'the stack')}<text class="d" x="${PAD}" y="92" font-size="36">ONE DESKTOP, FOUR LAYERS.</text>`

  L.forEach(([id, name, tags, log], i) => {
    const y = top + gap * i
    const pts = `${x0},${y + sd / 2} ${x0 + sk},${y - sd / 2} ${x0 + sk + sw},${y - sd / 2} ${x0 + sw},${y + sd / 2}`
    const h = hit[i]
    css += `@keyframes p${i}{0%,${pct(h - 0.005)}{fill-opacity:0}${pct(h + 0.01)}{fill-opacity:.9}${pct(h + 0.12)},100%{fill-opacity:0}}.p${i}{animation:p${i} ${DUR}s linear infinite}`
    css += appear(`g${i}`, h + 0.02, 0.86, DUR)
    body += `<polygon points="${pts}" fill="none" stroke="${t.fg}" stroke-opacity=".7"/><polygon class="p${i}" points="${pts}" fill="${SIGNAL}" fill-opacity="0"/><path d="M${x0},${y + sd / 2}v7h${sw}l${sk},${-sd}v-7" fill="none" stroke="${t.fg}" stroke-opacity=".7"/><line class="hair" x1="${x0 + sw + sk + 18}" x2="${W - PAD}" y1="${y - sd / 2 + 0.5}" y2="${y - sd / 2 + 0.5}"/><text class="m sig" x="${x0 + sw + sk + 18}" y="${y - 2}">${id}</text><text class="d" x="${x0 + sw + sk + 52}" y="${y + 1}" font-size="22">${name}</text><text class="m dim" x="${x0 + sw + sk + 52}" y="${y + 21}">${esc(tags)}</text><text class="m sig g${i}" x="${x0 + sw + sk + 52}" y="${y + 38}" opacity="0">${esc(log)}</text>`
  })

  const steps = [[0, 110, 0], [0.04, 110, 1], ...hit.flatMap((h, i) => [[h, top + gap * i - 6, 1], [h + 0.05, top + gap * i - 6, 1]]), [0.76, top + gap * 3 + 40, 0], [1, top + gap * 3 + 40, 0]]
  css += `@keyframes packet{${steps.map(([p, y, o]) => `${pct(p)}{transform:translateY(${r(y)}px);opacity:${o}}`).join('')}}.packet{animation:packet ${DUR}s cubic-bezier(.55,0,.75,.4) infinite}`
  body += `<rect class="packet" x="${cx - 5}" y="0" width="10" height="10" fill="${SIGNAL}" opacity="0"/>`
  return svg(theme, 460, css, body, 'The stack: Quickshell and QML, Wayland compositors, NixOS, and system tooling.')
}

const WORK = [
  { name: 'Ryoku-on-NixOS', on: 'nixos · qml · wayland', device: 'ryoku', desc: 'The official declarative NixOS port of Ryoku, with native modules, packaging, installer work, compositor integration and NixOS-specific runtime bridges.' },
  { name: 'why', on: 'go · linux · diagnostics', device: 'why', desc: 'A Linux diagnostics CLI that answers questions like why git, why :8080 and why 4312 using evidence from the running system.' },
  { name: 'ryomanager', on: 'qml · system monitor', device: 'manager', desc: 'A Ryoku-native system task manager designed around the same visual and interaction language as the desktop itself.' },
  { name: 'arcane-guard', on: 'linux · inspection · safety', device: 'guard', desc: 'A focused safety-inspection tool for Linux systems, built as one module of the wider Arcane Studio suite.' },
]

const DEV_W = 208
const DEV_H = 108
const monitor = () => `<rect class="ln" x=".5" y=".5" width="${DEV_W - 1}" height="${DEV_H - 1}" rx="5"/>`

const DEVICES = {
  ryoku() {
    let windows = ''
    for (let i = 0; i < 5; i++) {
      const x = 8 + i * 104
      windows += `<rect class="ln" x="${x + 0.5}" y="18.5" width="94" height="82" rx="3"/><rect class="fill" x="${x + 9}" y="29" width="${48 + (i % 3) * 10}" height="3" fill-opacity=".3"/><rect class="fill" x="${x + 9}" y="38" width="64" height="3" fill-opacity=".18"/>`
    }
    return {
      css: '@keyframes strip{0%,12%{transform:none}24%,38%{transform:translateX(-104px)}50%,64%{transform:translateX(-208px)}76%,88%{transform:translateX(-104px)}100%{transform:none}}.strip{animation:strip 9s cubic-bezier(.6,0,.2,1) infinite}@keyframes drawer{0%,12%,100%{transform:scaleX(0)}26%,70%{transform:scaleX(1)}84%{transform:scaleX(0)}}.drawer{transform-box:fill-box;transform-origin:right;animation:drawer 9s cubic-bezier(.2,.8,.2,1) infinite}',
      body: `${monitor()}<line class="hair" x1="1" x2="207" y1="11.5" y2="11.5"/><clipPath id="ryscr"><rect x="4" y="14" width="200" height="90"/></clipPath><g clip-path="url(#ryscr)"><g class="strip">${windows}</g><g class="drawer"><rect x="140" y="17" width="61" height="84" rx="8" fill="${SIGNAL}" fill-opacity=".15"/><rect class="ln" x="147.5" y="27.5" width="45" height="9" rx="4.5"/><rect class="ln" x="147.5" y="43.5" width="45" height="22" rx="5"/><rect class="ln" x="147.5" y="72.5" width="45" height="20" rx="5"/></g></g><rect x="8.5" y="18.5" width="94" height="82" rx="3" fill="none" stroke="${SIGNAL}" stroke-width="1.4"/>`,
    }
  },
  why() {
    const cmd = 'why :8080'
    let css = '@keyframes cur{0%,49%{opacity:1}50%,100%{opacity:0}}.cur{animation:cur 1s steps(1) infinite}'
    let body = `${monitor()}<text class="m dim" x="10" y="18" font-size="7">zsh  ~/Projects</text><text class="m" x="10" y="34" font-size="8">❯</text>`
    ;[...cmd].forEach((ch, i) => {
      css += appear(`wc${i}`, 0.06 + i * 0.025, 0.92, 7)
      body += `<text class="m wc${i}" x="${22 + i * 5.2}" y="34" font-size="8" opacity="0">${esc(ch)}</text>`
    })
    const out = ['process  node  pid 4312', 'port     8080/tcp', 'owner    user session', 'source   systemd --user']
    out.forEach((line, i) => {
      css += appear(`wo${i}`, 0.38 + i * 0.07, 0.9, 7)
      body += `<text class="m wo${i}" x="15" y="${52 + i * 12}" font-size="7.5" opacity="0"><tspan class="${i === 0 ? 'sig' : 'dim'}">${esc(line)}</tspan></text>`
    })
    body += '<rect class="fill cur" x="73" y="27" width="4" height="9"/>'
    return { css, body }
  },
  manager() {
    let bars = ''
    for (let i = 0; i < 11; i++) bars += `<rect class="cpu c${i}" x="${16 + i * 7}" y="${42 - ((i * 9) % 23)}" width="4" height="${22 + ((i * 13) % 34)}" rx="1"/>`
    const css = '@keyframes cpu{0%,100%{transform:scaleY(.35)}35%{transform:scaleY(1)}70%{transform:scaleY(.62)}}.cpu{fill:currentColor;fill-opacity:.35;transform-box:fill-box;transform-origin:50% 100%;animation:cpu 2.2s ease-in-out infinite}.c1,.c5,.c9{animation-delay:-.5s}.c2,.c6,.c10{animation-delay:-1s}.c3,.c7{animation-delay:-1.5s}@keyframes pulse{0%,100%{stroke-opacity:.2}50%{stroke-opacity:1}}.pulse{animation:pulse 3s ease-in-out infinite}'
    let body = `${monitor()}<text class="m" x="10" y="18" font-size="7.5">SYSTEM</text><text class="m dim" x="195" y="18" text-anchor="end" font-size="7.5">CPU  17%</text><g style="color:currentColor">${bars}</g><polyline class="pulse" points="105,47 116,39 126,50 137,32 148,43 159,26 171,37 190,24" fill="none" stroke="${SIGNAL}" stroke-width="1.5"/>`
    ;['quickshell', 'niri', 'pipewire', 'steam'].forEach((p, i) => { body += `<text class="m ${i === 0 ? 'sig' : 'dim'}" x="105" y="${64 + i * 10}" font-size="7">${p}</text><text class="m dim" x="191" y="${64 + i * 10}" text-anchor="end" font-size="7">${[3.8, 1.4, 0.8, 7.2][i]}%</text>` })
    return { css, body }
  },
  store() {
    const css = '@keyframes prog{0%,12%{transform:scaleX(0)}62%,80%{transform:scaleX(1)}92%,100%{transform:scaleX(0)}}.prog{transform-box:fill-box;transform-origin:left;animation:prog 7s cubic-bezier(.2,.8,.2,1) infinite}@keyframes done{0%,60%{opacity:0}66%,88%{opacity:1}94%,100%{opacity:0}}.done{animation:done 7s linear infinite}'
    let body = `${monitor()}<text class="m" x="10" y="18" font-size="7.5">RYOSTORE</text>`
    for (let i = 0; i < 4; i++) {
      const x = 11 + (i % 2) * 98, y = 27 + Math.floor(i / 2) * 34
      body += `<rect class="ln" x="${x + .5}" y="${y + .5}" width="88" height="27" rx="4"/><rect class="fill" x="${x + 6}" y="${y + 6}" width="16" height="16" rx="4" fill-opacity="${i === 0 ? '.45' : '.18'}"/><rect class="fill" x="${x + 29}" y="${y + 7}" width="43" height="3" fill-opacity=".32"/><rect class="fill" x="${x + 29}" y="${y + 14}" width="30" height="3" fill-opacity=".18"/>`
    }
    body += `<rect class="fill" x="12" y="96" width="184" height="3" fill-opacity=".13"/><rect class="prog" x="12" y="96" width="184" height="3" fill="${SIGNAL}"/><path class="done" d="M183 88l4 4 8-10" fill="none" stroke="${SIGNAL}" stroke-width="2"/>`
    return { css, body }
  },
  guard() {
    let css = '@keyframes scan{0%{transform:translateY(0);opacity:0}8%{opacity:1}55%{transform:translateY(72px);opacity:1}65%,100%{opacity:0}}.scan{animation:scan 6.5s ease-in-out infinite}'
    let body = `${monitor()}<text class="m" x="10" y="18" font-size="7.5">ARCANE GUARD</text><rect class="ln" x="12.5" y="27.5" width="183" height="61" rx="4"/>`
    const checks = ['permissions', 'services', 'network', 'packages']
    checks.forEach((q, i) => {
      css += appear(`gc${i}`, 0.18 + i * 0.11, 0.88, 6.5)
      body += `<g class="gc${i}" opacity="0"><circle cx="24" cy="${40 + i * 12}" r="3" fill="${i === 3 ? SIGNAL : 'currentColor'}" fill-opacity="${i === 3 ? 1 : .45}"/><text class="m" x="34" y="${43 + i * 12}" font-size="7">${q}</text><text class="m dim" x="184" y="${43 + i * 12}" text-anchor="end" font-size="7">${i === 3 ? 'review' : 'ok'}</text></g>`
    })
    body += `<rect class="scan" x="14" y="29" width="179" height="2" fill="${SIGNAL}"/>`
    return { css, body }
  },
  wallpaper() {
    const css = '@keyframes w1{0%,20%,100%{opacity:1}30%,90%{opacity:.12}}@keyframes w2{0%,20%,100%{opacity:.12}30%,55%{opacity:1}65%,90%{opacity:.12}}@keyframes w3{0%,55%,100%{opacity:.12}65%,90%{opacity:1}}.w1{animation:w1 9s ease-in-out infinite}.w2{animation:w2 9s ease-in-out infinite}.w3{animation:w3 9s ease-in-out infinite}'
    let body = monitor()
    const classes = ['w1', 'w2', 'w3', 'w2', 'w3', 'w1']
    for (let i = 0; i < 6; i++) {
      const x = 8 + (i % 3) * 65, y = 16 + Math.floor(i / 3) * 43
      body += `<rect class="${classes[i]}" x="${x}" y="${y}" width="56" height="35" rx="3" fill="${i % 2 ? SIGNAL : 'currentColor'}" fill-opacity="${i % 2 ? '.38' : '.18'}"/><path class="ln" d="M${x + 5},${y + 29}l14-13 10 9 8-8 14 12"/>`
    }
    body += '<text class="m dim" x="104" y="101" text-anchor="middle" font-size="7">curated desktop backgrounds</text>'
    return { css, body }
  },
  upstream() {
    const css = '@keyframes commit{0%,8%{offset-distance:0%;opacity:0}16%{opacity:1}72%{offset-distance:100%;opacity:1}82%,100%{opacity:0}}.commit{offset-path:path(\"M18 77 C58 77 54 34 94 34 S142 77 190 77\");animation:commit 7.5s ease-in-out infinite}@keyframes node{0%,100%{transform:scale(1)}45%{transform:scale(1.55)}}.node{transform-box:fill-box;transform-origin:center;animation:node 7.5s ease-in-out infinite;animation-delay:4.8s}'
    const body = `${monitor()}<text class="m" x="10" y="18" font-size="7.5">RYOKU UPSTREAM</text><path class="ln" d="M18 77 C58 77 54 34 94 34 S142 77 190 77"/><circle class="fill" cx="18" cy="77" r="4"/><circle class="fill" cx="94" cy="34" r="4"/><circle class="node" cx="190" cy="77" r="5" fill="${SIGNAL}"/><circle class="commit" cx="0" cy="0" r="4" fill="${SIGNAL}"/><text class="m dim" x="17" y="94" font-size="7">nixos</text><text class="m dim" x="80" y="24" font-size="7">shell</text><text class="m sig" x="174" y="94" font-size="7">main</text>`
    return { css, body }
  },
}

function workHead(theme) {
  return svg(theme, 62, '', `${header('03', 'selected work')}`, 'Selected work.')
}

function workRow(theme, p, i) {
  const lines = wrap(p.desc, 11, 560)
  const dev = DEVICES[p.device]()
  const name = p.name.toUpperCase()
  const arrowX = Math.min(580, PAD + 14 + name.length * 20)
  const body = `<line class="hair" x1="${PAD}" x2="${W - PAD}" y1=".5" y2=".5"/><text class="m sig" x="${PAD}" y="26">03.${i + 1}</text><text class="d" x="${PAD}" y="64" font-size="32">${esc(name)}</text><g class="nudge">${upRight(arrowX, 43, 13)}</g>${lines.slice(0, 3).map((l, j) => `<text class="m mid" x="${PAD}" y="${90 + j * 16}">${esc(l)}</text>`).join('')}<g transform="translate(${W - PAD - DEV_W},22)">${dev.body}</g>`
  return svg(theme, 142, NUDGE + dev.css, body, `${p.name}: ${p.desc}`)
}

const DIGITS = {
  0: ['01110','10001','10011','10101','11001','10001','01110'],
  1: ['00100','01100','00100','00100','00100','00100','01110'],
  2: ['01110','10001','00001','00010','00100','01000','11111'],
  3: ['11110','00001','00001','01110','00001','00001','11110'],
  4: ['00010','00110','01010','10010','11111','00010','00010'],
  5: ['11111','10000','11110','00001','00001','10001','01110'],
  6: ['00110','01000','10000','11110','10001','10001','01110'],
  7: ['11111','00001','00010','00100','01000','01000','01000'],
  8: ['01110','10001','10001','01110','10001','10001','01110'],
  9: ['01110','10001','10001','01111','00001','00010','01100'],
}

function signal(theme, data) {
  const t = THEMES[theme]
  const field = { x: PAD, y: 64, w: 470, h: 230 }
  const digits = String(data.stars).split('')
  const cols = digits.length * 6 - 1
  const px = Math.min(18, field.w / cols, field.h / 7)
  const ox = field.x + (field.w - cols * px) / 2
  const oy = field.y + (field.h - 7 * px) / 2
  const cells = []
  digits.forEach((d, di) => DIGITS[d].forEach((row, ry) => [...row].forEach((on, rx) => on === '1' && cells.push([ox + (di * 6 + rx) * px, oy + ry * px]))))
  const rand = rng(data.stars * 7919 + 17)
  const n = Math.max(32, Math.min(420, data.stars))
  let dots = ''
  for (let i = 0; i < n; i++) {
    const [cx, cy] = cells[i % cells.length]
    const x = cx + px * (0.15 + rand() * 0.7)
    const y = cy + px * (0.15 + rand() * 0.7)
    const sx = field.x + rand() * field.w - x
    const sy = field.y + rand() * field.h - y
    dots += `<circle class="star" cx="${r(x, 1)}" cy="${r(y, 1)}" r="${i === n - 1 ? 3.4 : 2.5}" fill="${i === n - 1 ? SIGNAL : t.fg}" style="--x:${r(sx, 0)}px;--y:${r(sy, 0)}px;--t:${r(rand() * 0.9, 2)}s"/>`
  }
  const css = '@keyframes star{0%{transform:translate(var(--x),var(--y));opacity:0}22%,80%{transform:none;opacity:1}100%{transform:translate(var(--x),var(--y));opacity:0}}.star{animation:star 10s cubic-bezier(.16,1,.3,1) infinite both;animation-delay:var(--t)}'
  const stats = [['stars tracked', data.stars], ['forks tracked', data.forks], ['repos tracked', data.repos], ['scope', 'aethctl + ryoku-dev']]
  const body = `${header('04', 'open source')}${dots}<text class="m" x="540" y="92" font-size="13">Every point here belongs to the wider</text><text class="m" x="540" y="112" font-size="13">open-source signal around <tspan class="sig">aethctl</tspan> and <tspan class="sig">Ryoku</tspan>.</text>${stats.map(([k, v], i) => `<line class="hair" x1="540" x2="848" y1="${168.5 + i * 32}" y2="${168.5 + i * 32}"/><text class="m dim" x="540" y="${190 + i * 32}">${k}</text><text class="m" x="848" y="${190 + i * 32}" text-anchor="end" font-size="13">${esc(v)}</text>`).join('')}`
  return svg(theme, 330, css, body, `${data.stars} stars and ${data.forks} forks across tracked aethctl and Ryoku repositories. ${data.repos} repositories tracked.`)
}

function history(theme) {
  const t = THEMES[theme]
  const DUR = 14
  const rows = [
    { date: '2026-10', refs: 'HEAD → ryoku/v1', title: 'Stabilising Ryoku on NixOS', note: 'Installer, ISO, hardware compatibility and release hardening.' },
    { date: '2026-09', refs: 'feat: tools', title: 'why · RyoManager · Ryostore', note: 'System tools grow around the desktop instead of beside it.' },
    { date: '2026-08', title: 'init: Ryoku-on-NixOS', note: 'The declarative NixOS port becomes the main project.' },
    { date: '2026-07', title: 'build: desktop experiments', note: 'Shell, widget and README projects sharpen the design language.' },
    { date: '2026', title: 'chore: keep breaking Linux responsibly', note: 'NixOS, Wayland and desktop UI become the permanent rabbit hole.' },
  ]
  const y0 = 86
  const step = 58
  const yEnd = y0 + step * (rows.length - 1)
  const at = (y) => 0.44 * (yEnd - y) / (yEnd - y0)
  let css = `@keyframes line{0%{stroke-dashoffset:1;opacity:1}44%,92%{stroke-dashoffset:0;opacity:1}96%,100%{stroke-dashoffset:0;opacity:0}}.line{animation:line ${DUR}s linear infinite}@keyframes pulse{0%{transform:scale(1);opacity:.8}100%{transform:scale(3.2);opacity:0}}.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 1.6s ease-out infinite}`
  let body = `${header('05', 'git log --graph', 'project history')}<path class="line" d="M56,${yEnd}V${y0}" pathLength="1" stroke-dasharray="1" fill="none" stroke="${t.fg}" stroke-opacity=".6" stroke-width="1.5"/>`
  rows.forEach((row, i) => {
    const y = y0 + step * i
    css += appear(`hist${i}`, at(y), 0.92, DUR)
    const dot = i === 0 ? `<circle class="pulse" cx="56" cy="${y}" r="5" fill="none" stroke="${SIGNAL}"/><circle cx="56" cy="${y}" r="5" fill="${SIGNAL}"/>` : `<circle cx="56" cy="${y}" r="4.5" fill="${t.fg}"/>`
    body += `<g class="hist${i}" opacity="0">${dot}<text class="m dim" x="110" y="${y + 4}">${row.date}</text><text class="m" x="180" y="${y + 4}" font-size="13">${row.refs ? `<tspan class="sig">(${esc(row.refs)}) </tspan>` : ''}${esc(row.title)}</text><text class="m dim" x="180" y="${y + 22}">${esc(row.note)}</text></g>`
  })
  return svg(theme, yEnd + 42, css, body, rows.map((x) => `${x.date}: ${x.title}`).join('. '))
}

function shell(theme) {
  const DUR = 12
  const prompt = 'aether@nixos ~ '
  const cmd = 'fastfetch'
  const cmdX = 56 + monoW(prompt.length, 13) + 8
  const out = [
    ['os', 'NixOS 26.11'],
    ['wm', 'Niri · Hyprland'],
    ['shell', 'zsh'],
    ['desktop', 'Ryoku · Quickshell · QML'],
    ['langs', 'Go · QML · Python · Lua · Bash'],
    ['focus', 'Wayland · packaging · desktop UX'],
  ]
  let css = '@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}.blink{animation:blink 1s steps(1) infinite}'
  let body = `${header('05', 'shell')}<rect class="ln" x="32.5" y="60.5" width="815" height="330" rx="6" stroke-opacity=".35"/><text class="m dim" x="440" y="80" text-anchor="middle">zsh  ~/Projects</text><line class="hair" x1="33" x2="847" y1="92.5" y2="92.5"/><text class="m" x="56" y="122" font-size="13">aether<tspan class="sig">@nixos</tspan><tspan class="dim"> ~ </tspan></text>${chevron(cmdX - 12, 118)}`
  ;[...cmd].forEach((ch, i) => {
    css += appear(`type${i}`, 0.06 + i * 0.025, 0.92, DUR)
    body += `<text class="m type${i}" x="${r(cmdX + monoW(i, 13), 1)}" y="122" font-size="13" opacity="0">${ch}</text>`
  })
  css += appear('logo', 0.34, 0.92, DUR)
  body += '<g class="logo" opacity="0"><text class="d" x="58" y="224" font-size="62">緑</text><text class="d sig" x="122" y="224" font-size="62">力</text></g>'
  out.forEach(([k, v], i) => {
    css += appear(`out${i}`, 0.34 + i * 0.025, 0.92, DUR)
    body += `<text class="m out${i}" x="225" y="${166 + i * 28}" font-size="12" opacity="0" xml:space="preserve"><tspan class="sig">${k.padEnd(9)}</tspan>${esc(v)}</text>`
  })
  css += appear('prompt2', 0.58, 0.92, DUR)
  body += `<g class="prompt2" opacity="0"><text class="m" x="56" y="356" font-size="13">aether<tspan class="sig">@nixos</tspan><tspan class="dim"> ~ </tspan></text>${chevron(176, 352)}<rect class="fill blink" x="191" y="345" width="8" height="14"/></g>`
  return svg(theme, 406, css, body, 'NixOS fastfetch with Niri, Hyprland, zsh, Ryoku, Quickshell and development tooling.')
}

function contact(theme) {
  const css = '@keyframes wide{0%,8%{transform:scaleX(.63)}40%,82%{transform:scaleX(1)}96%,100%{transform:scaleX(.63)}}.wide{animation:wide 10s cubic-bezier(.65,0,.35,1) infinite;transform-box:fill-box;transform-origin:left}' + NUDGE
  const body = `${header('06', 'exit 0')}<text class="d" x="${PAD}" y="92" font-size="36">FIND ME IN THE SHELL.</text><text class="d sig wide" x="${PAD}" y="182" font-size="82">@AETHCTL</text><text class="m dim" x="${PAD}" y="216">click through below</text><g class="nudge">${upRight(142, 207)}</g>`
  return svg(theme, 238, css, body, 'Find Aether online as aethctl.')
}

const LINKS = [
  ['ryoku nix discord', 'https://discord.gg/8KjBmUEyKA'],
]

function chip(theme, [label], i) {
  const CW = W
  const css = NUDGE.replace('.nudge{', `.nudge{animation-delay:${r(i * 0.35)}s;`)
  const body = `<line class="hair" x1="${PAD}" x2="${CW - PAD}" y1=".5" y2=".5"/><text class="m dim" x="${PAD}" y="26">0${i + 1}</text><text class="m" x="${PAD}" y="48" font-size="14">${label}</text><g class="nudge">${upRight(PAD + monoW(label.length, 14) + 10, 38)}</g>`
  return svg(theme, 64, css, body, label, CW)
}

function colophon(theme) {
  const body = `<text class="m dim" x="${PAD}" y="24" font-size="10">© 2026 Aether · generated SVG profile · light/dark aware · motion lives inside each panel</text><text class="m dim" x="${PAD}" y="42" font-size="10">live repository stats refresh daily from GitHub · source: profile/build.mjs</text>`
  return svg(theme, 56, '', body, 'Colophon')
}

async function fetchData() {
  const headers = { 'User-Agent': USER, Accept: 'application/vnd.github+json' }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const get = async (url) => {
    const res = await fetch(url, { headers })
    if (!res.ok) throw new Error(`${url}: ${res.status}`)
    return res.json()
  }
  const fetchRepoSet = async (base) => {
    const items = []
    for (let page = 1; ; page++) {
      const batch = await get(`${base}${base.includes('?') ? '&' : '?'}per_page=100&page=${page}`)
      items.push(...batch)
      if (batch.length < 100) break
    }
    return items
  }

  const [userRepos, orgRepos] = await Promise.all([
    fetchRepoSet(`https://api.github.com/users/${USER}/repos?type=owner&sort=updated`),
    fetchRepoSet('https://api.github.com/orgs/ryoku-dev/repos?type=public'),
  ])

  const merged = new Map()
  for (const repo of [...userRepos, ...orgRepos]) {
    if (!repo.fork) merged.set(repo.full_name, repo)
  }
  const repos = [...merged.values()]
  return {
    stars: repos.reduce((s, r) => s + (r.stargazers_count || 0), 0),
    forks: repos.reduce((s, r) => s + (r.forks_count || 0), 0),
    repos: repos.length,
  }
}

const cache = new URL('data.json', DIR)
let data
try {
  data = await fetchData()
  writeFileSync(cache, JSON.stringify(data, null, 2) + '\n')
} catch (err) {
  console.warn(`GitHub API unavailable (${err.message}), using data.json`)
  data = JSON.parse(readFileSync(cache))
}

const repo = (name) => `https://github.com/${USER}/${name}`
const SECTIONS = [
  { name: 'surface', href: repo(USER), make: surface },
  { name: 'intro', href: SITE, make: intro },
  { name: 'layers', href: repo(FLAGSHIP), make: layers },
  { name: 'work', href: `https://github.com/${USER}?tab=repositories`, make: workHead },
  ...WORK.map((p, i) => ({ name: `work-${i + 1}`, href: repo(p.name), make: (th) => workRow(th, p, i), tight: true })),
  { name: 'signal', href: `https://github.com/${USER}?tab=repositories`, make: (th) => signal(th, data) },
  { name: 'shell', href: repo(FLAGSHIP), make: shell },
  ...LINKS.map((l, i) => ({ name: `link-${i + 1}`, href: l[1], make: (th) => chip(th, l, i), width: '100%' })),
]

const alts = {}
const versions = {}
for (const sec of SECTIONS) {
  for (const theme of Object.keys(THEMES)) {
    const out = sec.make(theme)
    alts[sec.name] = out.match(/aria-label="([^"]*)"/)?.[1] || sec.name
    versions[`${sec.name}-${theme}`] = createHash('sha256')
      .update(out)
      .digest('hex')
      .slice(0, 12)
    writeFileSync(new URL(`${sec.name}-${theme}.svg`, DIR), out)
  }
}

const asset = (name, theme) =>
  `${RAW}${name}-${theme}.svg?v=${versions[`${name}-${theme}`]}`

const pic = (sec) => `<a href="${sec.href}"><picture><source media="(prefers-color-scheme: dark)" srcset="${asset(sec.name, 'dark')}"><img src="${asset(sec.name, 'light')}" width="${sec.width || '100%'}" alt="${alts[sec.name]}"></picture></a>`
const blocks = []
for (const sec of SECTIONS) {
  const prev = blocks[blocks.length - 1]
  if (sec.row && prev?.row) prev.html += pic(sec)
  else if (sec.tight && prev?.tight) prev.html += '\n' + pic(sec)
  else blocks.push({ html: pic(sec), row: sec.row, tight: sec.tight || sec.name === 'work' })
}

writeFileSync(
  new URL('../README.md', DIR),
  `<!-- Generated by profile/build.mjs. Edit the generator, then rebuild. -->\n\n${blocks.map((b) => b.html).join('\n\n')}\n`,
)

console.log(`${SECTIONS.length * 2} SVGs and README.md written`)
