import { expect } from 'vitest'

import type { PhysicsHudSnapshot, PhysicsParameterKey, PhysicsParameterView } from '../../src/config/PhysicsConfig'
import { GameApp } from '../../src/game/GameApp'
import { MemoryLogger } from '../../src/shared/logger/Logger'
import {
  WebHudOverlay,
  rectanglesOverlap,
  type OverlayLayoutBoundary,
  type OverlayLayoutSize
} from '../../src/web/ui/WebHudOverlay'

export function createPhysicsHudApp(): { app: GameApp; logger: MemoryLogger } {
  const logger = new MemoryLogger()
  const app = new GameApp(logger)
  app.startMatch()
  return { app, logger }
}

export function getPhysicsHudState(app: GameApp): PhysicsHudSnapshot {
  return app.debugGetPhysicsHudState()
}

export function getPhysicsHudParameter(app: GameApp, key: PhysicsParameterKey): PhysicsParameterView {
  const parameter = getPhysicsHudState(app).parameters.find((item) => item.key === key)
  if (!parameter) {
    throw new Error(`Missing HUD parameter: ${key}`)
  }
  return parameter
}

export function stageAndApplyPhysicsParameter(app: GameApp, key: PhysicsParameterKey, valueText: string) {
  app.debugStagePhysicsParameter(key, valueText)
  return app.debugApplyPhysicsParameter(key)
}

export function createBootStatusBoundary(overrides: Partial<OverlayLayoutBoundary> = {}): OverlayLayoutBoundary {
  return {
    elementId: 'boot-status',
    left: 8,
    top: 8,
    right: 124,
    bottom: 36,
    visible: true,
    ...overrides
  }
}

export function estimateHudOverlaySize(
  snapshot: PhysicsHudSnapshot,
  options: {
    longCopy?: boolean
    includeValidationError?: boolean
  } = {}
): OverlayLayoutSize {
  const baseWidth = snapshot.isOpen ? 320 : 132
  const width = options.longCopy ? Math.min(baseWidth + 40, 360) : baseWidth
  const baseHeight = snapshot.isOpen ? 264 : 40
  const errorHeight = options.includeValidationError && snapshot.lastError ? 48 : 0
  const longCopyHeight = options.longCopy ? 36 : 0

  return {
    width,
    height: baseHeight + errorHeight + longCopyHeight
  }
}

export function expectBoundariesSeparated(a: OverlayLayoutBoundary, b: OverlayLayoutBoundary): void {
  expect(rectanglesOverlap(a, b)).toBe(false)
}

class FakeElement {
  id = ''
  textContent = ''
  value = ''
  type = ''
  disabled = false
  readonly style: Record<string, string> = {}
  readonly children: FakeElement[] = []
  parent: FakeElement | null = null

  constructor(readonly tagName: string, private readonly doc: FakeDocument) {}

  appendChild(child: FakeElement): FakeElement {
    child.parent = this
    this.children.push(child)
    return child
  }

  append(...items: Array<FakeElement | string>): void {
    for (const item of items) {
      if (typeof item === 'string') {
        const textNode = new FakeElement('#text', this.doc)
        textNode.textContent = item
        this.appendChild(textNode)
      } else {
        this.appendChild(item)
      }
    }
  }

  remove(): void {
    if (!this.parent) {
      return
    }
    this.parent.children.splice(this.parent.children.indexOf(this), 1)
    this.parent = null
  }

  addEventListener(): void {}

  setAttribute(name: string, value: string): void {
    if (name === 'id') {
      this.id = value
    }
  }

  get offsetWidth(): number {
    if (this.style.display === 'none') {
      return 0
    }

    const explicit = px(this.style.width)
    if (explicit !== null) {
      return explicit
    }

    if (this.tagName === 'button') {
      return Math.max(120, this.textContent.length * 9 + 28)
    }

    if (this.tagName === 'input') {
      return 180
    }

    const childWidths = this.children.map((child) => child.offsetWidth)
    const contentWidth = childWidths.length > 0
      ? (this.style.display === 'flex' && this.style.flexDirection !== 'column'
        ? childWidths.reduce((sum, width) => sum + width, 0) + gap(this) * Math.max(0, childWidths.length - 1)
        : Math.max(...childWidths))
      : textWidth(this.textContent)

    return contentWidth + horizontalPadding(this)
  }

  get offsetHeight(): number {
    if (this.style.display === 'none') {
      return 0
    }

    const explicit = px(this.style.height)
    if (explicit !== null) {
      return explicit
    }

    let contentHeight: number
    if (this.tagName === 'button') {
      contentHeight = 32
    } else if (this.tagName === 'input') {
      contentHeight = 30
    } else if (this.tagName === '#text' || this.children.length === 0) {
      contentHeight = textHeight(this.textContent)
    } else if (this.style.display === 'flex' && this.style.flexDirection !== 'column') {
      contentHeight = Math.max(...this.children.map((child) => child.offsetHeight), 0)
    } else {
      contentHeight = this.children.reduce((sum, child) => sum + child.offsetHeight, 0) + gap(this) * Math.max(0, this.children.length - 1)
    }

    const maxHeight = px(this.style.maxHeight)
    const totalHeight = contentHeight + verticalPadding(this)
    return maxHeight === null ? totalHeight : Math.min(totalHeight, maxHeight)
  }

