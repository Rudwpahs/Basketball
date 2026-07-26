export type Point3 = Readonly<{
  x: number
  y: number
  z: number
}>

export type Segment3 = Readonly<{
  start: Point3
  end: Point3
}>

export type RenderPosition = readonly [x: number, y: number, z: number]
