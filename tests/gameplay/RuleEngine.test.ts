import { describe, expect, it } from 'vitest'

import { RuleEngine } from '../../src/gameplay/rules/RuleEngine'
import { GameSession } from '../../src/gameplay/session/GameSession'
import { createBall } from '../../src/physics/body/BallBody'
import { Vector2 } from '../../src/physics/math/Vector2'
import { MemoryLogger } from '../../src/shared/logger/Logger'

describe('RuleEngine', () => {
  it('marks a cue-ball pocket as foul and switches turn', () => {
    const logger = new MemoryLogger()
    const session = GameSession.createDemoSession(logger, [
      createBall({ id: 0, type: 'cue', number: 0, position: new Vector2(0, 0) }),
      createBall({ id: 1, type: 'solid', number: 1, position: new Vector2(20, 0) }),
      createBall({ id: 8, type: 'black', number: 8, position: new Vector2(40, 0) })
    ])
    const ruleEngine = new RuleEngine(logger)

    const result = ruleEngine.resolve(session, {
      firstHitBallId: 1,
      pocketedBallIds: [],
      cueBallPocketed: true,
      blackBallPocketed: false,
      railHitAfterContact: true,
      foulReasons: []
    })

    expect(result.foul).toBe(true)
    expect(result.nextPlayer).toBe(2)
    expect(result.foulReasons).toContain('cue-ball-pocketed')
  })
})
