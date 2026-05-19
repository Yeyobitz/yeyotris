import Phaser from 'phaser'
import type { GameState } from '../core/GameState'
import { BOARD_WIDTH, BOARD_TOTAL_ROWS } from '../config/game.config'

const CELL = 30
const BOARD_W = BOARD_WIDTH * CELL
const BOARD_H = (BOARD_TOTAL_ROWS - 2) * CELL // visible rows only

export class HUD {
  scene: Phaser.Scene
  gameState: GameState

  private scoreText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text
  private linesText!: Phaser.GameObjects.Text
  private comboText!: Phaser.GameObjects.Text
  private btbText!: Phaser.GameObjects.Text
  private timeText!: Phaser.GameObjects.Text

  private nextContainer!: Phaser.GameObjects.Container
  private holdContainer!: Phaser.GameObjects.Container

  private boardX: number
  private boardY: number

  constructor(scene: Phaser.Scene, gameState: GameState) {
    this.scene = scene
    this.gameState = gameState
    this.boardX = (scene.scale.width - BOARD_W) / 2
    this.boardY = (scene.scale.height - BOARD_H) / 2
    this.create()
  }

  private create(): void {
    const bx = this.boardX
    const by = this.boardY

    // Side panels
    const panelW = 140
    const leftX = bx - panelW - 20
    const rightX = bx + BOARD_W + 20

    // Left panel (Hold)
    this.scene.add.rectangle(leftX + panelW / 2, by + 60, panelW, 120, 0x1a1a2e, 0.9)
      .setStrokeStyle(2, 0x444488)
    this.scene.add.text(leftX + panelW / 2, by + 10, 'HOLD', {
      fontSize: '18px', fontFamily: 'monospace', color: '#8888aa', fontStyle: 'bold',
    }).setOrigin(0.5)
    this.holdContainer = this.scene.add.container(leftX + panelW / 2, by + 70)

    // Right panel (Next)
    this.scene.add.rectangle(rightX + panelW / 2, by + 180, panelW, 360, 0x1a1a2e, 0.9)
      .setStrokeStyle(2, 0x444488)
    this.scene.add.text(rightX + panelW / 2, by + 10, 'NEXT', {
      fontSize: '18px', fontFamily: 'monospace', color: '#8888aa', fontStyle: 'bold',
    }).setOrigin(0.5)
    this.nextContainer = this.scene.add.container(rightX + panelW / 2, by + 40)

    // Stats panel top-left
    const statsX = leftX
    const statsY = by + 200
    this.scene.add.rectangle(statsX + panelW / 2, statsY + 110, panelW, 220, 0x1a1a2e, 0.9)
      .setStrokeStyle(2, 0x444488)

    this.scoreText = this.scene.add.text(statsX + 10, statsY + 10, 'Score\n0', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ccccdd',
    }).setLineSpacing(4)

    this.levelText = this.scene.add.text(statsX + 10, statsY + 60, 'Level\n1', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ccccdd',
    }).setLineSpacing(4)

    this.linesText = this.scene.add.text(statsX + 10, statsY + 110, 'Lines\n0', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ccccdd',
    }).setLineSpacing(4)

    this.comboText = this.scene.add.text(statsX + 10, statsY + 160, 'Combo\n-', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ccccdd',
    }).setLineSpacing(4)

    this.btbText = this.scene.add.text(statsX + 10, statsY + 210, 'B2B\n0', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ccccdd',
    }).setLineSpacing(4)

    this.timeText = this.scene.add.text(this.scene.scale.width / 2, by - 24, '0:00', {
      fontSize: '20px', fontFamily: 'monospace', color: '#8888aa',
    }).setOrigin(0.5)
  }

  update(): void {
    const s = this.gameState.stats
    const m = this.gameState.matchStats

    this.scoreText.setText(`Score\n${s.score.toLocaleString()}`)
    this.levelText.setText(`Level\n${s.level}`)
    this.linesText.setText(`Lines\n${s.lines}`)
    this.comboText.setText(`Combo\n${s.combo >= 0 ? s.combo : '-'}`)
    this.btbText.setText(`B2B\n${s.backToBack > 0 ? s.backToBack : 0}`)

    const seconds = Math.floor(m.playTimeMs / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    this.timeText.setText(`${mins}:${secs.toString().padStart(2, '0')}`)

    this.renderNextQueue()
    this.renderHold()
  }

  private renderNextQueue(): void {
    this.nextContainer.removeAll(true)
    const queue = this.gameState.nextQueue.slice(0, 5)
    let yOffset = 0
    for (const type of queue) {
      const mini = this.createMiniPiece(type, 20)
      mini.setPosition(0, yOffset)
      this.nextContainer.add(mini)
      yOffset += 55
    }
  }

  private renderHold(): void {
    this.holdContainer.removeAll(true)
    const held = this.gameState.heldPiece
    if (!held) return
    const mini = this.createMiniPiece(held, 20)
    if (!this.gameState.canHold) {
      mini.setAlpha(0.4)
    }
    this.holdContainer.add(mini)
  }

  private createMiniPiece(type: string, cellSize: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0)
    // Use the standard shape data from Tetromino shapes
    // We'll approximate mini positions based on known SRS shapes
    const shape = this.getMiniShape(type)
    const ox = -shape.width * cellSize / 2
    const oy = -shape.height * cellSize / 2
    for (const pos of shape.positions) {
      const block = this.scene.add.image(ox + pos.x * cellSize + cellSize / 2, oy + pos.y * cellSize + cellSize / 2, `block-${type}`)
      block.setDisplaySize(cellSize, cellSize)
      container.add(block)
    }
    return container
  }

  private getMiniShape(type: string): { width: number; height: number; positions: { x: number; y: number }[] } {
    const shapes: Record<string, { x: number; y: number }[]> = {
      I: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }],
      O: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
      T: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
      S: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
      Z: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
      J: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
      L: [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    }
    const positions = shapes[type] ?? []
    const xs = positions.map((p) => p.x)
    const ys = positions.map((p) => p.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    return {
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      positions: positions.map((p) => ({ x: p.x - minX, y: p.y - minY })),
    }
  }
}
