import { RenderConfig } from '../../config/RenderConfig'
import type { PhysicsConfigApplyEvent, PhysicsHudSnapshot, PhysicsParameterKey } from '../../config/PhysicsConfig'

export interface OverlayLayoutBoundary {
  elementId: string
  left: number
  top: number
  right: number
  bottom: number
  visible: boolean
}

export interface OverlayLayoutSize {
  width: number
  height: number
}

export interface OverlayViewportSize {
  width: number
  height: number
}

export interface OverlayLayoutInput {
  viewportWidth: number
  viewportHeight: number
  overlaySize: OverlayLayoutSize
  bootStatusBoundary: OverlayLayoutBoundary | null
  preferredOffset: number
  preferredGap: number
}

export interface OverlayLayoutResult {
  hudBoundary: OverlayLayoutBoundary
  panelMaxHeight: number
}

export interface WebHudOverlayHooks {
  getState: () => PhysicsHudSnapshot
  setOpen: (isOpen: boolean) => void
  stageParameter: (key: PhysicsParameterKey, valueText: string) => void
  applyParameter: (key: PhysicsParameterKey) => PhysicsConfigApplyEvent
  resetParameters: () => PhysicsConfigApplyEvent
  getReservedBoundary?: () => OverlayLayoutBoundary | null
  getViewportSize?: () => OverlayViewportSize
}

interface ParameterRowRefs {
  current: HTMLSpanElement
  defaultValue: HTMLSpanElement
  input: HTMLInputElement
  message: HTMLDivElement
  dirtyBadge: HTMLSpanElement
  applyButton: HTMLButtonElement
}

export function rectanglesOverlap(a: OverlayLayoutBoundary | null, b: OverlayLayoutBoundary | null): boolean {
  if (!a || !b || !a.visible || !b.visible) {
    return false
  }

  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom)
}

export function calculateHudOverlayLayout(input: OverlayLayoutInput): OverlayLayoutResult {
  const widthWithinViewport = Math.min(input.overlaySize.width, Math.max(0, input.viewportWidth - input.preferredOffset * 2))
  const initialBoundary: OverlayLayoutBoundary = {
    elementId: 'web-hud-overlay',
    left: input.preferredOffset,
    top: input.preferredOffset,
    right: input.preferredOffset + widthWithinViewport,
    bottom: input.preferredOffset + input.overlaySize.height,
    visible: true
  }

  const top = rectanglesOverlap(initialBoundary, input.bootStatusBoundary)
    ? Math.max(input.preferredOffset, (input.bootStatusBoundary?.bottom ?? input.preferredOffset) + input.preferredGap)
    : input.preferredOffset

  const availableHeight = Math.max(0, input.viewportHeight - top - input.preferredOffset)
  const heightWithinViewport = Math.min(input.overlaySize.height, availableHeight || input.overlaySize.height)

  return {
    hudBoundary: {
      elementId: 'web-hud-overlay',
      left: input.preferredOffset,
      top,
      right: input.preferredOffset + widthWithinViewport,
      bottom: top + heightWithinViewport,
      visible: true
    },
    panelMaxHeight: Math.min(RenderConfig.physicsHudPanelMaxHeight, availableHeight)
  }
}

function createButton(text: string): HTMLButtonElement {
  const button = document.createElement('button')
  button.textContent = text
  button.style.padding = '6px 10px'
  button.style.borderRadius = '6px'
  button.style.border = '1px solid rgba(255,255,255,0.18)'
  button.style.background = 'rgba(255,255,255,0.08)'
  button.style.color = '#fff'
  button.style.cursor = 'pointer'
  return button
}

export class WebHudOverlay {
  private readonly root: HTMLDivElement
  private readonly toggleButton: HTMLButtonElement
  private readonly panel: HTMLDivElement
  private readonly statusLine: HTMLDivElement
  private readonly summaryLine: HTMLDivElement
  private readonly diagnosticsLine: HTMLDivElement
  private readonly resetButton: HTMLButtonElement
  private readonly parameterList: HTMLDivElement
  private readonly parameterRows = new Map<PhysicsParameterKey, ParameterRowRefs>()
  private interactionStatus = '准备就绪'

