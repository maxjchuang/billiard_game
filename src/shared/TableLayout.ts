export type Vec2 = { x: number; y: number }

export type Rect = { x: number; y: number; width: number; height: number }

export type PocketId =
  | 'topLeft'
  | 'topMiddle'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomMiddle'
  | 'bottomRight'

export type Pocket = {
  id: PocketId
  center: Vec2
  visualRadius: number
  captureRadius: number
}

export type TableLayout = {
  railThickness: number
  feltRect: Rect
  pockets: Pocket[]
}

export type TableLayoutInput = {
  width: number
  height: number
  railThickness: number
  pocketCaptureRadius: number
  pocketVisualRadius?: number
}

export function computeTableLayout(input: TableLayoutInput): TableLayout {
  const { width, height, railThickness, pocketCaptureRadius } = input
  const pocketVisualRadius = input.pocketVisualRadius ?? pocketCaptureRadius

  if (width <= railThickness * 2 || height <= railThickness * 2) {
    throw new Error(
      `Invalid table size: width/height must be > 2*railThickness (width=${width}, height=${height}, railThickness=${railThickness})`
    )
  }

  const feltRect: Rect = {
    x: railThickness,
    y: railThickness,
    width: width - railThickness * 2,
    height: height - railThickness * 2
  }

  const left = feltRect.x
  const right = feltRect.x + feltRect.width
  const top = feltRect.y
  const bottom = feltRect.y + feltRect.height
  const midX = feltRect.x + feltRect.width / 2

  const pockets: Pocket[] = [
    { id: 'topLeft', center: { x: left, y: top }, visualRadius: pocketVisualRadius, captureRadius: pocketCaptureRadius },
    { id: 'topMiddle', center: { x: midX, y: top }, visualRadius: pocketVisualRadius, captureRadius: pocketCaptureRadius },
    { id: 'topRight', center: { x: right, y: top }, visualRadius: pocketVisualRadius, captureRadius: pocketCaptureRadius },
    { id: 'bottomLeft', center: { x: left, y: bottom }, visualRadius: pocketVisualRadius, captureRadius: pocketCaptureRadius },
    {
      id: 'bottomMiddle',
      center: { x: midX, y: bottom },
      visualRadius: pocketVisualRadius,
      captureRadius: pocketCaptureRadius
    },
    { id: 'bottomRight', center: { x: right, y: bottom }, visualRadius: pocketVisualRadius, captureRadius: pocketCaptureRadius }
  ]

  return {
    railThickness,
    feltRect,
    pockets
  }
}
