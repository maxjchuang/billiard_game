import { RuleConfig } from '../../config/RuleConfig'
import type { BallBody } from '../../physics/body/BallBody'
import type { Logger } from '../../shared/logger/Logger'
import type { GameSession, GroupType, PendingDecision, RoundResult, ShotContext } from '../session/GameSession'

const isScoringBall = (ball: BallBody | undefined): ball is BallBody => {
  return Boolean(ball && (ball.type === 'solid' || ball.type === 'stripe'))
}

export class RuleEngine {
  constructor(private readonly logger: Logger) {}

  resolve(session: GameSession, shotContext: ShotContext): RoundResult {
    const currentPlayer = session.currentPlayer
    const opponent = currentPlayer === 1 ? 2 : 1
    const currentGroup = session.getCurrentAssignedGroup()

    if (shotContext.isOpeningBreak) {
      return this.resolveOpeningBreak(session, shotContext, currentPlayer, opponent, currentGroup)
    }

    const reasons = [...shotContext.foulReasons]
    const firstHitBall = shotContext.firstHitBallId !== null ? session.getBallById(shotContext.firstHitBallId) : undefined
    let assignedGroup: GroupType | undefined
    let pendingDecision: PendingDecision | undefined

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
        const assignmentOutcome = this.createGroupAssignmentOutcome(session, shotContext, currentPlayer)
        assignedGroup = assignmentOutcome.assignedGroup
        pendingDecision = assignmentOutcome.pendingDecision
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
      assignedGroup,
      pendingDecision,
      cueBallInHand: foul
    }

    if (shotContext.blackBallPocketed) {
      result.gameOver = true
      result.winner = foul ? opponent : currentPlayer
      this.logger.info('RuleEngine', foul ? 'illegal-black-outcome' : 'legal-black-outcome', {
        currentPlayer,
        opponent,
        winner: result.winner
      })
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

  private resolveOpeningBreak(
    session: GameSession,
    shotContext: ShotContext,
    currentPlayer: 1 | 2,
    opponent: 1 | 2,
    currentGroup: GameSession['playerGroups'][1]
  ): RoundResult {
    this.logger.info('RuleEngine', 'break-validation-start', {
      currentPlayer,
      pocketedBallIds: shotContext.pocketedBallIds,
      objectBallRailContactIds: shotContext.objectBallRailContactIds,
      ballsOffTable: shotContext.ballsOffTable
    })

    const reasons = [...shotContext.foulReasons]
    const firstHitBall = shotContext.firstHitBallId !== null ? session.getBallById(shotContext.firstHitBallId) : undefined
    let assignedGroup: GroupType | undefined
    let pendingDecision: PendingDecision | undefined
    const distinctRailContacts = [...new Set(shotContext.objectBallRailContactIds)]
    const pocketedObjectBalls = shotContext.pocketedBallIds
      .map((ballId) => session.getBallById(ballId))
      .filter((ball): ball is BallBody => Boolean(ball && ball.type !== 'cue'))

    if (!shotContext.cueBallStartedBehindBreakLine) {
      reasons.push('cue-ball-not-behind-break-line')
    }

    if (!firstHitBall) {
      reasons.push('no-first-hit')
    }

    if (shotContext.cueBallPocketed) {
      reasons.push('cue-ball-pocketed')
    }

    if (shotContext.ballsOffTable.includes(session.tableState.cueBallId)) {
      reasons.push('cue-ball-off-table')
    }

    if (shotContext.ballsOffTable.some((ballId) => ballId !== session.tableState.cueBallId)) {
      reasons.push('object-ball-off-table')
    }

    if (pocketedObjectBalls.length === 0 && distinctRailContacts.length < RuleConfig.openingBreakMinRailContacts) {
      reasons.push('opening-break-insufficient-rails')
    }

    const foul = reasons.length > 0
    const legalScoringPocketedBalls = pocketedObjectBalls.filter((ball) => ball.type === 'solid' || ball.type === 'stripe')
    const assignmentOutcome = !foul && currentGroup === 'unassigned'
      ? this.createGroupAssignmentOutcome(session, shotContext, currentPlayer)
      : { assignedGroup: undefined, pendingDecision: undefined }

    assignedGroup = assignmentOutcome.assignedGroup
    pendingDecision = assignmentOutcome.pendingDecision

    if (foul) {
      pendingDecision = {
        kind: 'break-foul-option',
        actor: opponent,
        options: [...RuleConfig.openingBreakOptions]
      }
      this.logger.info('RuleEngine', 'break-foul-option-created', {
        actor: opponent,
        reasons
      })
    }

    const keepTurn = !foul && (shotContext.blackBallPocketed || legalScoringPocketedBalls.length > 0)
    const result: RoundResult = {
      foul,
      foulReasons: reasons,
      keepTurn,
      nextPlayer: foul ? opponent : keepTurn ? currentPlayer : opponent,
      gameOver: false,
      winner: null,
      assignedGroup,
      pendingDecision,
      cueBallInHand: false
    }

    if (!foul && shotContext.blackBallPocketed) {
      result.keepTurn = true
      result.nextPlayer = currentPlayer
    }

    if (shotContext.blackBallPocketed) {
      result.respottedBallIds = [session.tableState.blackBallId]
      this.logger.info('RuleEngine', 'break-black-respot', {
        currentPlayer,
        foul,
        respottedBallIds: result.respottedBallIds
      })
    }

    this.logger.info('RuleEngine', 'break-validation-result', {
      currentPlayer,
      foul,
      foulReasons: reasons,
      keepTurn: result.keepTurn,
      nextPlayer: result.nextPlayer,
      pendingDecisionKind: result.pendingDecision?.kind ?? null,
      assignedGroup
    })

    return result
  }

  private createGroupAssignmentOutcome(session: GameSession, shotContext: ShotContext, currentPlayer: 1 | 2): {
    assignedGroup?: GroupType
    pendingDecision?: PendingDecision
  } {
    const pocketedScoringBalls = shotContext.pocketedBallIds
      .map((ballId) => session.getBallById(ballId))
      .filter((ball): ball is BallBody => Boolean(ball && (ball.type === 'solid' || ball.type === 'stripe')))

    const pocketedGroups = [...new Set(pocketedScoringBalls.map((ball) => ball.type as GroupType))]

    if (pocketedGroups.length === 1) {
      return { assignedGroup: pocketedGroups[0] }
    }

    if (pocketedGroups.length > 1) {
      const pendingDecision: PendingDecision = {
        kind: 'group-selection',
        actor: currentPlayer,
        options: ['solid', 'stripe']
      }
      this.logger.info('RuleEngine', 'group-choice-created', {
        actor: currentPlayer,
        options: pendingDecision.options
      })
      return { pendingDecision }
    }

    return {}
  }
}