  constructor(private readonly hooks: WebHudOverlayHooks) {
    this.root = document.createElement('div')
    this.root.id = 'web-hud-overlay'
    this.root.style.position = 'fixed'
    this.root.style.left = `${RenderConfig.physicsHudOffset}px`
    this.root.style.top = `${RenderConfig.physicsHudOffset}px`
    this.root.style.zIndex = '10000'
    this.root.style.display = 'flex'
    this.root.style.flexDirection = 'column'
    this.root.style.alignItems = 'flex-start'
    this.root.style.gap = '8px'
    this.root.style.pointerEvents = 'none'

    this.toggleButton = createButton('物理 HUD')
    this.toggleButton.style.pointerEvents = 'auto'
    this.toggleButton.style.fontWeight = '600'
    this.toggleButton.addEventListener('click', () => {
      const nextOpen = !this.hooks.getState().isOpen
      this.hooks.setOpen(nextOpen)
      this.render(this.hooks.getState())
    })

    this.panel = document.createElement('div')
    this.panel.style.pointerEvents = 'auto'
    this.panel.style.width = `${RenderConfig.physicsHudPanelWidth}px`
    this.panel.style.maxWidth = 'calc(100vw - 20px)'
    this.panel.style.maxHeight = `${RenderConfig.physicsHudPanelMaxHeight}px`
    this.panel.style.overflow = 'auto'
    this.panel.style.padding = '12px'
    this.panel.style.borderRadius = '12px'
    this.panel.style.background = RenderConfig.physicsHudPanelBackground
    this.panel.style.border = RenderConfig.physicsHudPanelBorder
    this.panel.style.boxShadow = '0 12px 24px rgba(0,0,0,0.28)'
    this.panel.style.color = '#fff'
    this.panel.style.fontSize = '12px'

    const header = document.createElement('div')
    header.style.display = 'flex'
    header.style.justifyContent = 'space-between'
    header.style.alignItems = 'center'
    header.style.gap = '8px'
    header.style.marginBottom = '8px'

    const title = document.createElement('div')
    title.textContent = '物理参数实时配置'
    title.style.fontSize = '14px'
    title.style.fontWeight = '600'

    this.resetButton = createButton('恢复默认')
    this.resetButton.addEventListener('click', () => {
      this.hooks.resetParameters()
      this.render(this.hooks.getState())
    })

    header.appendChild(title)
    header.appendChild(this.resetButton)

    this.statusLine = document.createElement('div')
    this.statusLine.style.marginBottom = '8px'

    this.summaryLine = document.createElement('div')
    this.summaryLine.style.marginBottom = '6px'
    this.summaryLine.style.color = '#d7e6f7'

    this.diagnosticsLine = document.createElement('div')
    this.diagnosticsLine.style.marginBottom = '10px'
    this.diagnosticsLine.style.color = '#9ec5eb'

    this.parameterList = document.createElement('div')
    this.parameterList.style.display = 'flex'
    this.parameterList.style.flexDirection = 'column'
    this.parameterList.style.gap = '10px'

    this.panel.appendChild(header)
    this.panel.appendChild(this.statusLine)
    this.panel.appendChild(this.summaryLine)
    this.panel.appendChild(this.diagnosticsLine)
    this.panel.appendChild(this.parameterList)

    this.root.appendChild(this.toggleButton)
    this.root.appendChild(this.panel)
    document.body.appendChild(this.root)

    this.render(this.hooks.getState())
  }

  setInteractionStatus(status: string): void {
    this.interactionStatus = status
    this.render(this.hooks.getState())
  }

  render(state: PhysicsHudSnapshot): void {
    this.panel.style.display = state.isOpen ? 'block' : 'none'
    this.toggleButton.textContent = state.isOpen ? '收起物理 HUD' : '展开物理 HUD'
    this.toggleButton.setAttribute('aria-expanded', state.isOpen ? 'true' : 'false')

    const statusText = state.lastError ?? state.lastStatus
    this.statusLine.textContent = `状态：${this.interactionStatus} ｜ ${statusText}`
    this.statusLine.style.color = state.lastError
      ? RenderConfig.physicsHudStatusErrorColor
      : state.lastAppliedAt !== null
        ? RenderConfig.physicsHudStatusSuccessColor
        : RenderConfig.physicsHudStatusInfoColor

    this.summaryLine.textContent = state.hasModifiedValues
      ? `已修改 ${state.modifiedKeys.length} 项：${state.modifiedKeys.join(', ')}`
      : '当前全部参数均为默认值'
    this.diagnosticsLine.textContent = `诊断：fixedDt=${state.diagnostics.fixedDt.toFixed(4)}（只读）`
    this.resetButton.disabled = !state.hasModifiedValues
    this.resetButton.style.opacity = this.resetButton.disabled ? '0.5' : '1'

    for (const parameter of state.parameters) {
      const row = this.ensureParameterRow(parameter.key)
      row.current.textContent = parameter.currentValue.toString()
      row.defaultValue.textContent = parameter.defaultValue.toString()
      if (row.input.value !== parameter.valueText) {
        row.input.value = parameter.valueText
      }
      row.message.textContent = parameter.message ?? `生效方式：${parameter.applyMode}`
      row.message.style.color = parameter.message && !parameter.isValid
        ? RenderConfig.physicsHudStatusErrorColor
        : '#b9d4ea'
      row.dirtyBadge.textContent = parameter.isDirty ? '已修改' : '默认'
      row.dirtyBadge.style.color = parameter.isDirty ? '#ffe38d' : '#9ec5eb'
      row.applyButton.disabled = !parameter.isValid
      row.applyButton.style.opacity = row.applyButton.disabled ? '0.5' : '1'
    }

    this.syncLayout()
  }

