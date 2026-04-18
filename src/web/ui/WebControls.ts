import type { WebControlAction } from '../input/mapWebControlAction'

export interface WebControlsAvailability {
  canStartMatch: boolean
  canRestart: boolean
  canBackMenu: boolean
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
  private readonly startButton: HTMLButtonElement
  private readonly restartButton: HTMLButtonElement
  private readonly backMenuButton: HTMLButtonElement

  constructor(onAction: (action: WebControlAction) => void) {
    this.root = document.createElement('div')
    this.root.id = 'web-controls'
    this.root.style.position = 'fixed'
    this.root.style.right = '10px'
    this.root.style.top = '10px'
    this.root.style.display = 'flex'
    this.root.style.gap = '8px'
    this.root.style.zIndex = '10000'

    this.startButton = createButton('开始对局')
    this.restartButton = createButton('重开')
    this.backMenuButton = createButton('返回菜单')

    this.startButton.addEventListener('click', () => onAction('start-match'))
    this.restartButton.addEventListener('click', () => onAction('restart-match'))
    this.backMenuButton.addEventListener('click', () => onAction('back-menu'))

    this.root.appendChild(this.startButton)
    this.root.appendChild(this.restartButton)
    this.root.appendChild(this.backMenuButton)
    document.body.appendChild(this.root)
  }

  setAvailability(availability: WebControlsAvailability): void {
    this.startButton.disabled = !availability.canStartMatch
    this.restartButton.disabled = !availability.canRestart
    this.backMenuButton.disabled = !availability.canBackMenu

    this.startButton.style.opacity = this.startButton.disabled ? '0.5' : '1'
    this.restartButton.style.opacity = this.restartButton.disabled ? '0.5' : '1'
    this.backMenuButton.style.opacity = this.backMenuButton.disabled ? '0.5' : '1'
  }

  destroy(): void {
    this.root.remove()
  }
}
