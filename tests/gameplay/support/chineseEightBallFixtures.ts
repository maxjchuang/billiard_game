import type { ShotContext } from '../../../src/gameplay/session/GameSession'
import { createBall, type BallBody } from '../../../src/physics/body/BallBody'
import { Vector2 } from '../../../src/physics/math/Vector2'

const objectBallSpacing = 24

export function createChineseEightBallBallSet(): BallBody[] {
  const balls: BallBody[] = [
    createBall({ id: 0, type: 'cue', number: 0, position: new Vector2(120, 180) }),
    createBall({ id: 8, type: 'black', number: 8, position: new Vector2(420, 180) })
  ]

  for (let number = 1; number <= 7; number += 1) {
    balls.push(
      createBall({
        id: number,
        type: 'solid',
        number,
        position: new Vector2(300 + (number - 1) * objectBallSpacing, 120)
      })
    )
  }

  for (let number = 9; number <= 15; number += 1) {
    balls.push(
      createBall({
        id: number,
        type: 'stripe',
        number,
        position: new Vector2(300 + (number - 9) * objectBallSpacing, 240)
      })
    )
  }

  return balls.sort((left, right) => left.id - right.id)
}

export function createShotContext(overrides: Partial<ShotContext> = {}): ShotContext {
  return {
    firstHitBallId: 1,
    pocketedBallIds: [],
    cueBallPocketed: false,
    blackBallPocketed: false,
    railHitAfterContact: true,
    foulReasons: [],
    isOpeningBreak: false,
    cueBallStartedBehindBreakLine: true,
    objectBallRailContactIds: [],
    ballsOffTable: [],
    ...overrides
  }
}