  destroy(): void {
    this.root.remove()
  }

  private ensureParameterRow(key: PhysicsParameterKey): ParameterRowRefs {
    const existing = this.parameterRows.get(key)
    if (existing) {
      return existing
    }

    const parameter = this.hooks.getState().parameters.find((item) => item.key === key)
    if (!parameter) {
      throw new Error(`Missing parameter row for key: ${key}`)
    }

    const row = document.createElement('div')
    row.style.display = 'flex'
    row.style.flexDirection = 'column'
    row.style.gap = '6px'
    row.style.padding = '8px'
    row.style.borderRadius = '8px'
    row.style.background = 'rgba(255,255,255,0.05)'

    const heading = document.createElement('div')
    heading.style.display = 'flex'
    heading.style.justifyContent = 'space-between'
    heading.style.gap = '8px'

    const label = document.createElement('div')
    label.textContent = parameter.label
    label.style.fontWeight = '600'

    const dirtyBadge = document.createElement('span')

    heading.appendChild(label)
    heading.appendChild(dirtyBadge)

    const meta = document.createElement('div')
    meta.style.color = '#b9d4ea'
    const current = document.createElement('span')
    const defaultValue = document.createElement('span')
    meta.append('当前：', current, ' ｜ 默认：', defaultValue, ` ｜ 范围：${parameter.min}-${parameter.max}`)

    const controlRow = document.createElement('div')
    controlRow.style.display = 'flex'
    controlRow.style.gap = '8px'

    const input = document.createElement('input')
    input.type = 'text'
    input.style.flex = '1'
    input.style.padding = '6px 8px'
    input.style.borderRadius = '6px'
    input.style.border = '1px solid rgba(255,255,255,0.16)'
    input.style.background = 'rgba(255,255,255,0.08)'
    input.style.color = '#fff'
    input.addEventListener('input', () => {
      this.hooks.stageParameter(key, input.value)
      this.render(this.hooks.getState())
    })
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        this.hooks.applyParameter(key)
        this.render(this.hooks.getState())
      }
    })

    const applyButton = createButton('应用')
    applyButton.addEventListener('click', () => {
      this.hooks.applyParameter(key)
      this.render(this.hooks.getState())
    })

    controlRow.appendChild(input)
    controlRow.appendChild(applyButton)

    const description = document.createElement('div')
    description.textContent = parameter.description ?? ''
    description.style.color = '#d7e6f7'

    const message = document.createElement('div')

    row.appendChild(heading)
    row.appendChild(meta)
    row.appendChild(controlRow)
    row.appendChild(description)
    row.appendChild(message)
    this.parameterList.appendChild(row)

    const refs: ParameterRowRefs = {
      current,
      defaultValue,
      input,
      message,
      dirtyBadge,
      applyButton
    }
    this.parameterRows.set(key, refs)
    return refs
  }

  private syncLayout(): void {
    const viewport = this.hooks.getViewportSize?.() ?? { width: window.innerWidth, height: window.innerHeight }
    const rootRect = this.root.getBoundingClientRect()
    const overlaySize: OverlayLayoutSize = {
      width: rootRect.width || this.panel.offsetWidth || this.toggleButton.offsetWidth || RenderConfig.physicsHudPanelWidth,
      height: rootRect.height || this.toggleButton.offsetHeight + (this.panel.style.display === 'none' ? 0 : this.panel.offsetHeight)
    }
    const layout = calculateHudOverlayLayout({
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      overlaySize,
      bootStatusBoundary: this.hooks.getReservedBoundary?.() ?? null,
      preferredOffset: RenderConfig.physicsHudOffset,
      preferredGap: 8
    })

    this.root.style.left = `${layout.hudBoundary.left}px`
    this.root.style.top = `${layout.hudBoundary.top}px`
    if (layout.panelMaxHeight > 0) {
      this.panel.style.maxHeight = `${layout.panelMaxHeight}px`
    }
  }
}
