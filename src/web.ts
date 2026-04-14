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
