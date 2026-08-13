import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const webSourceRoot = path.join(frontendRoot, 'apps/web/src')
const sdkSourceRoot = path.join(frontendRoot, 'packages/onboarding-sdk/src')
const extensionSourceRoot = path.join(frontendRoot, 'apps/extension/src')
const sourceExtensions = new Set(['.ts', '.tsx'])
const webLayerRanks = new Map([
  ['shared', 1],
  ['entities', 2],
  ['features', 3],
  ['widgets', 4],
  ['pages', 5],
  ['app', 6],
])
const extensionLayerRanks = new Map([
  ['shared', 1],
  ['entities', 2],
  ['features', 3],
  ['sidepanel', 4],
])

const violations = []

await checkWebLayers()
await checkSdkIsolation()
await checkSdkLayers()
await checkExtensionLayers()
await checkExtensionRuntimeBoundaries()
await checkJourneyModelPurity()

if (violations.length > 0) {
  console.error('Architecture violations:')
  violations.forEach((violation) => console.error(`- ${violation}`))
  process.exitCode = 1
} else {
  console.log('Architecture boundaries are valid.')
}

async function checkWebLayers() {
  for (const file of await collectSourceFiles(webSourceRoot)) {
    const sourceLayer = getWebLayer(file)
    if (!sourceLayer) continue

    for (const specifier of await readImportSpecifiers(file)) {
      const target = resolveWebImport(file, specifier)
      const targetLayer = target ? getWebLayer(target) : undefined
      if (!targetLayer) continue

      const sourceRank = webLayerRanks.get(sourceLayer)
      const targetRank = webLayerRanks.get(targetLayer)
      if (sourceRank === undefined || targetRank === undefined) continue

      if (targetRank > sourceRank) {
        report(file, `layer ${sourceLayer} imports higher layer ${targetLayer} via "${specifier}"`)
      }

      if (sourceLayer === 'features' && targetLayer === 'features') {
        const sourceSlice = getWebSlice(file)
        const targetSlice = getWebSlice(target)
        if (sourceSlice && targetSlice && sourceSlice !== targetSlice) {
          report(file, `feature ${sourceSlice} imports sibling feature ${targetSlice}`)
        }
      }
    }
  }
}

async function checkSdkIsolation() {
  for (const file of await collectSourceFiles(sdkSourceRoot)) {
    for (const specifier of await readImportSpecifiers(file)) {
      if (
        specifier.startsWith('@/') ||
        specifier.startsWith('@interactive-onboarding/') ||
        specifier.includes('apps/web')
      ) {
        report(file, `published SDK imports private application code via "${specifier}"`)
      }
    }
  }
}

async function checkSdkLayers() {
  const forbiddenTargets = {
    types: new Set(['api', 'core', 'dom', 'react', 'ui']),
    core: new Set(['api', 'dom', 'react', 'ui']),
    dom: new Set(['api', 'react', 'ui']),
    api: new Set(['react', 'ui']),
    ui: new Set(['api', 'react']),
    react: new Set(['api', 'core', 'dom']),
  }

  for (const file of await collectSourceFiles(sdkSourceRoot)) {
    const sourceLayer = getSourceLayer(sdkSourceRoot, file)
    const forbidden = forbiddenTargets[sourceLayer]
    if (!forbidden) continue

    for (const specifier of await readImportSpecifiers(file)) {
      const target = resolveRelativeImport(file, specifier)
      const targetLayer = target ? getSourceLayer(sdkSourceRoot, target) : undefined
      if (targetLayer && forbidden.has(targetLayer)) {
        report(file, `SDK layer ${sourceLayer} imports higher layer ${targetLayer}`)
      }
    }
  }
}

async function checkExtensionLayers() {
  for (const file of await collectSourceFiles(extensionSourceRoot)) {
    const sourceLayer = getSourceLayer(extensionSourceRoot, file)
    const sourceRank = extensionLayerRanks.get(sourceLayer)
    if (sourceRank === undefined) continue

    for (const specifier of await readImportSpecifiers(file)) {
      const target = resolveRelativeImport(file, specifier)
      const targetLayer = target
        ? getSourceLayer(extensionSourceRoot, target)
        : undefined
      const targetRank = targetLayer
        ? extensionLayerRanks.get(targetLayer)
        : undefined
      if (targetRank !== undefined && targetRank > sourceRank) {
        report(file, `extension layer ${sourceLayer} imports higher layer ${targetLayer}`)
      }
    }
  }
}

async function checkExtensionRuntimeBoundaries() {
  for (const runtime of ['background', 'content']) {
    const runtimeRoot = path.join(extensionSourceRoot, runtime)
    for (const file of await collectSourceFiles(runtimeRoot)) {
      for (const specifier of await readImportSpecifiers(file)) {
        const resolved = resolveRelativeImport(file, specifier)
        if (!resolved) continue
        const relative = toPosix(path.relative(extensionSourceRoot, resolved))
        if (relative.startsWith('sidepanel/') || relative.includes('/ui/')) {
          report(file, `${runtime} runtime imports Side Panel UI via "${specifier}"`)
        }
      }
    }
  }
}

async function checkJourneyModelPurity() {
  const roots = [
    path.join(webSourceRoot, 'features/journey-map/model'),
    path.join(webSourceRoot, 'features/journey-map/api'),
  ]
  const forbidden = new Set(['@xyflow/react', '@dagrejs/dagre'])

  for (const root of roots) {
    for (const file of await collectSourceFiles(root)) {
      for (const specifier of await readImportSpecifiers(file)) {
        if (forbidden.has(specifier)) {
          report(file, `Journey domain model depends on UI layout library "${specifier}"`)
        }
      }
      const source = await readFile(file, 'utf8')
      if (/\bBroadcastChannel\b/.test(source)) {
        report(file, 'Journey domain model depends on browser transport BroadcastChannel')
      }
    }
  }
}

async function collectSourceFiles(root) {
  const entries = await readdir(root, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(root, entry.name)
      if (entry.isDirectory()) return collectSourceFiles(target)
      return sourceExtensions.has(path.extname(entry.name)) &&
        !/\.test\.tsx?$/.test(entry.name)
        ? [target]
        : []
    }),
  )
  return files.flat()
}

async function readImportSpecifiers(file) {
  const source = await readFile(file, 'utf8')
  const specifiers = []
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    false,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text)
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return specifiers
}

function resolveWebImport(file, specifier) {
  if (specifier.startsWith('@/')) {
    return path.join(webSourceRoot, specifier.slice(2))
  }
  return resolveRelativeImport(file, specifier)
}

function resolveRelativeImport(file, specifier) {
  return specifier.startsWith('.')
    ? path.resolve(path.dirname(file), specifier)
    : undefined
}

function getWebLayer(file) {
  const relative = path.relative(webSourceRoot, file)
  if (relative.startsWith('..')) return undefined
  return relative.split(path.sep)[0]
}

function getWebSlice(file) {
  const relative = path.relative(webSourceRoot, file).split(path.sep)
  return relative[1]
}

function getSourceLayer(root, file) {
  const relative = path.relative(root, file)
  if (relative.startsWith('..')) return undefined
  return relative.split(path.sep)[0]
}

function report(file, message) {
  violations.push(`${toPosix(path.relative(frontendRoot, file))}: ${message}`)
}

function toPosix(value) {
  return value.split(path.sep).join('/')
}
