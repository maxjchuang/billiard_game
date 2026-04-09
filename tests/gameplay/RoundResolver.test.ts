import { describe, expect, it } from 'vitest'

import { RoundResolver } from '../../src/gameplay/flow/RoundResolver'
import { RuleEngine } from '../../src/gameplay/rules/RuleEngine'
import { GameSession } from '../../src/gameplay/session/GameSession'
import { createBall } from '../../src/physics/body/BallBody'
import { Vector2 } from '../../src/physics/math/Vector2'
import { MemoryLogger } from '../../src/shared/logger/Logger'

describe('RoundResolver', () => {
  it('applies result to the session and writes chain logs', () => {
    const logger = new MemoryLogger()
    const session = GameSession.createDemoSession(logger, [
      createBall({ id: 0, type: 'cue', number: 0, position: new Vector2(0, 0) }),
      createBall({ id: 1, type: 'solid', number: 1, position: new Vector2(20, 0), pocketed: true, active: false }),
      createBall({ id: 8, type: 'black', number: 8, position: new Vector2(40, 0) })
    ])
    const resolver = new RoundResolver(new RuleEngine(logger), logger)

    const result = resolver.resolve(session, {
      firstHitBallId: 1,
      pocketedBallIds: [1],
      cueBallPocketed: false,
      blackBallPocketed: false,
      railHitAfterContact: true,
      foulReasons: []
    })

    expect(result.keepTurn).toBe(true)
    expect(session.turnState.currentPlayer).toBe(1)
    expect(logger.entries.some((entry) => entry.scope === 'RoundResolver' && entry.message === 'round-resolved')).toBe(true)
  })
})
