// =============================================================================
// Grid Snap Utilities
// =============================================================================
// Pure functions — no React imports, no side effects.
// Used by GridCanvas to snap note/section positions on drag end and to resolve
// collisions so items never overlap after being placed.

import type { Note, SectionHeader, Position } from '../types'

// ---------------------------------------------------------------------------
// Grid constants
// ---------------------------------------------------------------------------

export const GRID_SIZE = 40

// Default note dimensions for collision math (pixels)
const DEFAULT_NOTE_WIDTH = 320
const DEFAULT_NOTE_HEIGHT = 240

// Default section header dimensions for collision math (pixels)
const DEFAULT_SECTION_WIDTH = 600
const DEFAULT_SECTION_HEIGHT = 48

// ---------------------------------------------------------------------------
// Snapping
// ---------------------------------------------------------------------------

/** Round a single pixel value to the nearest grid line. */
export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

/** Snap a Position to the nearest grid intersection. */
export function snapPosition(pos: Position): Position {
  return { x: snapToGrid(pos.x), y: snapToGrid(pos.y) }
}

// ---------------------------------------------------------------------------
// Axis-aligned bounding box (AABB) helpers
// ---------------------------------------------------------------------------

export interface GridRect {
  x: number
  y: number
  width: number
  height: number
  /** ID of the source item — used to exclude self from collision checks */
  id: string
}

/** Convert a Note to a GridRect using its persisted (or default) dimensions. */
export function noteToGridRect(note: Note): GridRect {
  return {
    id: note.id,
    x: note.position.x,
    y: note.position.y,
    width: note.width ?? DEFAULT_NOTE_WIDTH,
    height: note.height ?? DEFAULT_NOTE_HEIGHT
  }
}

/** Convert a SectionHeader to a GridRect using fixed dimensions. */
export function sectionToGridRect(section: SectionHeader): GridRect {
  return {
    id: section.id,
    x: section.position.x,
    y: section.position.y,
    width: DEFAULT_SECTION_WIDTH,
    height: DEFAULT_SECTION_HEIGHT
  }
}

// ---------------------------------------------------------------------------
// Collision detection
// ---------------------------------------------------------------------------

/** Returns true when two axis-aligned rects overlap (touching edges do not count). */
export function rectsOverlap(a: GridRect, b: GridRect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

/**
 * Returns true when `candidate` overlaps any rect in `obstacles`.
 * The candidate's own ID is excluded so a note is never blocked by itself.
 */
export function hasCollision(candidate: GridRect, obstacles: GridRect[]): boolean {
  return obstacles.some((obs) => obs.id !== candidate.id && rectsOverlap(candidate, obs))
}

// ---------------------------------------------------------------------------
// Collision resolution — spiral search
// ---------------------------------------------------------------------------

/**
 * Find the nearest grid-aligned position to `preferred` that does not overlap
 * any obstacle in `obstacles`.
 *
 * Algorithm: expand in a square spiral (right → down → left → up → repeat),
 * checking each grid cell until a free position is found.
 * The spiral radius grows until either a free cell is found or maxRadius is hit.
 */
export function resolveCollision(
  preferred: Position,
  rect: GridRect,
  obstacles: GridRect[],
  maxRadius = 20
): Position {
  const snapped = snapPosition(preferred)

  const candidate: GridRect = {
    ...rect,
    x: snapped.x,
    y: snapped.y
  }

  // If the snapped preferred position is free, use it immediately
  if (!hasCollision(candidate, obstacles)) {
    return snapped
  }

  // Spiral outward: step = 1 grid unit
  for (let radius = 1; radius <= maxRadius; radius++) {
    // Generate all positions at manhattan distance === radius (in grid steps)
    const positions = spiralPositionsAtRadius(snapped, radius)

    for (const pos of positions) {
      const test: GridRect = { ...rect, ...pos }
      if (!hasCollision(test, obstacles)) {
        return pos
      }
    }
  }

  // Fallback: return snapped even if it collides (very crowded board)
  return snapped
}

// ---------------------------------------------------------------------------
// Spiral helper
// ---------------------------------------------------------------------------

/**
 * Returns grid positions forming the perimeter of a square centered at `center`
 * with half-side `radius` (in grid steps). Positions are in canvas pixel space.
 */
function spiralPositionsAtRadius(center: Position, radius: number): Position[] {
  const positions: Position[] = []
  const step = GRID_SIZE
  const r = radius * step

  // Top edge: left to right
  for (let dx = -r; dx <= r; dx += step) {
    positions.push({ x: center.x + dx, y: center.y - r })
  }
  // Right edge: top+1 to bottom
  for (let dy = -r + step; dy <= r; dy += step) {
    positions.push({ x: center.x + r, y: center.y + dy })
  }
  // Bottom edge: right-1 to left
  for (let dx = r - step; dx >= -r; dx -= step) {
    positions.push({ x: center.x + dx, y: center.y + r })
  }
  // Left edge: bottom-1 to top+1
  for (let dy = r - step; dy >= -r + step; dy -= step) {
    positions.push({ x: center.x - r, y: center.y + dy })
  }

  return positions
}
