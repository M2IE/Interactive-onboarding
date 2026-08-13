import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import {
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { fileURLToPath } from 'node:url'

const appRoot = fileURLToPath(new URL('..', import.meta.url))
const manifest = JSON.parse(
  readFileSync(new URL('../dist/manifest.json', import.meta.url), 'utf8'),
)
const releaseDirectory = fileURLToPath(
  new URL('../../../release/', import.meta.url),
)
const filename = `onboarding-studio-${manifest.version}.zip`
const output = `${releaseDirectory}/${filename}`

mkdirSync(releaseDirectory, { recursive: true })
rmSync(output, { force: true })
execFileSync('zip', ['-qr', output, '.'], {
  cwd: `${appRoot}/dist`,
  stdio: 'inherit',
})

const checksum = createHash('sha256')
  .update(readFileSync(output))
  .digest('hex')

writeFileSync(`${output}.sha256`, `${checksum}  ${filename}\n`)
console.log(`${output}\nSHA-256 ${checksum}`)
