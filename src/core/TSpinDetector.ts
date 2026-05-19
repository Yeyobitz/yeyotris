/**
 * T-Spin detection following SRS guidelines.
 */

import type { TSpinType } from '../types';
import { BOARD_WIDTH, BOARD_TOTAL_ROWS } from '../config/game.config';
import { Board } from './Board';
import { Tetromino } from './Tetromino';

const CORNER_OFFSETS = [
  { x: -1, y: -1 }, // top-left
  { x: 1, y: -1 },  // top-right
  { x: -1, y: 1 },  // bottom-left
  { x: 1, y: 1 },   // bottom-right
];

const FRONT_CORNERS: Record<0 | 1 | 2 | 3, [number, number]> = {
  0: [2, 3], // bottom-left, bottom-right (pointing down)
  1: [0, 2], // top-left, bottom-left (pointing left)
  2: [0, 1], // top-left, top-right (pointing up)
  3: [1, 3], // top-right, bottom-right (pointing right)
};

export class TSpinDetector {
  static detect(board: Board, tetromino: Tetromino, lastMoveWasKick: boolean): TSpinType {
    if (tetromino.type !== 'T') return 'none';

    // The center of the T piece in our 3x3 grid is offset (1,1) from tetromino position.
    const centerX = tetromino.x + 1;
    const centerY = tetromino.y + 1;

    let occupiedCorners = 0;
    const front = FRONT_CORNERS[tetromino.rotation];
    let frontOccupied = 0;

    for (let i = 0; i < 4; i++) {
      const cx = centerX + CORNER_OFFSETS[i].x;
      const cy = centerY + CORNER_OFFSETS[i].y;
      const occupied =
        cx < 0 ||
        cx >= BOARD_WIDTH ||
        cy >= BOARD_TOTAL_ROWS ||
        (cy >= 0 && board.grid[cy][cx] !== null);

      if (occupied) {
        occupiedCorners++;
        if (front.includes(i)) {
          frontOccupied++;
        }
      }
    }

    if (occupiedCorners >= 3) {
      return 'full';
    }

    if (occupiedCorners === 2) {
      if (frontOccupied === 2) {
        return 'full';
      }
      if (lastMoveWasKick) {
        return 'mini';
      }
    }

    return 'none';
  }
}
