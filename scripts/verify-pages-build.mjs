import { readFile } from 'node:fs/promises'

const pagesBase = '/Basketball/'
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8')
const assetUrls = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(
  ([, url]) => url,
)
const localAbsoluteUrls = assetUrls.filter(
  (url) => url.startsWith('/') && !url.startsWith('//'),
)
const outsidePagesBase = localAbsoluteUrls.filter(
  (url) => !url.startsWith(pagesBase),
)

if (html.includes('/src/main.tsx')) {
  throw new Error('Production HTML still references the Vite source entry.')
}

if (outsidePagesBase.length > 0) {
  throw new Error(
    `Local assets escape the GitHub Pages base path: ${outsidePagesBase.join(', ')}`,
  )
}

if (!localAbsoluteUrls.some((url) => url.startsWith(`${pagesBase}assets/`))) {
  throw new Error('Production HTML does not reference a built asset bundle.')
}

console.log(`Verified ${localAbsoluteUrls.length} GitHub Pages asset URLs.`)
