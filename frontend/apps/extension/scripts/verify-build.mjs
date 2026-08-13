import { access, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const dist = new URL('../dist/', import.meta.url)
const requiredFiles = [
  'manifest.json',
  'sidepanel.html',
  'background.js',
  'content.global.js',
  'icons/icon-16.png',
  'icons/icon-32.png',
  'icons/icon-48.png',
  'icons/icon-128.png',
]

await Promise.all(
  requiredFiles.map((file) => access(fileURLToPath(new URL(file, dist)))),
)

const manifest = JSON.parse(
  await readFile(new URL('manifest.json', dist), 'utf8'),
)

if (manifest.manifest_version !== 3 || !manifest.side_panel?.default_path) {
  throw new Error('Extension build has an invalid Manifest V3 configuration')
}

if (manifest.permissions?.includes('<all_urls>')) {
  throw new Error('Extension must not request permanent <all_urls> access')
}

console.log(`Verified ${manifest.name} v${manifest.version}`)
