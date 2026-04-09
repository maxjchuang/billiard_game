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
    session.applyRoundResult(result)

    this.logger.info('RoundResolver', 'round-resolved', {
      nextPlayer: result.nextPlayer,
      keepTurn: result.keepTurn,
      foul: result.foul,
      winner: result.winner,
      gameOver: result.gameOver
    })

    return result
  }
}
