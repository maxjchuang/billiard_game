import type { BallBody } from '../../physics/body/BallBody'
import type { Logger } from '../../shared/logger/Logger'
import type { GameSession, GroupType, RoundResult, ShotContext } from '../session/GameSession'

const isScoringBall = (ball: BallBody | undefined): ball is BallBody => {
  return Boolean(ball && (ball.type === 'solid' || ball.type === 'stripe'))
}

export class RuleEngine {
  constructor(private readonly logger: Logger) {}

  resolve(session: GameSession, shotContext: ShotContext): RoundResult {
    const currentPlayer = session.currentPlayer
    const opponent = currentPlayer === 1 ? 2 : 1
    const reasons = [...shotContext.foulReasons]
    const firstHitBall = shotContext.firstHitBallId !== null ? session.getBallById(shotContext.firstHitBallId) : undefined
    const currentGroup = session.getCurrentAssignedGroup()
    let assignedGroup: GroupType | undefined

    if (!firstHitBall) {
      reasons.push('no-first-hit')
    }

    if (shotContext.cueBallPocketed) {
      reasons.push('cue-ball-pocketed')
    }

    if (currentGroup === 'unassigned') {
      if (firstHitBall?.type === 'black') {
        reasons.push('black-hit-before-group-assigned')
      }
      if (reasons.length === 0) {
        const firstPocketedScoringBall = shotContext.pocketedBallIds
          .map((ballId) => session.getBallById(ballId))
          .find((ball) => isScoringBall(ball))

        if (firstPocketedScoringBall) {
          assignedGroup = firstPocketedScoringBall.type as GroupType
        }
      }
    } else {
      const blackAllowed = session.areAllGroupBallsPocketed(currentGroup)
      const allowedFirstType = blackAllowed ? 'black' : currentGroup
      if (firstHitBall?.type !== allowedFirstType) {
        reasons.push('wrong-first-hit')
      }
    }

    if (shotContext.blackBallPocketed) {
      const blackIsLegal = currentGroup !== 'unassigned' && session.areAllGroupBallsPocketed(currentGroup) && firstHitBall?.type === 'black' && !shotContext.cueBallPocketed
      if (!blackIsLegal) {
        reasons.push('illegal-black-pocket')
      }
    }

    const foul = reasons.length > 0
    const legalPocketedScoringBalls = shotContext.pocketedBallIds
      .map((ballId) => session.getBallById(ballId))
      .filter((ball): ball is BallBody => Boolean(ball))
      .filter((ball) => ball.type === 'solid' || ball.type === 'stripe')

    const keepTurn = !foul && (
      shotContext.blackBallPocketed
      || legalPocketedScoringBalls.length > 0
    )

    const result: RoundResult = {
      foul,
      foulReasons: reasons,
      keepTurn,
      nextPlayer: keepTurn ? currentPlayer : opponent,
      gameOver: false,
      winner: null,
      assignedGroup
    }

    if (shotContext.blackBallPocketed) {
      result.gameOver = true
      result.winner = foul ? opponent : currentPlayer
    }

    this.logger.info('RuleEngine', 'resolve', {
      currentPlayer,
      currentGroup,
      firstHitBallId: shotContext.firstHitBallId,
      foul,
      foulReasons: reasons,
      keepTurn,
      gameOver: result.gameOver,
      winner: result.winner,
      assignedGroup
    })

    return result
  }
}
