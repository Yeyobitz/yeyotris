import Phaser from 'phaser'
import { GameState } from '../core/GameState'
import { InputHandler } from '../core/InputHandler'
import { BOARD_WIDTH, BOARD_TOTAL_ROWS, DEFAULT_INPUT_CONFIG } from '../config/game.config'
import type { InputAction, MoveResult } from '../types'
import { HUD } from '../ui/HUD'
import { MenuOverlay } from '../ui/MenuOverlay'
import { ParticleManager } from '../ui/ParticleManager'
import { StorageManager } from '../storage/StorageManager'

const CELL = 30
const VISIBLE_ROWS = BOARD_TOTAL_ROWS - 2

export class ArcadeScene extends Phaser.Scene {
  private gameState!: GameState
  private inputHandler!: InputHandler
  private hud!: HUD
  private overlay!: MenuOverlay
  private particles!: ParticleManager

  private boardSprites: Phaser.GameObjects.Image[][] = []
  private currentSprites: Phaser.GameObjects.Image[] = []
  private ghostSprites: Phaser.GameObjects.Image[] = []

  private boardX = 0
  private boardY = 0

  constructor() {
    super({ key: 'ArcadeScene' })
  }

  create(): void {
    // Clear stale sprite arrays on scene restart
    this.boardSprites = []
    this.currentSprites = []
    this.ghostSprites = []

    const settings = StorageManager.getSettings()
    const inputConfig = {
      ...DEFAULT_INPUT_CONFIG,
      das: settings.das,
      arr: settings.arr,
      softDropFactor: settings.softDropFactor,
    }

    this.gameState = new GameState()
    this.gameState.reset()
    this.inputHandler = new InputHandler(inputConfig)
    this.particles = new ParticleManager(this)

    this.boardX = (this.scale.width - BOARD_WIDTH * CELL) / 2
    this.boardY = (this.scale.height - VISIBLE_ROWS * CELL) / 2

    // Background
    this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'bg-checker')
      .setOrigin(0)
      .setAlpha(0.2)

    // Board background image
    this.add.image(
      this.boardX + (BOARD_WIDTH * CELL) / 2,
      this.boardY + (VISIBLE_ROWS * CELL) / 2,
      'board-grid'
    ).setOrigin(0.5)

