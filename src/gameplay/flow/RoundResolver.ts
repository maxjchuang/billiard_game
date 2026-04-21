import { GameConfig } from '../../config/GameConfig'
import { Vector2 } from '../../physics/math/Vector2'
import type { Logger } from '../../shared/logger/Logger'
import { RuleEngine } from '../rules/RuleEngine'
import type { GameSession, RoundResult, ShotContext } from '../session/GameSession'

export class RoundResolver {
  constructor(
    private readonly ruleEngine: RuleEngine,
    private readonly logger: Logger
  ) {}

  resolve(session: GameSession, shotContext: ShotContext): RoundResult {
    session.markPocketedBallIds(shotContext.pocketedBallIds)
    const result = this.ruleEngine.resolve(session, shotContext)

    for (const ballId of result.respottedBallIds ?? []) {
      if (ballId === session.tableState.blackBallId) {
        session.respotBall(ballId, new Vector2(GameConfig.rackSpotX, GameConfig.tableCenterY))
        this.logger.info('RoundResolver', 'black-respot-applied', { ballId })
      }
    }

    session.applyRoundResult(result)

    this.logger.info('RoundResolver', 'round-resolved', {
      nextPlayer: result.nextPlayer,
      keepTurn: result.keepTurn,
      foul: result.foul,
      winner: result.winner,
      gameOver: result.gameOver,
      pendingDecisionKind: result.pendingDecision?.kind ?? null,
      respottedBallIds: result.respottedBallIds ?? []
    })

    return result
  }
}
