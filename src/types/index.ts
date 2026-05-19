/**
 * Shared type definitions for the Tetris game.
 * Strict types for game entities, stats, and inputs.
 */

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type RotationState = 0 | 1 | 2 | 3;

export type TSpinType = 'none' | 'mini' | 'full';

export type GameMode = 'arcade' | 'battle';

export type GamePhase = 'menu' | 'playing' | 'paused' | 'gameover';

export interface Position {
  x: number;
  y: number;
}

export type Cell = TetrominoType | null | 'garbage';

export type Grid = Cell[][];

export interface GameStats {
  score: number;
  level: number;
  lines: number;
  combo: number;
  backToBack: number;
}

export interface MatchStats extends GameStats {
  singles: number;
  doubles: number;
  triples: number;
  tetrises: number;
  tSpins: number;
  tSpinMinis: number;
  maxCombo: number;
  piecesPlaced: number;
  playTimeMs: number;
}

export type InputAction =
  | 'moveLeft'
  | 'moveRight'
  | 'softDrop'
  | 'hardDrop'
  | 'rotateCW'
  | 'rotateCCW'
  | 'hold'
  | 'pause';

export interface KeyBindings {
  moveLeft: string;
  moveRight: string;
  softDrop: string;
  hardDrop: string;
  rotateCW: string;
  rotateCCW: string;
  hold: string;
  pause: string;
}

export interface InputConfig {
  das: number; // ms before auto-shift starts
  arr: number; // ms between auto-shift repeats
  softDropFactor: number; // multiplier for soft drop speed
  lockDelay: number; // ms before piece locks
}

export interface MoveResult {
  success: boolean;
  locked?: boolean;
  linesCleared?: number;
  clearedRows?: number[];
  tSpin?: TSpinType;
  garbageSent?: number;
}

export interface WallKickTest {
  dx: number;
  dy: number;
}

export type WallKickTable = WallKickTest[][];

export interface LeaderboardEntry {
  name: string;
  score: number;
  level: number;
  lines: number;
  date: string;
  mode: GameMode;
}
