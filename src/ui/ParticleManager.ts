import Phaser from 'phaser'

export class ParticleManager {
  scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  emitLineClear(y: number, boardX: number, boardWidth: number, cellSize: number): void {
    const cx = boardX + (boardWidth * cellSize) / 2
    const cy = y * cellSize + cellSize / 2

    const particles = this.scene.add.particles(0, 0, 'block-I', {
      x: cx,
      y: cy,
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 20,
      tint: [0xffffff, 0x00f0f0, 0xf0f000, 0xf00000],
      emitting: false,
    })
    particles.explode(20)

    // Clean up after animation
    this.scene.time.delayedCall(700, () => {
      particles.destroy()
    })
  }

  emitHardDrop(x: number, y: number, boardX: number, cellSize: number, color: number): void {
    const cx = boardX + x * cellSize + cellSize / 2
    const cy = (y - 2) * cellSize + cellSize / 2

    const particles = this.scene.add.particles(0, 0, 'block-I', {
      x: cx,
      y: cy,
      speed: { min: 50, max: 150 },
      angle: { min: 80, max: 100 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 400,
      quantity: 8,
      tint: color,
      emitting: false,
    })
    particles.explode(8)

    this.scene.time.delayedCall(500, () => {
      particles.destroy()
    })
  }

  flashScreen(): void {
    const flash = this.scene.add.rectangle(
      0, 0, this.scene.scale.width, this.scene.scale.height, 0xffffff, 0.3
    ).setOrigin(0).setDepth(900)
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    })
  }
}
