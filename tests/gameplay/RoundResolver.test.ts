import { describe, expect, it } from 'vitest'

import { GameConfig } from '../../src/config/GameConfig'
import { RoundResolver } from '../../src/gameplay/flow/RoundResolver'
import { RuleEngine } from '../../src/gameplay/rules/RuleEngine'
import { GameSession } from '../../src/gameplay/session/GameSession'
import { MemoryLogger } from '../../src/shared/logger/Logger'
import { createChineseEightBallBallSet, createShotContext } from '../gameplay/support/chineseEightBallFixtures'

describe('RoundResolver', () => {
  it('applies result to the session and writes chain logs', () => {
    const logger = new MemoryLogger()
    const session = GameSession.createDemoSession(logger, createChineseEightBallBallSet())
    const resolver = new RoundResolver(new RuleEngine(logger), logger)

    const result = resolver.resolve(session, createShotContext({ pocketedBallIds: [1] }))

    expect(result.keepTurn).toBe(true)
    expect(session.turnState.currentPlayer).toBe(1)
    expect(logger.entries.some((entry) => entry.scope === 'RoundResolver' && entry.message === 'round-resolved')).toBe(true)
  })

  it('respots the black on a legal black-8 opening break and keeps the breaker at the table', () => {
    const logger = new MemoryLogger()
    const session = GameSession.createDemoSession(logger, createChineseEightBallBallSet())
    const resolver = new RoundResolver(new RuleEngine(logger), logger)

    const result = resolver.resolve(session, createShotContext({
      isOpeningBreak: true,
      pocketedBallIds: [8],
      blackBallPocketed: true,
      objectBallRailContactIds: [1, 2, 3, 4]
    }))

    const blackBall = session.getBallById(8)

    expect(result.gameOver).toBe(false)
    expect(result.keepTurn).toBe(true)
    expect(result.respottedBallIds).toEqual([8])
    expect(blackBall?.pocketed).toBe(false)
    expect(blackBall?.position.x).toBe(GameConfig.rackSpotX)
    expect(blackBall?.position.y).toBe(GameConfig.tableCenterY)
  })

  it('respots the black and creates opponent options when the opening break black also fouls', () => {
    const logger = new MemoryLogger()
    const session = GameSession.createDemoSession(logger, createChineseEightBallBallSet())
    const resolver = new RoundResolver(new RuleEngine(logger), logger)

    const result = resolver.resolve(session, createShotContext({
      isOpeningBreak: true,
      pocketedBallIds: [8],
      blackBallPocketed: true,
      cueBallPocketed: true,
      objectBallRailContactIds: [1, 2, 3, 4]
    }))

    const blackBall = session.getBallById(8)

    expect(result.foul).toBe(true)
    expect(result.respottedBallIds).toEqual([8])
    expect(result.pendingDecision?.kind).toBe('break-foul-option')
    expect(blackBall?.pocketed).toBe(false)
  })
})
