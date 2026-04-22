export const PhysicsConfig = {
  fixedDt: 1 / 120,
  // 摩擦衰减：Demo 阶段需要保证母球能稳定触发首碰与基础对局闭环
  // 0.985 会导致滑行距离极短，难以碰撞默认摆球
  friction: 0.999,
  // 停球阈值（px/s）：低于阈值视为停止，用于缩短“收尾慢速”阶段等待
  minVelocity: 0.1,
  railRestitution: 0.92,
  ballRestitution: 0.98,
  // Visual/physics shared layout input (single source of truth lives in TableLayout)
  railThickness: 20,
  pocketCaptureRadius: 18,
  // 标定：在 640px 桌面尺度下，满力度应能在合理时间内触发首碰
  maxCueSpeed: 200
}

export type PhysicsConfigShape = typeof PhysicsConfig

export type RuntimePhysicsConfig = Omit<PhysicsConfigShape, 'fixedDt'>

export interface RuntimePhysicsDiagnostics {
  fixedDt: number
}

export type PhysicsParameterKey = keyof RuntimePhysicsConfig

export type PhysicsParameterGroup = 'motion' | 'collision' | 'layout' | 'shot'

export type PhysicsParameterApplyMode = 'immediate' | 'next-shot' | 'layout-refresh'

export interface PhysicsParameterDescriptor {
  key: PhysicsParameterKey
  label: string
  group: PhysicsParameterGroup
  defaultValue: number
  min: number
  max: number
  step: number
  applyMode: PhysicsParameterApplyMode
  description?: string
}

export interface PhysicsParameterDraftState {
  valueText: string
  parsedValue: number | null
  isDirty: boolean
  isValid: boolean
  message: string | null
}

export interface PhysicsParameterView extends PhysicsParameterDescriptor, PhysicsParameterDraftState {
  currentValue: number
}

export interface PhysicsHudSnapshot {
  isOpen: boolean
  parameters: PhysicsParameterView[]
  diagnostics: RuntimePhysicsDiagnostics
  hasModifiedValues: boolean
  modifiedKeys: PhysicsParameterKey[]
  lastAppliedAt: number | null
  lastError: string | null
  lastStatus: string
}

export interface PhysicsConfigApplyEvent {
  parameterKey: PhysicsParameterKey | 'reset-all'
  requestedValue: number | string | null
  appliedValue: number | null
  success: boolean
  reason: string
  applyMode: PhysicsParameterApplyMode | 'reset'
}

export const PhysicsParameterDescriptors: PhysicsParameterDescriptor[] = [
  {
    key: 'friction',
    label: '摩擦衰减',
    group: 'motion',
    defaultValue: PhysicsConfig.friction,
    min: 0.95,
    max: 1,
    step: 0.001,
    applyMode: 'immediate',
    description: '控制球体每个固定步长的速度衰减。'
  },
  {
    key: 'minVelocity',
    label: '停球阈值',
    group: 'motion',
    defaultValue: PhysicsConfig.minVelocity,
    min: 0,
    max: 1,
    step: 0.01,
    applyMode: 'immediate',
    description: '低于该速度时会视为静止。'
  },
  {
    key: 'railRestitution',
    label: '库边反弹',
    group: 'collision',
    defaultValue: PhysicsConfig.railRestitution,
    min: 0.5,
    max: 1.2,
    step: 0.01,
    applyMode: 'immediate',
    description: '控制球与库边碰撞后的速度保留比例。'
  },
  {
    key: 'ballRestitution',
    label: '球体反弹',
    group: 'collision',
    defaultValue: PhysicsConfig.ballRestitution,
    min: 0.5,
    max: 1.2,
    step: 0.01,
    applyMode: 'immediate',
    description: '控制球与球碰撞后的动量损耗。'
  },
  {
    key: 'railThickness',
    label: '库边厚度',
    group: 'layout',
    defaultValue: PhysicsConfig.railThickness,
    min: 12,
    max: 40,
    step: 1,
    applyMode: 'layout-refresh',
    description: '改变共享桌面布局与有效台面区域。'
  },
  {
    key: 'pocketCaptureRadius',
    label: '袋口吸附半径',
    group: 'layout',
    defaultValue: PhysicsConfig.pocketCaptureRadius,
    min: 10,
    max: 30,
    step: 1,
    applyMode: 'layout-refresh',
    description: '改变落袋判定半径。'
  },
  {
    key: 'maxCueSpeed',
    label: '最大出杆速度',
    group: 'shot',
    defaultValue: PhysicsConfig.maxCueSpeed,
    min: 80,
    max: 320,
    step: 5,
    applyMode: 'next-shot',
    description: '影响下一次出杆时的母球初速度。'
  }
]

