/**
 * Game constants, gravity tables, scoring, wall kicks, and color palette.
 */

import type { TetrominoType, WallKickTable, InputConfig } from '../types';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const BOARD_HIDDEN_ROWS = 2;
export const BOARD_TOTAL_ROWS = BOARD_HEIGHT + BOARD_HIDDEN_ROWS;

export const COLORS: Record<TetrominoType | 'garbage', string> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
  garbage: '#808080',
};

export const GHOST_ALPHA = 0.3;

// Gravity in G (cells per frame). At 60 FPS, 1G = 60 cells/sec.
export const GRAVITY_TABLE: number[] = [
  0.01667, 0.021017, 0.026977, 0.035256, 0.04693, 0.06361, 0.0879, 0.1236,
  0.1775, 0.2598, 0.388, 0.59, 0.92, 1.46, 2.36, 3.91, 6.61, 11.43, 20,
];

export function getGravity(level: number): number {
  const idx = Math.min(level, GRAVITY_TABLE.length - 1);
  return GRAVITY_TABLE[idx];
}

// Scoring (guideline)
export const BASE_SCORES = {
  single: 100,
  double: 300,
  triple: 500,
  tetris: 800,
  tSpinMiniNoLines: 100,
  tSpinMiniSingle: 200,
  tSpinMiniDouble: 400,
  tSpinNoLines: 400,
  tSpinSingle: 800,
  tSpinDouble: 1200,
  tSpinTriple: 1600,
  softDrop: 1,
  hardDrop: 2,
};

export function computeScore(
  linesCleared: number,
  tSpin: 'none' | 'mini' | 'full',
  level: number,
  backToBack: number,
  combo: number
): number {
  let base = 0;
  if (tSpin === 'full') {
    if (linesCleared === 0) base = BASE_SCORES.tSpinNoLines;
    else if (linesCleared === 1) base = BASE_SCORES.tSpinSingle;
    else if (linesCleared === 2) base = BASE_SCORES.tSpinDouble;
    else if (linesCleared === 3) base = BASE_SCORES.tSpinTriple;
  } else if (tSpin === 'mini') {
    if (linesCleared === 0) base = BASE_SCORES.tSpinMiniNoLines;
    else if (linesCleared === 1) base = BASE_SCORES.tSpinMiniSingle;
    else if (linesCleared === 2) base = BASE_SCORES.tSpinMiniDouble;
  } else {
    if (linesCleared === 1) base = BASE_SCORES.single;
    else if (linesCleared === 2) base = BASE_SCORES.double;
    else if (linesCleared === 3) base = BASE_SCORES.triple;
    else if (linesCleared === 4) base = BASE_SCORES.tetris;
  }

  const btbMultiplier = backToBack > 0 ? 1.5 : 1;
  const comboBonus = combo > 0 ? combo * 50 : 0;
  return Math.floor((base * btbMultiplier + comboBonus) * level);
}

// SRS Wall Kick Data
// Tables are indexed by [fromRotation][toRotation]
// 0=spawn, 1=right, 2=reverse, 3=left
export const WALL_KICKS_JLSTZ: WallKickTable = [
  [{ dx: 0, dy: 0 }, { dx: -1, dy: 0 }, { dx: -1, dy: 1 }, { dx: 0, dy: -2 }, { dx: -1, dy: -2 }],
  [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 1, dy: -1 }, { dx: 0, dy: 2 }, { dx: 1, dy: 2 }],
  [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }, { dx: 0, dy: -2 }, { dx: 1, dy: -2 }],
  [{ dx: 0, dy: 0 }, { dx: -1, dy: 0 }, { dx: -1, dy: -1 }, { dx: 0, dy: 2 }, { dx: -1, dy: 2 }],
  [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 1, dy: -1 }, { dx: 0, dy: 2 }, { dx: 1, dy: 2 }],
  [{ dx: 0, dy: 0 }, { dx: -1, dy: 0 }, { dx: -1, dy: 1 }, { dx: 0, dy: -2 }, { dx: -1, dy: -2 }],
  [{ dx: 0, dy: 0 }, { dx: -1, dy: 0 }, { dx: -1, dy: 1 }, { dx: 0, dy: -2 }, { dx: -1, dy: -2 }],
  [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 1, dy: -1 }, { dx: 0, dy: 2 }, { dx: 1, dy: 2 }],
];

export const WALL_KICKS_I: WallKickTable = [
  [{ dx: 0, dy: 0 }, { dx: -2, dy: 0 }, { dx: 1, dy: 0 }, { dx: -2, dy: -1 }, { dx: 1, dy: 2 }],
  [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }, { dx: -1, dy: 0 }, { dx: 2, dy: 1 }, { dx: -1, dy: -2 }],
  [{ dx: 0, dy: 0 }, { dx: -1, dy: 0 }, { dx: 2, dy: 0 }, { dx: -1, dy: 2 }, { dx: 2, dy: -1 }],
  [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: -2, dy: 0 }, { dx: 1, dy: -2 }, { dx: -2, dy: 1 }],
  [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }, { dx: -1, dy: 0 }, { dx: 2, dy: 1 }, { dx: -1, dy: -2 }],
  [{ dx: 0, dy: 0 }, { dx: -2, dy: 0 }, { dx: 1, dy: 0 }, { dx: -2, dy: -1 }, { dx: 1, dy: 2 }],
  [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: -2, dy: 0 }, { dx: 1, dy: -2 }, { dx: -2, dy: 1 }],
  [{ dx: 0, dy: 0 }, { dx: -1, dy: 0 }, { dx: 2, dy: 0 }, { dx: -1, dy: 2 }, { dx: 2, dy: -1 }],
];

export function getWallKickTable(type: TetrominoType): WallKickTable {
  return type === 'I' ? WALL_KICKS_I : WALL_KICKS_JLSTZ;
}

export const DEFAULT_INPUT_CONFIG: InputConfig = {
  das: 167,
  arr: 33,
  softDropFactor: 20,
  lockDelay: 500,
};

export const LEVEL_UP_LINES = 10;

export const GARBAGE_TABLE: number[] = [0, 0, 1, 2, 4];

export function computeGarbage(linesCleared: number, tSpin: 'none' | 'mini' | 'full', backToBack: number): number {
  let garbage = GARBAGE_TABLE[linesCleared] ?? 0;
  if (tSpin !== 'none') {
    garbage = linesCleared === 1 ? 2 : linesCleared === 2 ? 4 : linesCleared === 3 ? 6 : 0;
  }
  if (backToBack > 0 && (linesCleared === 4 || tSpin !== 'none')) {
    garbage += 1;
  }
  return garbage;
}
