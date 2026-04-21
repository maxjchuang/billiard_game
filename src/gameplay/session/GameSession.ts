import type { Logger } from '../../shared/logger/Logger'
import type { BallBody, BallType } from '../../physics/body/BallBody'
import { GameConfig } from '../../config/GameConfig'
import { Vector2 } from '../../physics/math/Vector2'
import { RuleConfig } from '../../config/RuleConfig'

export type PlayerId = 1 | 2
export type GroupType = 'solid' | 'stripe'
export type AssignedGroup = GroupType | 'unassigned'
export type BreakFoulOption = typeof RuleConfig.openingBreakOptions[number]

export interface BreakFoulPendingDecision {
  kind: 'break-foul-option'
  actor: PlayerId
  options: BreakFoulOption[]
}

export interface GroupSelectionPendingDecision {
  kind: 'group-selection'
  actor: PlayerId
  options: GroupType[]
}

export type PendingDecision = BreakFoulPendingDecision | GroupSelectionPendingDecision
export type PendingDecisionChoice = BreakFoulOption | GroupType

export interface PendingDecisionResolution {
  kind: PendingDecision['kind']
  choice: PendingDecisionChoice
  restartRack: boolean
}

export interface TableState {
  balls: BallBody[]
  cueBallId: number
  blackBallId: number
  shotCount: number
  allStopped: boolean
}

export interface TurnState {
  currentPlayer: PlayerId
  cueBallInHand: boolean
  keepTurn: boolean
  foul: boolean
}

export interface RoundResult {
  foul: boolean
  foulReasons: string[]
  keepTurn: boolean
  nextPlayer: PlayerId
  gameOver: boolean
  winner: PlayerId | null
  assignedGroup?: GroupType
  pendingDecision?: PendingDecision
  respottedBallIds?: number[]
  cueBallInHand?: boolean
}

export interface ShotContext {
  firstHitBallId: number | null
  pocketedBallIds: number[]
  cueBallPocketed: boolean
  blackBallPocketed: boolean
  railHitAfterContact: boolean
  foulReasons: string[]
  isOpeningBreak: boolean
  cueBallStartedBehindBreakLine: boolean
  objectBallRailContactIds: number[]
  ballsOffTable: number[]
}

export class GameSession {
  public readonly tableState: TableState
  public readonly turnState: TurnState
  public readonly playerGroups: Record<PlayerId, AssignedGroup>
  public winner: PlayerId | null = null
  public gameOver = false
  public lastRoundResult: RoundResult | null = null
  public pendingDecision: PendingDecision | null = null

  private constructor(private readonly logger: Logger, balls: BallBody[]) {
    this.tableState = {
      balls,
      cueBallId: 0,
      blackBallId: 8,
      shotCount: 0,
      allStopped: true
    }
    this.turnState = {
      currentPlayer: 1,
      cueBallInHand: false,
      keepTurn: false,
      foul: false
    }
    this.playerGroups = {
      1: 'unassigned',
      2: 'unassigned'
    }
    this.logger.info('GameSession', 'init', {
      ballCount: balls.length,
      currentPlayer: this.turnState.currentPlayer
    })
  }

  static createDemoSession(logger: Logger, balls: BallBody[]): GameSession {
    return new GameSession(logger, balls)
  }

  get currentPlayer(): PlayerId {
    return this.turnState.currentPlayer
  }

  getBallById(id: number): BallBody | undefined {
    return this.tableState.balls.find((ball) => ball.id === id)
  }

  getCurrentAssignedGroup(): AssignedGroup {
    return this.playerGroups[this.turnState.currentPlayer]
  }

  assignCurrentPlayerGroup(group: GroupType): void {
    const currentPlayer = this.turnState.currentPlayer
    const otherPlayer: PlayerId = currentPlayer === 1 ? 2 : 1
    this.playerGroups[currentPlayer] = group
    this.playerGroups[otherPlayer] = group === 'solid' ? 'stripe' : 'solid'
    this.logger.info('GameSession', 'assign-group', {
      currentPlayer,
      group,
      otherPlayer,
      otherGroup: this.playerGroups[otherPlayer]
    })
  }

