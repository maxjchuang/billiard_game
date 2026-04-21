import { describe, expect, it } from 'vitest'

import { GameSession } from '../../src/gameplay/session/GameSession'
import { MemoryLogger } from '../../src/shared/logger/Logger'
import { createChineseEightBallBallSet } from '../gameplay/support/chineseEightBallFixtures'

describe('GameSession', () => {
  it('assigns groups before switching current player', () => {
    const logger = new MemoryLogger()
    const session = GameSession.createDemoSession(logger, createChineseEightBallBallSet())

    session.applyRoundResult({
      foul: false,
      foulReasons: [],
      keepTurn: false,
      nextPlayer: 2,
      gameOver: false,
      winner: null,
      assignedGroup: 'solid'
    })

    expect(session.playerGroups[1]).toBe('solid')
    expect(session.playerGroups[2]).toBe('stripe')
    expect(session.turnState.currentPlayer).toBe(2)
  })

  it('stores and resolves a mixed-pot group selection decision', () => {
    const logger = new MemoryLogger()
    const session = GameSession.createDemoSession(logger, createChineseEightBallBallSet())

    session.applyRoundResult({
      foul: false,
      foulReasons: [],
      keepTurn: true,
      nextPlayer: 1,
      gameOver: false,
      winner: null,
      pendingDecision: {
        kind: 'group-selection',
        actor: 1,
        options: ['solid', 'stripe']
      }
    })

    expect(session.pendingDecision).toMatchObject({ kind: 'group-selection', actor: 1 })

    session.resolvePendingDecision('solid')

    expect(session.pendingDecision).toBeNull()
    expect(session.playerGroups[1]).toBe('solid')
    expect(session.playerGroups[2]).toBe('stripe')
  })
})
