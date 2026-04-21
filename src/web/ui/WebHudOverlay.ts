export class WebHudOverlay {
  private readonly root: HTMLDivElement

  constructor() {
    this.root = document.createElement('div')
    this.root.id = 'web-hud-overlay'
    this.root.style.position = 'fixed'
    this.root.style.left = '10px'
    // Keep away from bottom pockets in small windows.
    this.root.style.top = '10px'
    this.root.style.padding = '8px 12px'
    this.root.style.borderRadius = '8px'
    this.root.style.background = 'rgba(0,0,0,0.55)'
    this.root.style.color = '#fff'
    this.root.style.fontSize = '13px'
    this.root.style.zIndex = '10000'
    this.root.style.pointerEvents = 'none'
    this.root.textContent = '准备就绪'
    document.body.appendChild(this.root)
  }

  setStatus(status: string): void {
    this.root.textContent = `状态：${status}`
  }

  destroy(): void {
    this.root.remove()
  }
}
