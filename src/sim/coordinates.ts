import type { Point3, RenderPosition } from './types'

/**
 * World: x = lateral, y = baseline → midcourt, z = height.
 * Three.js: x = lateral, y = height, z = camera depth.
 */
export function toRenderPosition(point: Point3): RenderPosition {
  return [point.x, point.z, -point.y]
}