    // Board cell sprites (all rows including hidden)
    for (let y = 0; y < BOARD_TOTAL_ROWS; y++) {
      const row: Phaser.GameObjects.Image[] = []
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const sprite = this.add.image(
          this.boardX + x * CELL + CELL / 2,
          this.boardY + (y - 2) * CELL + CELL / 2,
          'block-I'
        )
          .setVisible(false)
          .setOrigin(0.5)
        row.push(sprite)
      }
      this.boardSprites.push(row)
    }

    // Current piece sprites
    for (let i = 0; i < 4; i++) {
      this.currentSprites.push(
        this.add.image(0, 0, 'block-I').setVisible(false).setOrigin(0.5)
      )
    }

    // Ghost piece sprites
    for (let i = 0; i < 4; i++) {
      this.ghostSprites.push(
        this.add.image(0, 0, 'ghost-I').setVisible(false).setOrigin(0.5)
      )
    }

    this.hud = new HUD(this, this.gameState)
    this.overlay = new MenuOverlay(this, {
      onResume: () => this.resumeGame(),
      onRestart: () => this.restartGame(),
      onMenu: () => this.goToMenu(),
    })

    this.setupKeyboard()
  }

  private setupKeyboard(): void {
    const settings = StorageManager.getSettings()
    const keyMap: Record<string, InputAction> = {}
    for (const [action, keyName] of Object.entries(settings.keyBindings)) {
      keyMap[keyName] = action as InputAction
    }

    for (const [keyName, action] of Object.entries(keyMap)) {
      this.input.keyboard!.on(`keydown-${keyName}`, () => {
        this.inputHandler.setKey(action, true)
      })
      this.input.keyboard!.on(`keyup-${keyName}`, () => {
        this.inputHandler.setKey(action, false)
      })
    }
  }

  update(_time: number, delta: number): void {
    if (this.overlay.isVisible()) return

    if (this.gameState.phase === 'gameover') {
      this.scene.start('GameOverScene', { matchStats: this.gameState.matchStats })
      return
    }

    if (this.gameState.phase !== 'playing') return

    const actions = this.inputHandler.update(delta)
    for (const action of actions) {
      switch (action) {
        case 'moveLeft':
          this.gameState.move(-1)
          break
        case 'moveRight':
          this.gameState.move(1)
          break
        case 'softDrop':
          this.gameState.softDrop()
          break
        case 'hardDrop': {
          const result = this.gameState.hardDrop()
          this.handleLockResult(result)
          break
        }
        case 'rotateCW':
          this.gameState.rotate(true)
          break
        case 'rotateCCW':
          this.gameState.rotate(false)
          break
        case 'hold':
          this.gameState.hold()
          break
        case 'pause':
          this.pauseGame()
          return
      }
    }

    const result = this.gameState.update(delta)
    this.handleLockResult(result)

    this.renderBoard()
    this.renderCurrent()
    this.renderGhost()
    this.hud.update()
  }

  private handleLockResult(result: MoveResult): void {
    if (result.locked && result.clearedRows && result.clearedRows.length > 0) {
      for (const rowY of result.clearedRows) {
        this.particles.emitLineClear(rowY, this.boardX, BOARD_WIDTH, CELL)
      }
      if (result.linesCleared && result.linesCleared >= 4) {
        this.particles.flashScreen()
      }
    }
  }

  private renderBoard(): void {
    for (let y = 2; y < BOARD_TOTAL_ROWS; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = this.gameState.board.grid[y][x]
        const sprite = this.boardSprites[y][x]
        if (cell) {
          sprite.setTexture(`block-${cell}`)
          sprite.setVisible(true)
        } else {
          sprite.setVisible(false)
        }
      }
    }
  }

  private renderCurrent(): void {
    if (!this.gameState.current) {
      this.currentSprites.forEach((s) => s.setVisible(false))
      return
    }
    const positions = this.gameState.current.getPositions()
    for (let i = 0; i < 4; i++) {
      const pos = positions[i]
      if (pos.y >= 2) {
        this.currentSprites[i].setTexture(`block-${this.gameState.current.type}`)
        this.currentSprites[i].setPosition(
          this.boardX + pos.x * CELL + CELL / 2,
          this.boardY + (pos.y - 2) * CELL + CELL / 2
        )
        this.currentSprites[i].setVisible(true)
      } else {
        this.currentSprites[i].setVisible(false)
      }
    }
  }

  private renderGhost(): void {
    if (!this.gameState.current) {
      this.ghostSprites.forEach((s) => s.setVisible(false))
      return
    }
    const ghostPositions = this.gameState.getGhostPositions()
    for (let i = 0; i < 4; i++) {
      const pos = ghostPositions[i]
      if (pos.y >= 2) {
        this.ghostSprites[i].setTexture(`ghost-${this.gameState.current.type}`)
        this.ghostSprites[i].setPosition(
          this.boardX + pos.x * CELL + CELL / 2,
          this.boardY + (pos.y - 2) * CELL + CELL / 2
        )
        this.ghostSprites[i].setVisible(true)
      } else {
        this.ghostSprites[i].setVisible(false)
      }
    }
  }

  private pauseGame(): void {
    this.gameState.phase = 'paused'
    this.overlay.show()
  }

  private resumeGame(): void {
    this.gameState.phase = 'playing'
    this.overlay.hide()
    this.inputHandler.reset()
  }

  private restartGame(): void {
    this.overlay.hide()
    this.gameState.reset()
    this.inputHandler.reset()
    this.renderBoard()
    this.renderCurrent()
    this.renderGhost()
    this.hud.update()
  }

  private goToMenu(): void {
    this.scene.start('MenuScene')
  }
}
