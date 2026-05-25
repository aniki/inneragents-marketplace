#!/usr/bin/env node
/**
 * InnerAgents Marketplace — index generator
 *
 * Usage: node generate.mjs
 *
 * Reads every *.inneragents.json file in bundles/, extracts the `marketplace`
 * metadata block + agent identity, and writes index.json.
 *
 * Bundles are never modified — the script is read-only on them.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, basename, dirname }                   from 'path'
import { fileURLToPath }                             from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const BUNDLES_DIR = join(__dirname, 'bundles')
const INDEX_PATH  = join(__dirname, 'index.json')
const CONFIG_PATH = join(__dirname, 'config.json')

const cfg = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'))

const bundleFiles = readdirSync(BUNDLES_DIR)
  .filter(f => f.endsWith('.inneragents.json') && !f.startsWith('_'))
  .sort()

if (bundleFiles.length === 0) {
  console.log('No bundles found in bundles/ — index.json not written.')
  process.exit(0)
}

const entries = []
let skipped = 0

for (const file of bundleFiles) {
  let bundle
  try {
    bundle = JSON.parse(readFileSync(join(BUNDLES_DIR, file), 'utf8'))
  } catch (e) {
    console.error(`✗  ${file}: JSON invalide — ${e.message}`)
    skipped++
    continue
  }

  if (!bundle.agent?.id || !bundle.agent?.label) {
    console.error(`✗  ${file}: agent.id ou agent.label manquant`)
    skipped++
    continue
  }

  const mp = bundle.marketplace ?? {}

  entries.push({
    agentId:     bundle.agent.id,
    label:       bundle.agent.label,
    exportedAt:  bundle.exportedAt ?? '',
    description: mp.description ?? '',
    icon:        mp.icon        ?? '🤖',
    tags:        mp.tags        ?? [],
    author:      mp.author      ?? '',
    bundle:      file,
  })

  console.log(`✓  ${file}`)
}

const index = {
  version:     1,
  name:        cfg.name,
  description: cfg.description,
  agents:      entries,
}

writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + '\n')
console.log(`\n✓  index.json — ${entries.length} agent(s)${skipped ? ` · ${skipped} ignoré(s)` : ''}`)
