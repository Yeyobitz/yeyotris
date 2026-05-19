/**
 * Pure game logic: 10x20+2 grid, collision detection, line clearing, garbage.
 */

import type { Grid, Cell, Position } from '../types';
import { BOARD_WIDTH, BOARD_TOTAL_ROWS } from '../config/game.config';
import { createEmptyGrid } from '../utils/helpers';
import { Tetromino } from './Tetromino';

export class Board {
  grid: Grid;
  width: number;
  height: number;

  constructor() {
    this.width = BOARD_WIDTH;
    this.height = BOARD_TOTAL_ROWS;
    this.grid = this.createEmptyGrid();
  }

  private createEmptyGrid(): Grid {
    return createEmptyGrid(this.width, this.height) as Grid;
  }

  reset(): void {
    this.grid = this.createEmptyGrid();
  }

  isValidPosition(tetromino: Tetromino, x?: number, y?: number, rotation?: number): boolean {
    const positions = tetromino.getPositions(x, y, rotation as 0 | 1 | 2 | 3);
    for (const pos of positions) {
      if (pos.x < 0 || pos.x >= this.width || pos.y >= this.height) {
        return false;
      }
      if (pos.y >= 0 && this.grid[pos.y][pos.x] !== null) {
        return false;
      }
    }
    return true;
  }

  lockTetromino(tetromino: Tetromino): void {
    const positions = tetromino.getPositions();
    for (const pos of positions) {
      if (pos.y >= 0 && pos.y < this.height && pos.x >= 0 && pos.x < this.width) {
        this.grid[pos.y][pos.x] = tetromino.type;
      }
    }
  }

  clearLines(): number[] {
    const clearedRows: number[] = [];
    for (let y = this.height - 1; y >= 0; y--) {
      const isFull = this.grid[y].every((cell) => cell !== null);
      if (isFull) {
        this.grid.splice(y, 1);
        this.grid.unshift(new Array(this.width).fill(null));
        clearedRows.push(y);
        y++; // re-check same row index
      }
    }
    return clearedRows;
  }

  getGhostPosition(tetromino: Tetromino): Position {
    let ghostY = tetromino.y;
    while (this.isValidPosition(tetromino, tetromino.x, ghostY + 1, tetromino.rotation)) {
      ghostY++;
    }
    return { x: tetromino.x, y: ghostY };
  }

  addGarbage(lines: number): void {
    for (let i = 0; i < lines; i++) {
      const hole = Math.floor(Math.random() * this.width);
      const garbageRow: Cell[] = new Array(this.width).fill('garbage');
      garbageRow[hole] = null;
      this.grid.shift();
      this.grid.push(garbageRow);
    }
  }

  getGridCopy(): Grid {
    return this.grid.map((row) => row.slice());
  }

  isGameOver(): boolean {
    // If any cell in hidden rows is occupied
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] !== null) {
          return true;
        }
      }
    }
    return false;
  }
}
