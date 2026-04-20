import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

const readText = (path: string): string => fs.readFileSync(path, 'utf8')

describe('GitHub Pages static build artifacts', () => {
  it('has a dedicated web build script and output directory', () => {
    const pkg = readText('package.json')
    expect(pkg).toContain('"build:web"')
    expect(pkg).toContain('vite build')

    const gitignore = readText('.gitignore')
    expect(gitignore).toContain('dist-web/')
  })

  it('has SPA deep-link fallback and redirect restore logic', () => {
    const indexHtml = readText('index.html')
    expect(indexHtml).toContain('sessionStorage.getItem')
    expect(indexHtml).toContain('history.replaceState')

    const notFoundHtml = readText('public/404.html')
    expect(notFoundHtml).toContain('sessionStorage.setItem')
    expect(notFoundHtml).toContain('location.replace')
  })

  it('configures build base path for GitHub Pages project site', () => {
    const viteConfig = readText('vite.config.ts')
    expect(viteConfig).toContain('dist-web')
    expect(viteConfig).toContain('/billiard_game/')
  })
})

