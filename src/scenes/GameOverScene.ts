import Phaser from 'phaser'
import type { MatchStats } from '../types'
import { StorageManager } from '../storage/StorageManager'

export class GameOverScene extends Phaser.Scene {
  private matchStats!: MatchStats

  constructor() {
    super({ key: 'GameOverScene' })
  }

  init(data: { matchStats: MatchStats }): void {
    this.matchStats = data.matchStats
  }

  create(): void {
    this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'bg-checker')
      .setOrigin(0)
      .setAlpha(0.2)

    const cx = this.scale.width / 2
    const cy = this.scale.height / 2

    // Title
    this.add.text(cx, cy - 220, 'GAME OVER', {
      fontSize: '56px',
      fontFamily: 'monospace',
      color: '#ff4444',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // Stats panel
    const panelW = 360
    const panelH = 340
    this.add.rectangle(cx, cy + 20, panelW, panelH, 0x1a1a2e, 0.95)
      .setStrokeStyle(2, 0x444488)

    const stats = this.matchStats
    const lines: string[] = [
      `Score      ${stats.score.toLocaleString()}`,
      `Level      ${stats.level}`,
      `Lines      ${stats.lines}`,
      `Max Combo  ${stats.maxCombo >= 0 ? stats.maxCombo : 0}`,
      `Tetrises   ${stats.tetrises}`,
      `T-Spins    ${stats.tSpins}`,
      `T-Spin Minis  ${stats.tSpinMinis}`,
      `Pieces     ${stats.piecesPlaced}`,
      `Time       ${this.formatTime(stats.playTimeMs)}`,
    ]

    lines.forEach((line, i) => {
      this.add.text(cx - panelW / 2 + 24, cy - 110 + i * 32, line, {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: '#ccccdd',
      })
    })

    // Save score prompt
    const isHighScore = this.checkHighScore(stats.score)
    if (isHighScore) {
      this.add.text(cx, cy + 150, 'New High Score!', {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: '#f0f000',
      }).setOrigin(0.5)
    }

    // Save to leaderboard automatically as Anonymous
    StorageManager.addEntry({
      name: 'Player',
      score: stats.score,
      level: stats.level,
      lines: stats.lines,
      date: new Date().toISOString(),
      mode: 'arcade',
    })

    // Buttons
    this.createButton(cx, cy + 210, 'Try Again', () => {
      this.scene.start('ArcadeScene')
    })
    this.createButton(cx, cy + 270, 'Main Menu', () => {
      this.scene.start('MenuScene')
    })
  }

  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  private checkHighScore(score: number): boolean {
    const board = StorageManager.getLeaderboard()
    if (board.length === 0) return true
    return score > board[board.length - 1].score || board.length < 10
  }

  private createButton(x: number, y: number, text: string, onClick: () => void): void {
    const bg = this.add.rectangle(x, y, 220, 46, 0x222244, 0.9)
      .setStrokeStyle(2, 0x444488)
      .setInteractive({ useHandCursor: true })
    const label = this.add.text(x, y, text, {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ccccdd',
    }).setOrigin(0.5)

    bg.on('pointerover', () => {
      bg.setFillStyle(0x333366)
      label.setColor('#ffffff')
    })
    bg.on('pointerout', () => {
      bg.setFillStyle(0x222244)
      label.setColor('#ccccdd')
    })
    bg.on('pointerdown', onClick)
  }
}
