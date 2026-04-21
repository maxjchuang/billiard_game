import { GameBootstrap } from './game/GameBootstrap'
import { RenderConfig } from './config/RenderConfig'
import { createDefaultLogger } from './shared/logger/Logger'
import { toControlIntent, WebMouseController } from './web/input'
import { WebControls, WebHudOverlay } from './web/ui'

const status = document.getElementById('boot-status')

try {
  const app = GameBootstrap.autoBoot()
  if (status) {
    status.textContent = app ? '状态：booted（Web Debug）' : '状态：boot_failed'
  }

  // Web 调试壳：启动 RAF 循环驱动 GameApp.step()
  // 否则只会完成 boot，不会进入渲染/物理循环，画面看起来就只有状态条。
  if (app) {
    const overlay = new WebHudOverlay({
      getState: () => app.debugGetPhysicsHudState(),
      setOpen: (isOpen) => app.debugSetPhysicsHudOpen(isOpen),
      stageParameter: (key, valueText) => {
        app.debugStagePhysicsParameter(key, valueText)
      },
      applyParameter: (key) => app.debugApplyPhysicsParameter(key),
      resetParameters: () => app.debugResetPhysicsParameters()
    })
    const controls = new WebControls((action) => {
      app.debugPushIntent(toControlIntent(action))
    })

    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null
    const getTableRect = () => {
      if (!canvas) {
        return null
      }
      const rect = canvas.getBoundingClientRect()
      const hudHeightInClient = RenderConfig.hudHeight * (rect.height / canvas.height)
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top + hudHeightInClient,
        bottom: rect.bottom
      }
    }

    const mouseController = new WebMouseController(
      {
        canShoot: () => app.debugGetInputAvailability().canShoot,
        previewShot: (angle, power) => app.debugPushIntent({ type: 'preview-shot', angle, power }),
        shoot: (angle, power) => app.debugPushIntent({ type: 'shoot', angle, power }),
        cancelPreview: () => app.debugPushIntent({ type: 'cancel-shot' }),
        setStatus: (text) => overlay.setInteractionStatus(text)
      },
      createDefaultLogger()
    )

    if (canvas) {
      canvas.style.cursor = 'crosshair'
      canvas.addEventListener('mousedown', (event) => {
        const rect = getTableRect()
        if (!rect) {
          return
        }
        mouseController.pointerDown(event, rect)
      })
      canvas.addEventListener('contextmenu', (event) => {
        event.preventDefault()
        mouseController.cancel('右键取消')
      })
      window.addEventListener('mousemove', (event) => {
        const rect = getTableRect()
        if (!rect) {
          return
        }
        mouseController.pointerMove(event, rect)
      })
      window.addEventListener('mouseup', (event) => {
        const rect = getTableRect()
        if (!rect) {
          return
        }
        mouseController.pointerUp(event, rect)
      })
      window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          mouseController.cancel('按下 Esc 取消')
        }
      })
    }

    // 暴露给 browser-use 的调试接口（仅 Web 调试入口使用）
    ;(globalThis as any).__BILLIARD_APP__ = app

    ;(globalThis as any).__BILLIARD_DEBUG__ = {
      startMatch: () => app.debugStartMatch(),
      shoot: (angle: number, power: number) => app.debugShoot(angle, power),
      advance: (steps: number, dtSeconds: number) => app.debugAdvance(steps, dtSeconds),
      placeBall: (ballId: number, x: number, y: number) => app.debugPlaceBall(ballId, x, y),
      assignGroup: (group: 'solid' | 'stripe') => app.debugAssignCurrentPlayerGroup(group),
      chooseGroup: (group: 'solid' | 'stripe') => app.debugChooseGroup(group),
      chooseBreakOption: (option: 'behind-line-ball-in-hand' | 're-rack' | 'accept-table') => app.debugChooseBreakFoulOption(option),
      markAllGroupPocketed: (group: 'solid' | 'stripe') => app.debugMarkAllGroupPocketed(group),
      resolveShot: (shotContext: any) => app.debugResolveShot(shotContext),
      setPhysicsHudOpen: (isOpen: boolean) => app.debugSetPhysicsHudOpen(isOpen),
      stagePhysicsParameter: (key: string, valueText: string) => app.debugStagePhysicsParameter(key as any, valueText),
      applyPhysicsParameter: (key: string) => app.debugApplyPhysicsParameter(key as any),
      resetPhysicsParameters: () => app.debugResetPhysicsParameters(),
      getPhysicsHudState: () => app.debugGetPhysicsHudState(),
      restartMatch: () => app.debugRestartMatch(),
      backMenu: () => app.debugBackMenu(),
      pause: () => app.debugPause(),
      resume: () => app.debugResume(),
      setRenderEnabled: (enabled: boolean) => app.debugSetRenderEnabled(enabled),
      getState: () => app.debugGetState()
    }

    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      app.step(dt)
      const availability = app.debugGetInputAvailability()
      controls.setAvailability(availability)
      if (!mouseController.active) {
        overlay.setInteractionStatus(`state=${availability.state}`)
      }
      overlay.render(app.debugGetPhysicsHudState())
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }
} catch (error) {
  if (status) {
    status.textContent = '状态：boot_error'
  }
  // eslint-disable-next-line no-console
  console.error(error)
}