  markPocketedBallIds(ballIds: number[]): void {
    for (const ballId of ballIds) {
      const ball = this.getBallById(ballId)
      if (!ball) {
        continue
      }
      ball.pocketed = true
      ball.active = false
      ball.velocity = ball.velocity.multiply(0)
    }

    if (ballIds.length > 0) {
      this.logger.info('GameSession', 'mark-pocketed', { ballIds })
    }
  }

  areAllGroupBallsPocketed(group: GroupType): boolean {
    return this.tableState.balls
      .filter((ball) => ball.type === group)
      .every((ball) => ball.pocketed)
  }

  countPocketedByType(type: BallType): number {
    return this.tableState.balls.filter((ball) => ball.type === type && ball.pocketed).length
  }

  respotBall(ballId: number, position: Vector2): void {
    const ball = this.getBallById(ballId)
    if (!ball) {
      return
    }

    ball.position = position
    ball.velocity = Vector2.zero()
    ball.active = true
    ball.pocketed = false

    this.logger.info('GameSession', 'respot-ball', {
      ballId,
      x: position.x,
      y: position.y
    })
  }

  applyRoundResult(result: RoundResult): void {
    if (result.assignedGroup) {
      this.assignCurrentPlayerGroup(result.assignedGroup)
    }

    this.pendingDecision = result.pendingDecision ?? null
    this.turnState.currentPlayer = result.nextPlayer
    this.turnState.keepTurn = result.keepTurn
    this.turnState.foul = result.foul
    this.turnState.cueBallInHand = result.cueBallInHand ?? result.foul
    this.tableState.shotCount += 1
    this.winner = result.winner
    this.gameOver = result.gameOver
    this.lastRoundResult = result

    this.logger.info('GameSession', 'apply-round-result', {
      nextPlayer: result.nextPlayer,
      foul: result.foul,
      keepTurn: result.keepTurn,
      cueBallInHand: this.turnState.cueBallInHand,
      gameOver: result.gameOver,
      winner: result.winner,
      pendingDecisionKind: this.pendingDecision?.kind ?? null
    })
  }

  resolvePendingDecision(choice: PendingDecisionChoice): PendingDecisionResolution | null {
    if (!this.pendingDecision) {
      this.logger.warn('GameSession', 'pending-decision-rejected', { reason: 'missing-decision', choice })
      return null
    }

    const pendingDecision = this.pendingDecision

    if (pendingDecision.kind === 'group-selection') {
      if ((choice !== 'solid' && choice !== 'stripe') || !pendingDecision.options.includes(choice)) {
        this.logger.warn('GameSession', 'pending-decision-rejected', {
          kind: pendingDecision.kind,
          reason: 'invalid-choice',
          choice
        })
        return null
      }

      this.assignCurrentPlayerGroup(choice)
      this.pendingDecision = null
      this.logger.info('GameSession', 'pending-decision-resolved', {
        kind: pendingDecision.kind,
        choice
      })
      return {
        kind: pendingDecision.kind,
        choice,
        restartRack: false
      }
    }

    if (!pendingDecision.options.includes(choice as BreakFoulOption)) {
      this.logger.warn('GameSession', 'pending-decision-rejected', {
        kind: pendingDecision.kind,
        reason: 'invalid-choice',
        choice
      })
      return null
    }

    const option = choice as BreakFoulOption
    this.pendingDecision = null

    const cueBall = this.getBallById(this.tableState.cueBallId)
    if (cueBall && (cueBall.pocketed || !cueBall.active)) {
      this.respotBall(cueBall.id, new Vector2(GameConfig.breakLineX - 32, GameConfig.tableCenterY))
    }

    if (option === 'behind-line-ball-in-hand') {
      this.turnState.currentPlayer = pendingDecision.actor
      this.turnState.keepTurn = false
      this.turnState.foul = false
      this.turnState.cueBallInHand = true
    }

    if (option === 'accept-table') {
      this.turnState.currentPlayer = pendingDecision.actor
      this.turnState.keepTurn = false
      this.turnState.foul = false
      this.turnState.cueBallInHand = false
    }

    this.logger.info('GameSession', 'pending-decision-resolved', {
      kind: pendingDecision.kind,
      choice: option
    })

    return {
      kind: pendingDecision.kind,
      choice: option,
      restartRack: option === 're-rack'
    }
  }
}
