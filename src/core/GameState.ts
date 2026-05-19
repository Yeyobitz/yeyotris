/**
 * Pure game logic: arcade scoring, level progression, hold/next queue, match stats.
 */

import type { TetrominoType, GameStats, MatchStats, TSpinType, MoveResult, GamePhase } from '../types';
import {
  getGravity,
  computeScore,
  computeGarbage,
  getWallKickTable,
  DEFAULT_INPUT_CONFIG,
  LEVEL_UP_LINES,
} from '../config/game.config';
import { shuffleArray } from '../utils/helpers';
import { Board } from './Board';
import { Tetromino } from './Tetromino';
import { TSpinDetector } from './TSpinDetector';

export class GameState {
  board: Board;
  current: Tetromino | null = null;
  heldPiece: TetrominoType | null = null;
  canHold = true;
  nextQueue: TetrominoType[] = [];
  bag: TetrominoType[] = [];

  stats: GameStats = {
    score: 0,
    level: 1,
    lines: 0,
    combo: -1,
    backToBack: 0,
  };

  matchStats: MatchStats = {
    score: 0,
    level: 1,
    lines: 0,
    combo: -1,
    backToBack: 0,
    singles: 0,
    doubles: 0,
    triples: 0,
    tetrises: 0,
    tSpins: 0,
    tSpinMinis: 0,
    maxCombo: 0,
    piecesPlaced: 0,
    playTimeMs: 0,
  };

  phase: GamePhase = 'playing';
  isGameOver = false;
  startTime = 0;
  lastMoveWasRotation = false;
  lastMoveWasKick = false;

  private gravityAccumulator = 0;
  private lockDelayRemaining = 0;
  private lockResets = 0;
  private readonly maxLockResets = 15;

  constructor() {
    this.board = new Board();
  }

  reset(): void {
    this.board.reset();
    this.current = null;
    this.heldPiece = null;
    this.canHold = true;
    this.bag = [];
    this.nextQueue = [];
    this.stats = { score: 0, level: 1, lines: 0, combo: -1, backToBack: 0 };
    this.matchStats = {
      score: 0, level: 1, lines: 0, combo: -1, backToBack: 0,
      singles: 0, doubles: 0, triples: 0, tetrises: 0,
      tSpins: 0, tSpinMinis: 0, maxCombo: 0, piecesPlaced: 0, playTimeMs: 0,
    };
    this.phase = 'playing';
    this.isGameOver = false;
    this.startTime = performance.now();
    this.gravityAccumulator = 0;
    this.lockDelayRemaining = 0;
    this.lockResets = 0;
    this.lastMoveWasRotation = false;
    this.lastMoveWasKick = false;
    this.fillNextQueue();
    this.spawnPiece();
  }

