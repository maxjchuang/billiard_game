import { describe, expect, it } from 'vitest'

import { computeTableLayout } from '../../src/shared/TableLayout'

describe('TableLayout', () => {
  it('derives feltRect by excluding rails', () => {
    const layout = computeTableLayout({
      width: 640,
      height: 360,
      railThickness: 20,
      pocketVisualRadius: 18,
      pocketCaptureRadius: 18
    })

    expect(layout.feltRect).toEqual({ x: 20, y: 20, width: 600, height: 320 })
  })

  it('creates 6 inset pockets (4 corners + 2 side middles)', () => {
    const layout = computeTableLayout({
      width: 640,
      height: 360,
      railThickness: 20,
      pocketVisualRadius: 18,
      pocketCaptureRadius: 18
    })

    const byId = Object.fromEntries(layout.pockets.map((p) => [p.id, p]))

    expect(layout.pockets).toHaveLength(6)
    expect(Object.keys(byId).sort()).toEqual(
      ['topLeft', 'topMiddle', 'topRight', 'bottomLeft', 'bottomMiddle', 'bottomRight'].sort()
    )

    expect(byId.topLeft.center).toEqual({ x: 20, y: 20 })
    expect(byId.topMiddle.center).toEqual({ x: 320, y: 20 })
    expect(byId.topRight.center).toEqual({ x: 620, y: 20 })
    expect(byId.bottomLeft.center).toEqual({ x: 20, y: 340 })
    expect(byId.bottomMiddle.center).toEqual({ x: 320, y: 340 })
    expect(byId.bottomRight.center).toEqual({ x: 620, y: 340 })
  })

  it('keeps pocket centers inset by railThickness', () => {
    const railThickness = 20
    const width = 640
    const height = 360
    const layout = computeTableLayout({
      width,
      height,
      railThickness,
      pocketVisualRadius: 18,
      pocketCaptureRadius: 18
    })

    const byId = Object.fromEntries(layout.pockets.map((p) => [p.id, p]))

    expect(byId.topLeft.center.x).toBe(railThickness)
    expect(byId.topLeft.center.y).toBe(railThickness)
    expect(byId.topRight.center.x).toBe(width - railThickness)
    expect(byId.topRight.center.y).toBe(railThickness)
    expect(byId.topMiddle.center.x).toBe(width / 2)
    expect(byId.topMiddle.center.y).toBe(railThickness)

    expect(byId.bottomLeft.center.x).toBe(railThickness)
    expect(byId.bottomLeft.center.y).toBe(height - railThickness)
    expect(byId.bottomRight.center.x).toBe(width - railThickness)
    expect(byId.bottomRight.center.y).toBe(height - railThickness)
    expect(byId.bottomMiddle.center.x).toBe(width / 2)
    expect(byId.bottomMiddle.center.y).toBe(height - railThickness)
  })
})
