import { describe, expect, it } from 'vitest'

import { GameSession } from '../../src/gameplay/session/GameSession'
import { createBall } from '../../src/physics/body/BallBody'
import { Vector2 } from '../../src/physics/math/Vector2'
import { MemoryLogger } from '../../src/shared/logger/Logger'

describe('GameSession', () => {
  it('assigns groups before switching current player', () => {
    const logger = new MemoryLogger()
    const session = GameSession.createDemoSession(logger, [
      createBall({ id: 0, type: 'cue', number: 0, position: new Vector2(0, 0) }),
      createBall({ id: 1, type: 'solid', number: 1, position: new Vector2(20, 0) }),
      createBall({ id: 9, type: 'stripe', number: 9, position: new Vector2(40, 0) }),
      createBall({ id: 8, type: 'black', number: 8, position: new Vector2(60, 0) })
    ])

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
})
