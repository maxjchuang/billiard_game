import { describe, expect, it } from 'vitest'

import { RuleConfig } from '../../src/config/RuleConfig'
import { RuleEngine } from '../../src/gameplay/rules/RuleEngine'
import { GameSession } from '../../src/gameplay/session/GameSession'
import { MemoryLogger } from '../../src/shared/logger/Logger'
import { createChineseEightBallBallSet, createShotContext } from '../gameplay/support/chineseEightBallFixtures'

describe('RuleEngine', () => {
  it('marks a cue-ball pocket as foul and switches turn', () => {
    const logger = new MemoryLogger()
    const session = GameSession.createDemoSession(logger, createChineseEightBallBallSet())
    const ruleEngine = new RuleEngine(logger)

    const result = ruleEngine.resolve(session, createShotContext({ cueBallPocketed: true }))

    expect(result.foul).toBe(true)
    expect(result.nextPlayer).toBe(2)
    expect(result.foulReasons).toContain('cue-ball-pocketed')
  })

  it('creates a break-foul pending decision with the three opponent options', () => {
    const logger = new MemoryLogger()
    const session = GameSession.createDemoSession(logger, createChineseEightBallBallSet())
    const ruleEngine = new RuleEngine(logger)

    const result = ruleEngine.resolve(session, createShotContext({
      isOpeningBreak: true,
      pocketedBallIds: [],
      objectBallRailContactIds: [1, 2, 3]
    }))

    expect(result.foul).toBe(true)
    expect(result.pendingDecision).toMatchObject({
      kind: 'break-foul-option',
      actor: 2,
      options: [...RuleConfig.openingBreakOptions]
    })
  })

  it('accepts an opening break when four distinct object balls hit rails', () => {
    const logger = new MemoryLogger()
    const session = GameSession.createDemoSession(logger, createChineseEightBallBallSet())
    const ruleEngine = new RuleEngine(logger)

    const result = ruleEngine.resolve(session, createShotContext({
      isOpeningBreak: true,
      pocketedBallIds: [],
      objectBallRailContactIds: [1, 2, 3, 4]
    }))

    expect(result.foul).toBe(false)
    expect(result.keepTurn).toBe(false)
    expect(result.pendingDecision).toBeUndefined()
  })

  it('creates a pending group choice when the first legal pot contains both groups', () => {
    const logger = new MemoryLogger()
    const session = GameSession.createDemoSession(logger, createChineseEightBallBallSet())
    const ruleEngine = new RuleEngine(logger)

    const result = ruleEngine.resolve(session, createShotContext({
      pocketedBallIds: [1, 9]
    }))

    expect(result.foul).toBe(false)
    expect(result.pendingDecision).toMatchObject({
      kind: 'group-selection',
      actor: 1,
      options: ['solid', 'stripe']
    })
  })

  it('treats an early black pocket as an illegal loss', () => {
    const logger = new MemoryLogger()
    const session = GameSession.createDemoSession(logger, createChineseEightBallBallSet())
    const ruleEngine = new RuleEngine(logger)

    session.assignCurrentPlayerGroup('solid')

    const result = ruleEngine.resolve(session, createShotContext({
      firstHitBallId: 8,
      pocketedBallIds: [8],
      blackBallPocketed: true
    }))

    expect(result.foul).toBe(true)
    expect(result.gameOver).toBe(true)
    expect(result.winner).toBe(2)
    expect(result.foulReasons).toContain('illegal-black-pocket')
  })
})
