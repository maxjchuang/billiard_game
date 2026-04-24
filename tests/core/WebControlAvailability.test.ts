import { describe, expect, it } from 'vitest'

import { GameApp } from '../../src/game/GameApp'
import { getPhysicsHudParameter } from '../game/physicsHudFixtures'
import { MemoryLogger } from '../../src/shared/logger/Logger'
import { calculateHudOverlayLayout } from '../../src/web/ui/WebHudOverlay'
import {
  createBootStatusBoundary,
  expectBoundariesSeparated,
  getElementBoundaryFromDom,
  renderHudOverlayDom
} from '../game/physicsHudFixtures'

describe('Web control availability', () => {
  it('returns correct control availability by state', () => {
    const app = new GameApp(new MemoryLogger())

    const bootAvailability = app.debugGetInputAvailability()
    expect(bootAvailability.canStartMatch).toBe(false)

    app.debugBackMenu()
    const menuAvailability = app.debugGetInputAvailability()
    expect(menuAvailability.canStartMatch).toBe(true)
    expect(menuAvailability.canRestart).toBe(false)

    app.startMatch()
    const aimingAvailability = app.debugGetInputAvailability()
    expect(aimingAvailability.canShoot).toBe(true)
    expect(aimingAvailability.canRestart).toBe(true)
    expect(aimingAvailability.canBackMenu).toBe(true)
  })

  it('starts with a collapsed HUD and exposes validation state for parameter drafts', () => {
    const app = new GameApp(new MemoryLogger())

    const initialHudState = app.debugGetPhysicsHudState()
    expect(initialHudState.isOpen).toBe(false)

    app.debugSetPhysicsHudOpen(true)
    app.debugStagePhysicsParameter('friction', '')
    let friction = getPhysicsHudParameter(app, 'friction')
    expect(friction.isValid).toBe(false)
    expect(friction.message).toContain('未生效')

    app.debugStagePhysicsParameter('friction', '0.999')
    friction = getPhysicsHudParameter(app, 'friction')
    expect(friction.isValid).toBe(true)
    expect(app.debugGetPhysicsHudState().isOpen).toBe(true)
  })

  it('keeps collapsed and expanded HUD boundaries separated from boot status', () => {
    const bootStatus = createBootStatusBoundary()

    const collapsed = calculateHudOverlayLayout({
      viewportWidth: 1280,
      viewportHeight: 720,
      overlaySize: { width: 132, height: 40 },
      bootStatusBoundary: bootStatus,
      preferredOffset: 10,
      preferredGap: 8
    })

    const expanded = calculateHudOverlayLayout({
      viewportWidth: 1280,
      viewportHeight: 720,
      overlaySize: { width: 320, height: 264 },
      bootStatusBoundary: bootStatus,
      preferredOffset: 10,
      preferredGap: 8
    })

    expectBoundariesSeparated(collapsed.hudBoundary, bootStatus)
    expectBoundariesSeparated(expanded.hudBoundary, bootStatus)
    expect(expanded.panelMaxHeight).toBeLessThanOrEqual(320)
  })

  it('keeps validation-error and long-copy HUD states reachable in a narrow window', () => {
    const bootStatus = createBootStatusBoundary({ right: 220, bottom: 52 })

    const layout = calculateHudOverlayLayout({
      viewportWidth: 360,
      viewportHeight: 540,
      overlaySize: { width: 360, height: 348 },
      bootStatusBoundary: bootStatus,
      preferredOffset: 10,
      preferredGap: 8
    })

    expectBoundariesSeparated(layout.hudBoundary, bootStatus)
    expect(layout.hudBoundary.top).toBeGreaterThanOrEqual(bootStatus.bottom + 8)
    expect(layout.panelMaxHeight).toBeGreaterThanOrEqual(160)
  })

  it('renders actual DOM boundaries without overlapping boot status', () => {
    const app = new GameApp(new MemoryLogger())
    app.startMatch()

    const collapsedDom = renderHudOverlayDom(app.debugGetPhysicsHudState())
    const collapsedHud = getElementBoundaryFromDom(collapsedDom.document, 'web-hud-overlay')
    const collapsedStatus = getElementBoundaryFromDom(collapsedDom.document, 'boot-status')

    app.debugSetPhysicsHudOpen(true)
    app.debugStagePhysicsParameter('friction', '')
    app.debugApplyPhysicsParameter('friction')
    const expandedDom = renderHudOverlayDom(app.debugGetPhysicsHudState(), { longCopy: true })
    const expandedHud = getElementBoundaryFromDom(expandedDom.document, 'web-hud-overlay')
    const expandedStatus = getElementBoundaryFromDom(expandedDom.document, 'boot-status')

    expectBoundariesSeparated(collapsedHud, collapsedStatus)
    expectBoundariesSeparated(expandedHud, expandedStatus)
    expect(expandedHud.top).toBeGreaterThanOrEqual(expandedStatus.bottom + 8)
  })
})