const descriptorByKey = Object.fromEntries(
  PhysicsParameterDescriptors.map((descriptor) => [descriptor.key, descriptor])
) as Record<PhysicsParameterKey, PhysicsParameterDescriptor>

export function createRuntimePhysicsConfig(): RuntimePhysicsConfig {
  return {
    friction: PhysicsConfig.friction,
    minVelocity: PhysicsConfig.minVelocity,
    railRestitution: PhysicsConfig.railRestitution,
    ballRestitution: PhysicsConfig.ballRestitution,
    railThickness: PhysicsConfig.railThickness,
    pocketCaptureRadius: PhysicsConfig.pocketCaptureRadius,
    maxCueSpeed: PhysicsConfig.maxCueSpeed
  }
}

export function createRuntimePhysicsDiagnostics(): RuntimePhysicsDiagnostics {
  return {
    fixedDt: PhysicsConfig.fixedDt
  }
}

export function getPhysicsParameterDescriptor(key: PhysicsParameterKey): PhysicsParameterDescriptor {
  return descriptorByKey[key]
}

export function getPhysicsParameterDescriptors(): PhysicsParameterDescriptor[] {
  return [...PhysicsParameterDescriptors]
}

export function createPhysicsParameterDraftState(
  key: PhysicsParameterKey,
  runtimeConfig: RuntimePhysicsConfig,
  message: string | null = null
): PhysicsParameterDraftState {
  return {
    valueText: formatPhysicsParameterValue(key, runtimeConfig[key]),
    parsedValue: runtimeConfig[key],
    isDirty: runtimeConfig[key] !== descriptorByKey[key].defaultValue,
    isValid: true,
    message
  }
}

export function isPhysicsConfigAtDefaults(runtimeConfig: RuntimePhysicsConfig): boolean {
  return PhysicsParameterDescriptors.every((descriptor) => runtimeConfig[descriptor.key] === descriptor.defaultValue)
}

export function listModifiedPhysicsParameterKeys(runtimeConfig: RuntimePhysicsConfig): PhysicsParameterKey[] {
  return PhysicsParameterDescriptors
    .filter((descriptor) => runtimeConfig[descriptor.key] !== descriptor.defaultValue)
    .map((descriptor) => descriptor.key)
}

export function hasLayoutRefreshPhysicsChanges(keys: Iterable<PhysicsParameterKey>): boolean {
  for (const key of keys) {
    if (descriptorByKey[key].applyMode === 'layout-refresh') {
      return true
    }
  }
  return false
}

export function formatPhysicsParameterValue(key: PhysicsParameterKey, value: number): string {
  const step = descriptorByKey[key].step
  const decimals = Math.max(0, `${step}`.split('.')[1]?.length ?? 0)
  return value.toFixed(decimals)
}

export function parsePhysicsParameterValue(
  key: PhysicsParameterKey,
  valueText: string
): { parsedValue: number | null; isValid: boolean; message: string | null } {
  const descriptor = descriptorByKey[key]
  const trimmed = valueText.trim()

  if (trimmed.length === 0) {
    return {
      parsedValue: null,
      isValid: false,
      message: `${descriptor.label}未生效：请输入数值`
    }
  }

  const parsedValue = Number(trimmed)
  if (!Number.isFinite(parsedValue)) {
    return {
      parsedValue: null,
      isValid: false,
      message: `${descriptor.label}未生效：请输入合法数字`
    }
  }

  if (parsedValue < descriptor.min || parsedValue > descriptor.max) {
    return {
      parsedValue,
      isValid: false,
      message: `${descriptor.label}未生效：范围应为 ${formatPhysicsParameterValue(key, descriptor.min)} - ${formatPhysicsParameterValue(key, descriptor.max)}`
    }
  }

  return {
    parsedValue,
    isValid: true,
    message: null
  }
}

export function buildPhysicsApplySuccessMessage(key: PhysicsParameterKey, value: number): string {
  const descriptor = descriptorByKey[key]
  const suffix = descriptor.applyMode === 'immediate'
    ? '已在当前模拟生效'
    : descriptor.applyMode === 'next-shot'
      ? '将在下一杆生效'
      : '已刷新布局并生效'

  return `${descriptor.label}=${formatPhysicsParameterValue(key, value)}，${suffix}`
}