  private generateBag(): TetrominoType[] {
    return shuffleArray<TetrominoType>(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
  }

  private fillNextQueue(): void {
    while (this.nextQueue.length < 6) {
      if (this.bag.length === 0) {
        this.bag = this.generateBag();
      }
      const piece = this.bag.pop();
      if (piece) {
        this.nextQueue.push(piece);
      }
    }
  }

  spawnPiece(): void {
    if (this.nextQueue.length === 0) {
      this.fillNextQueue();
    }
    const type = this.nextQueue.shift()!;
    this.fillNextQueue();
    this.current = new Tetromino(type);
    this.canHold = true;
    this.lastMoveWasRotation = false;
    this.lastMoveWasKick = false;
    this.lockDelayRemaining = 0;
    this.lockResets = 0;

    if (!this.board.isValidPosition(this.current)) {
      this.isGameOver = true;
      this.phase = 'gameover';
      this.matchStats.playTimeMs = performance.now() - this.startTime;
    }
  }

  move(dx: number, _dy = 0): MoveResult {
    if (!this.current || this.phase !== 'playing') return { success: false };
    const newX = this.current.x + dx;
    const newY = this.current.y;
    if (this.board.isValidPosition(this.current, newX, newY, this.current.rotation)) {
      this.current.x = newX;
      this.current.y = newY;
      this.lastMoveWasRotation = false;
      this.lastMoveWasKick = false;
      if (dx !== 0) {
        this.resetLockDelay();
      }
      return { success: true };
    }
    return { success: false };
  }

  rotate(clockwise: boolean): MoveResult {
    if (!this.current || this.phase !== 'playing' || this.current.type === 'O') {
      return { success: false };
    }

    const fromRotation = this.current.rotation;
    const toRotation = clockwise
      ? ((fromRotation + 1) % 4) as 0 | 1 | 2 | 3
      : ((fromRotation + 3) % 4) as 0 | 1 | 2 | 3;

    const wallKicks = getWallKickTable(this.current.type);
    const kickIndex = fromRotation * 2 + (clockwise ? 0 : 1);
    const tests = wallKicks[kickIndex];

    for (const test of tests) {
      const newX = this.current.x + test.dx;
      const newY = this.current.y + test.dy;
      if (this.board.isValidPosition(this.current, newX, newY, toRotation)) {
        this.current.x = newX;
        this.current.y = newY;
        this.current.rotation = toRotation;
        this.lastMoveWasRotation = true;
        this.lastMoveWasKick = test.dx !== 0 || test.dy !== 0;
        this.resetLockDelay();
        return { success: true };
      }
    }

    return { success: false };
  }

  softDrop(): MoveResult {
    if (!this.current || this.phase !== 'playing') return { success: false };
    const newY = this.current.y + 1;
    if (this.board.isValidPosition(this.current, this.current.x, newY, this.current.rotation)) {
      this.current.y = newY;
      this.stats.score += this.stats.level;
      this.matchStats.score = this.stats.score;
      this.lastMoveWasRotation = false;
      this.lastMoveWasKick = false;
      return { success: true };
    }
    return { success: false };
  }

  hardDrop(): MoveResult {
    if (!this.current || this.phase !== 'playing') return { success: false };
    let dropDistance = 0;
    while (this.board.isValidPosition(this.current, this.current.x, this.current.y + 1, this.current.rotation)) {
      this.current.y++;
      dropDistance++;
    }
    this.stats.score += dropDistance * 2 * this.stats.level;
    this.matchStats.score = this.stats.score;
    return this.lockPiece();
  }

  hold(): MoveResult {
    if (!this.current || this.phase !== 'playing' || !this.canHold) {
      return { success: false };
    }
    const currentType = this.current.type;
    if (this.heldPiece === null) {
      this.heldPiece = currentType;
      this.spawnPiece();
    } else {
      const nextType = this.heldPiece;
      this.heldPiece = currentType;
      this.current = new Tetromino(nextType);
      if (!this.board.isValidPosition(this.current)) {
        this.isGameOver = true;
        this.phase = 'gameover';
        this.matchStats.playTimeMs = performance.now() - this.startTime;
      }
    }
    this.canHold = false;
    this.lastMoveWasRotation = false;
    this.lastMoveWasKick = false;
    this.lockDelayRemaining = 0;
    this.lockResets = 0;
    return { success: true };
  }

  private resetLockDelay(): void {
    if (this.lockDelayRemaining > 0 && this.lockResets < this.maxLockResets) {
      this.lockDelayRemaining = DEFAULT_INPUT_CONFIG.lockDelay;
      this.lockResets++;
    }
  }

  lockPiece(): MoveResult {
    if (!this.current || this.phase !== 'playing') return { success: false };
    this.board.lockTetromino(this.current);
    this.matchStats.piecesPlaced++;

    const tSpin = TSpinDetector.detect(this.board, this.current, this.lastMoveWasKick);
    const clearedRows = this.board.clearLines();
    const linesCleared = clearedRows.length;

    // Update stats
    this.updateStats(linesCleared, tSpin);

    // Check game over after lines clear
    if (this.board.isGameOver()) {
      this.isGameOver = true;
      this.phase = 'gameover';
      this.matchStats.playTimeMs = performance.now() - this.startTime;
      return { success: true, locked: true, linesCleared, clearedRows, tSpin };
    }

    this.spawnPiece();
    return { success: true, locked: true, linesCleared, tSpin };
  }

  private updateStats(linesCleared: number, tSpin: TSpinType): void {
    const isTetris = linesCleared === 4;
    const isDifficult = isTetris || tSpin !== 'none';

    if (linesCleared > 0) {
      this.stats.combo++;
    } else {
      this.stats.combo = -1;
    }

    if (this.stats.combo > this.matchStats.maxCombo) {
      this.matchStats.maxCombo = this.stats.combo;
    }

    if (isDifficult && this.stats.backToBack >= 0) {
      this.stats.backToBack++;
    } else if (!isDifficult && linesCleared > 0) {
      this.stats.backToBack = 0;
    }

    const btbCount = this.stats.backToBack > 0 ? this.stats.backToBack - 1 : 0;
    const points = computeScore(linesCleared, tSpin, this.stats.level, btbCount, Math.max(0, this.stats.combo));
    this.stats.score += points;
    this.stats.lines += linesCleared;
    this.matchStats.score = this.stats.score;
    this.matchStats.lines = this.stats.lines;

    // Level up
    const newLevel = Math.floor(this.stats.lines / LEVEL_UP_LINES) + 1;
    if (newLevel > this.stats.level) {
      this.stats.level = newLevel;
      this.matchStats.level = newLevel;
    }

    // Match stats counters
    if (linesCleared === 1) this.matchStats.singles++;
    if (linesCleared === 2) this.matchStats.doubles++;
    if (linesCleared === 3) this.matchStats.triples++;
    if (linesCleared === 4) this.matchStats.tetrises++;
    if (tSpin === 'full') this.matchStats.tSpins++;
    if (tSpin === 'mini') this.matchStats.tSpinMinis++;

    // Garbage for battle mode
    const _garbage = computeGarbage(linesCleared, tSpin, btbCount);
    void _garbage;

    // If garbage needs to be applied to self in single-player, we ignore here.
    // Battle mode would read this value.
  }

  update(dt: number): MoveResult {
    if (!this.current || this.phase !== 'playing') return { success: false };

    this.matchStats.playTimeMs = performance.now() - this.startTime;

    // Gravity
    const gravity = getGravity(this.stats.level);
    // gravity is cells per frame at 60fps
    const msPerCell = 1000 / (gravity * 60);
    this.gravityAccumulator += dt;

    while (this.gravityAccumulator >= msPerCell) {
      this.gravityAccumulator -= msPerCell;
      if (this.board.isValidPosition(this.current, this.current.x, this.current.y + 1, this.current.rotation)) {
        this.current.y++;
        this.lastMoveWasRotation = false;
        this.lastMoveWasKick = false;
        this.lockDelayRemaining = 0;
        this.lockResets = 0;
      } else {
        // Start lock delay
        if (this.lockDelayRemaining === 0) {
          this.lockDelayRemaining = DEFAULT_INPUT_CONFIG.lockDelay;
        }
        break;
      }
    }

    // Lock delay handling
    if (this.lockDelayRemaining > 0) {
      this.lockDelayRemaining -= dt;
      if (this.lockDelayRemaining <= 0) {
        return this.lockPiece();
      }
    }

    return { success: true };
  }

  getGhostPositions(): { x: number; y: number }[] {
    if (!this.current) return [];
    const ghost = this.board.getGhostPosition(this.current);
    return this.current.getPositions(ghost.x, ghost.y, this.current.rotation);
  }

  addGarbage(lines: number): void {
    this.board.addGarbage(lines);
  }
}
