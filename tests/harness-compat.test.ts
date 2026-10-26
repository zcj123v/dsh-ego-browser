import { readFileSync } from 'node:fs'
import { evaluatePluginCompatibility } from '@deepseek-ai/dsh-app-boot'
import { describe, expect, it } from 'vitest'

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

describe('Harness rc.3 compatibility', () => {
  it('passes the real runtime gate without a compatibility exemption', () => {
    expect(evaluatePluginCompatibility(manifest, {}, '0.2.1-rc.3')).toBeUndefined()
  })

  it('does not claim compatibility with an unverified older runtime', () => {
    expect(evaluatePluginCompatibility(manifest, {}, '0.1.5-rc.3')).toMatchObject({ exempted: false })
  })
})
