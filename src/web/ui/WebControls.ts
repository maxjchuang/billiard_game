import type { WebControlAction } from '../input/mapWebControlAction'

export interface WebControlsAvailability {
  canStartMatch: boolean
  canRestart: boolean
  canBackMenu: boolean
  breakOptionActions: WebControlAction[]
  groupSelectionActions: WebControlAction[]
}

function createButton(text: string): HTMLButtonElement {
  const button = document.createElement('button')
  button.textContent = text
  button.style.padding = '8px 12px'
  button.style.border = '1px solid rgba(255,255,255,0.35)'
  button.style.borderRadius = '8px'
  button.style.background = 'rgba(0,0,0,0.5)'
  button.style.color = '#fff'
  button.style.cursor = 'pointer'
  return button
}

export class WebControls {
  private readonly root: HTMLDivElement
  private readonly decisionRow: HTMLDivElement
  private readonly startButton: HTMLButtonElement
  private readonly restartButton: HTMLButtonElement
  private readonly backMenuButton: HTMLButtonElement
  private readonly decisionButtons: Partial<Record<WebControlAction, HTMLButtonElement>>

  constructor(onAction: (action: WebControlAction) => void) {
    this.root = document.createElement('div')
    this.root.id = 'web-controls'
    this.root.style.position = 'fixed'
    this.root.style.right = '10px'
    this.root.style.top = '10px'
    this.root.style.display = 'flex'
    this.root.style.flexDirection = 'column'
    this.root.style.gap = '8px'
    this.root.style.zIndex = '10000'

    const primaryRow = document.createElement('div')
    primaryRow.style.display = 'flex'
    primaryRow.style.gap = '8px'

    this.decisionRow = document.createElement('div')
    this.decisionRow.style.display = 'flex'
    this.decisionRow.style.gap = '8px'
    this.decisionRow.style.flexWrap = 'wrap'

    this.startButton = createButton('开始对局')
    this.restartButton = createButton('重开')
    this.backMenuButton = createButton('返回菜单')
    this.decisionButtons = {
      'break-option-behind-line-ball-in-hand': createButton('线后自由球'),
      'break-option-re-rack': createButton('要求重开'),
      'break-option-accept-table': createButton('接受台面'),
      'group-solid': createButton('选全色'),
      'group-stripe': createButton('选花色')
    }

    this.startButton.addEventListener('click', () => onAction('start-match'))
    this.restartButton.addEventListener('click', () => onAction('restart-match'))
    this.backMenuButton.addEventListener('click', () => onAction('back-menu'))
    ;(Object.keys(this.decisionButtons) as WebControlAction[]).forEach((action) => {
      const button = this.decisionButtons[action]
      if (!button) {
        return
      }
      button.addEventListener('click', () => onAction(action))
      button.style.display = 'none'
      this.decisionRow.appendChild(button)
    })

    primaryRow.appendChild(this.startButton)
    primaryRow.appendChild(this.restartButton)
    primaryRow.appendChild(this.backMenuButton)
    this.root.appendChild(primaryRow)
    this.root.appendChild(this.decisionRow)
    document.body.appendChild(this.root)
  }

  setAvailability(availability: WebControlsAvailability): void {
    this.startButton.disabled = !availability.canStartMatch
    this.restartButton.disabled = !availability.canRestart
    this.backMenuButton.disabled = !availability.canBackMenu

    this.startButton.style.opacity = this.startButton.disabled ? '0.5' : '1'
    this.restartButton.style.opacity = this.restartButton.disabled ? '0.5' : '1'
    this.backMenuButton.style.opacity = this.backMenuButton.disabled ? '0.5' : '1'

    const visibleDecisionActions = new Set([...availability.breakOptionActions, ...availability.groupSelectionActions])
    ;(Object.keys(this.decisionButtons) as WebControlAction[]).forEach((action) => {
      const button = this.decisionButtons[action]
      if (!button) {
        return
      }

      const visible = visibleDecisionActions.has(action)
      button.style.display = visible ? 'inline-flex' : 'none'
      button.disabled = !visible
    })
  }

  destroy(): void {
    this.root.remove()
  }
}
