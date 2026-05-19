import Phaser from 'phaser'
import { COLORS, BOARD_WIDTH, BOARD_TOTAL_ROWS } from '../config/game.config'
import type { TetrominoType } from '../types'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  create(): void {
    this.generateBlockTextures()
    this.generateGridTexture()
    this.generateBackgroundTexture()
    this.scene.start('MenuScene')
  }

  private generateBlockTextures(): void {
    const cellSize = 30
    const types: (TetrominoType | 'garbage')[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L', 'garbage']

    for (const type of types) {
      const color = COLORS[type]
    const graphics = this.make.graphics({ x: 0, y: 0 })

      // Main fill
      graphics.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1)
      graphics.fillRect(0, 0, cellSize, cellSize)

      // Highlight (top-left)
      graphics.fillStyle(0xffffff, 0.3)
      graphics.fillRect(0, 0, cellSize, 3)
      graphics.fillRect(0, 0, 3, cellSize)

      // Shadow (bottom-right)
      graphics.fillStyle(0x000000, 0.4)
      graphics.fillRect(0, cellSize - 3, cellSize, 3)
      graphics.fillRect(cellSize - 3, 0, 3, cellSize)

      // Inner bevel
      graphics.lineStyle(1, 0xffffff, 0.15)
      graphics.strokeRect(3, 3, cellSize - 6, cellSize - 6)

      graphics.generateTexture(`block-${type}`, cellSize, cellSize)
      graphics.destroy()

      // Ghost block
      const ghostGraphics = this.make.graphics({ x: 0, y: 0 })
      ghostGraphics.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.25)
      ghostGraphics.fillRect(0, 0, cellSize, cellSize)
      ghostGraphics.lineStyle(1, Phaser.Display.Color.HexStringToColor(color).color, 0.5)
      ghostGraphics.strokeRect(0, 0, cellSize, cellSize)
      ghostGraphics.generateTexture(`ghost-${type}`, cellSize, cellSize)
      ghostGraphics.destroy()
    }
  }

  private generateGridTexture(): void {
    const w = BOARD_WIDTH * 30
    const h = BOARD_TOTAL_ROWS * 30
    const graphics = this.make.graphics({ x: 0, y: 0 })

    // Background
    graphics.fillStyle(0x1a1a2e, 1)
    graphics.fillRect(0, 0, w, h)

    // Grid lines
    graphics.lineStyle(1, 0x333344, 0.5)
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      graphics.moveTo(x * 30, 0)
      graphics.lineTo(x * 30, h)
    }
    for (let y = 0; y <= BOARD_TOTAL_ROWS; y++) {
      graphics.moveTo(0, y * 30)
      graphics.lineTo(w, y * 30)
    }
    graphics.strokePath()

    // Border
    graphics.lineStyle(2, 0x555577, 1)
    graphics.strokeRect(0, 0, w, h)

    graphics.generateTexture('board-grid', w, h)
    graphics.destroy()
  }

  private generateBackgroundTexture(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 })
    graphics.fillStyle(0x0a0a14, 1)
    graphics.fillRect(0, 0, 32, 32)
    graphics.fillStyle(0x111122, 1)
    graphics.fillRect(0, 0, 16, 16)
    graphics.fillRect(16, 16, 16, 16)
    graphics.generateTexture('bg-checker', 32, 32)
    graphics.destroy()
  }
}
