import { GameConfig } from '../../config/GameConfig'
import { createBall, type BallBody } from '../../physics/body/BallBody'
import { Vector2 } from '../../physics/math/Vector2'

const BALL_RADIUS = 10
const BALL_DIAMETER = BALL_RADIUS * 2
const ROW_OFFSET_X = Math.sqrt(3) * BALL_RADIUS
const CUE_BALL_OFFSET = 32

const rackRows = [
  [1],
  [10, 2],
  [3, 8, 11],
  [12, 4, 13, 5],
  [6, 14, 7, 15, 9]
] as const

const ballTypeByNumber = (ballNumber: number): 'solid' | 'stripe' | 'black' => {
  if (ballNumber === 8) {
    return 'black'
  }

  return ballNumber < 8 ? 'solid' : 'stripe'
}

export function createChineseEightBallRack(): BallBody[] {
  const balls: BallBody[] = [
    createBall({
      id: 0,
      type: 'cue',
      number: 0,
      radius: BALL_RADIUS,
      position: new Vector2(GameConfig.breakLineX - CUE_BALL_OFFSET, GameConfig.tableCenterY)
    })
  ]

  rackRows.forEach((row, rowIndex) => {
    const x = GameConfig.rackSpotX + rowIndex * ROW_OFFSET_X
    const yOffset = ((row.length - 1) * BALL_DIAMETER) / 2

    row.forEach((ballNumber, index) => {
      const y = GameConfig.tableCenterY - yOffset + index * BALL_DIAMETER
      balls.push(
        createBall({
          id: ballNumber,
          type: ballTypeByNumber(ballNumber),
          number: ballNumber,
          radius: BALL_RADIUS,
          position: new Vector2(x, y)
        })
      )
    })
  })

  return balls.sort((left, right) => left.id - right.id)
}
