import Phaser from 'phaser'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  create(): void {
    this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'bg-checker')
      .setOrigin(0)
      .setAlpha(0.3)

    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2

    // Title
    this.add.text(centerX, centerY - 180, 'TETRIS', {
      fontSize: '72px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // Subtitle
    this.add.text(centerX, centerY - 110, 'Modern Arcade', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#8888aa',
    }).setOrigin(0.5)

    // Buttons
    this.createButton(centerX, centerY - 20, 'Arcade Mode', () => {
      this.scene.start('ArcadeScene')
    })

    this.createButton(centerX, centerY + 50, 'Leaderboard', () => {
      // TODO: implement leaderboard scene or overlay
    })

    this.createButton(centerX, centerY + 120, 'Options', () => {
      this.scene.start('OptionsScene')
    })

    // Controls hint at bottom
    this.add.text(centerX, this.scale.height - 30, 'Press ENTER to start', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#555577',
    }).setOrigin(0.5)

    // Version number
    this.add.text(this.scale.width - 16, this.scale.height - 16, 'v0.0.1', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#333355',
    }).setOrigin(1)

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.scene.start('ArcadeScene')
    })
  }

  private createButton(x: number, y: number, text: string, onClick: () => void): void {
    const btnBg = this.add.rectangle(x, y, 260, 50, 0x222244, 0.9)
      .setStrokeStyle(2, 0x444488)
      .setInteractive({ useHandCursor: true })

    const btnText = this.add.text(x, y, text, {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#ccccdd',
    }).setOrigin(0.5)

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0x333366)
      btnText.setColor('#ffffff')
    })
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0x222244)
      btnText.setColor('#ccccdd')
    })
    btnBg.on('pointerdown', onClick)
  }


}
