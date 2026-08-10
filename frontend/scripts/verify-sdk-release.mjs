import { appendFile, readFile } from 'node:fs/promises'

const tagPattern = /^onboarding-sdk-v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/
const releaseTag = process.env.RELEASE_TAG

if (!releaseTag) {
  fail('RELEASE_TAG is required')
}

const match = tagPattern.exec(releaseTag)

if (!match) {
  fail(
    `Release tag "${releaseTag}" must match onboarding-sdk-vX.Y.Z`,
  )
}

const packageUrl = new URL(
  '../packages/onboarding-sdk/package.json',
  import.meta.url,
)
const packageJson = JSON.parse(await readFile(packageUrl, 'utf8'))
const tagVersion = match[1]

if (packageJson.name !== '@m2ie/onboarding-sdk') {
  fail(`Unexpected package name "${packageJson.name}"`)
}

if (packageJson.version !== tagVersion) {
  fail(
    `Tag version ${tagVersion} does not match package version ${packageJson.version}`,
  )
}

if (process.env.CHECK_NPM_REGISTRY === 'true') {
  await ensureVersionIsAvailable(packageJson.name, tagVersion)
}

if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `version=${tagVersion}\n`)
}

console.log(`Validated ${packageJson.name}@${tagVersion}`)

async function ensureVersionIsAvailable(packageName, version) {
  const encodedName = encodeURIComponent(packageName)
  const response = await fetch(
    `https://registry.npmjs.org/${encodedName}/${version}`,
  )

  if (response.ok) {
    fail(`${packageName}@${version} is already published`)
  }

  if (response.status !== 404) {
    fail(`npm registry returned status ${response.status}`)
  }
}

function fail(message) {
  console.error(`::error::${message}`)
  process.exit(1)
}