  getBoundingClientRect(): { left: number; top: number; right: number; bottom: number; width: number; height: number } {
    const left = px(this.style.left) ?? 0
    const top = px(this.style.top) ?? 0
    const width = this.offsetWidth
    const height = this.offsetHeight
    return {
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height
    }
  }
}

class FakeDocument {
  readonly body = new FakeElement('body', this)

  createElement(tagName: string): FakeElement {
    return new FakeElement(tagName, this)
  }

  getElementById(id: string): FakeElement | null {
    return findById(this.body, id)
  }
}

function findById(root: FakeElement, id: string): FakeElement | null {
  if (root.id === id) {
    return root
  }
  for (const child of root.children) {
    const found = findById(child, id)
    if (found) {
      return found
    }
  }
  return null
}

function px(value?: string): number | null {
  if (!value) {
    return null
  }
  const match = value.match(/(-?\d+(?:\.\d+)?)px/)
  return match ? Number(match[1]) : null
}

function gap(element: FakeElement): number {
  return px(element.style.gap) ?? 0
}

function horizontalPadding(element: FakeElement): number {
  const padding = element.style.padding ?? ''
  const match = padding.match(/(\d+)px(?:\s+(\d+)px)?/)
  if (!match) {
    return 0
  }
  const vertical = Number(match[1])
  const horizontal = match[2] ? Number(match[2]) : vertical
  return horizontal * 2
}

function verticalPadding(element: FakeElement): number {
  const padding = element.style.padding ?? ''
  const match = padding.match(/(\d+)px(?:\s+(\d+)px)?/)
  if (!match) {
    return 0
  }
  return Number(match[1]) * 2
}

function textWidth(text: string): number {
  return Math.max(24, Math.min(340, text.length * 7 + 20))
}

function textHeight(text: string): number {
  const lines = Math.max(1, Math.ceil(Math.max(1, text.length) / 28))
  return lines * 18
}

function withFakeDom<T>(run: (doc: FakeDocument) => T): T {
  const previousDocument = (globalThis as { document?: unknown }).document
  const previousWindow = (globalThis as { window?: unknown }).window
  const doc = new FakeDocument()
  const win = { innerWidth: 430, innerHeight: 700 }

  ;(globalThis as { document?: unknown }).document = doc as unknown
  ;(globalThis as { window?: unknown }).window = win as unknown

  try {
    return run(doc)
  } finally {
    ;(globalThis as { document?: unknown }).document = previousDocument
    ;(globalThis as { window?: unknown }).window = previousWindow
  }
}

function createDomSnapshot(snapshot: PhysicsHudSnapshot, options: { longCopy?: boolean } = {}): PhysicsHudSnapshot {
  if (!options.longCopy) {
    return snapshot
  }

  return {
    ...snapshot,
    lastStatus: `${snapshot.lastStatus} ｜ 这是用于验证长文案布局稳定性的附加状态文本`.repeat(2),
    parameters: snapshot.parameters.map((parameter, index) => index === 0
      ? {
          ...parameter,
          description: `${parameter.description ?? parameter.label} ｜ 额外长文案用于扩大参数说明区域并验证布局稳定性`.repeat(2)
        }
      : parameter)
  }
}

export function renderHudOverlayDom(snapshot: PhysicsHudSnapshot, options: { longCopy?: boolean } = {}): { document: FakeDocument } {
  return withFakeDom((document) => {
    const bootStatus = document.createElement('div')
    bootStatus.id = 'boot-status'
    bootStatus.textContent = '状态：booted（Web Debug）'
    bootStatus.style.position = 'fixed'
    bootStatus.style.left = '8px'
    bootStatus.style.top = '8px'
    bootStatus.style.padding = '6px 10px'
    document.body.appendChild(bootStatus)

    const domSnapshot = createDomSnapshot(snapshot, options)
    const overlay = new WebHudOverlay({
      getState: () => domSnapshot,
      setOpen: () => {},
      stageParameter: () => {},
      applyParameter: () => ({
        parameterKey: 'friction',
        requestedValue: null,
        appliedValue: null,
        success: true,
        reason: 'noop',
        applyMode: 'immediate'
      }),
      resetParameters: () => ({
        parameterKey: 'reset-all',
        requestedValue: null,
        appliedValue: null,
        success: true,
        reason: 'noop',
        applyMode: 'reset'
      }),
      getReservedBoundary: () => createBootStatusBoundary({ right: 180, bottom: 44 }),
      getViewportSize: () => ({ width: 430, height: 700 })
    })

    overlay.render(domSnapshot)
    return { document }
  })
}

export function getElementBoundaryFromDom(document: FakeDocument, elementId: string): OverlayLayoutBoundary {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Missing element in fake DOM: ${elementId}`)
  }

  const rect = element.getBoundingClientRect()
  return {
    elementId,
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    visible: rect.width > 0 && rect.height > 0
  }
}
