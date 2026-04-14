import { GameBootstrap } from './game/GameBootstrap'

const status = document.getElementById('boot-status')

try {
  const app = GameBootstrap.autoBoot()
  if (status) {
    status.textContent = app ? '状态：booted（Web Debug）' : '状态：boot_failed'
  }

  // Web 调试壳：启动 RAF 循环驱动 GameApp.step()
  // 否则只会完成 boot，不会进入渲染/物理循环，画面看起来就只有状态条。
  if (app) {
    // 暴露给 browser-use 的调试接口（仅 Web 调试入口使用）
    ;(globalThis as any).__BILLIARD_APP__ = app

    ;(globalThis as any).__BILLIARD_DEBUG__ = {
      startMatch: () => app.debugStartMatch(),
      shoot: (angle: number, power: number) => app.debugShoot(angle, power),
      advance: (steps: number, dtSeconds: number) => app.debugAdvance(steps, dtSeconds),
      placeBall: (ballId: number, x: number, y: number) => app.debugPlaceBall(ballId, x, y),
      assignGroup: (group: 'solid' | 'stripe') => app.debugAssignCurrentPlayerGroup(group),
      markAllGroupPocketed: (group: 'solid' | 'stripe') => app.debugMarkAllGroupPocketed(group),
      resolveShot: (shotContext: any) => app.debugResolveShot(shotContext),
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
