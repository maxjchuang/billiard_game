import { describe, expect, it } from 'vitest'

import { MemoryLogger } from '../../src/shared/logger/Logger'
import { WebMouseController, type RectLike } from '../../src/web/input/WebMouseController'

const table: RectLike = { left: 0, right: 200, top: 0, bottom: 100 }

describe('WebMouseController', () => {
  it('fires exactly one shoot for one valid drag/release session', () => {
    const shoots: Array<{ angle: number; power: number }> = []
    const statuses: string[] = []

    const controller = new WebMouseController(
      {
        canShoot: () => true,
        previewShot: () => {},
        shoot: (angle, power) => shoots.push({ angle, power }),
        cancelPreview: () => {},
        setStatus: (status) => statuses.push(status)
      },
      new MemoryLogger()
    )

    controller.pointerDown({ clientX: 20, clientY: 20, button: 0 }, table)
    controller.pointerMove({ clientX: 120, clientY: 20 }, table)
    controller.pointerUp({ clientX: 120, clientY: 20 }, table)
    controller.pointerUp({ clientX: 130, clientY: 30 }, table)

    expect(shoots).toHaveLength(1)
    expect(statuses.at(-1)).toBe('已出杆')
  })

  it('does not shoot when released outside table', () => {
    let shootCount = 0
    let cancelCount = 0

    const controller = new WebMouseController(
      {
        canShoot: () => true,
        previewShot: () => {},
        shoot: () => {
          shootCount += 1
        },
        cancelPreview: () => {
          cancelCount += 1
        },
        setStatus: () => {}
      },
      new MemoryLogger()
    )

    controller.pointerDown({ clientX: 20, clientY: 20, button: 0 }, table)
    controller.pointerUp({ clientX: 250, clientY: 20 }, table)

    expect(shootCount).toBe(0)
    expect(cancelCount).toBe(1)
  })

  it('cancels current session and blocks shoot', () => {
    let shootCount = 0

    const controller = new WebMouseController(
      {
        canShoot: () => true,
        previewShot: () => {},
        shoot: () => {
          shootCount += 1
        },
        cancelPreview: () => {},
        setStatus: () => {}
      },
      new MemoryLogger()
    )

    controller.pointerDown({ clientX: 20, clientY: 20, button: 0 }, table)
    controller.cancel('cancel by test')
    controller.pointerUp({ clientX: 80, clientY: 20 }, table)

    expect(shootCount).toBe(0)
    expect(controller.active).toBe(false)
  })
})
