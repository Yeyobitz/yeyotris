import Phaser from 'phaser'

export class MenuOverlay {
  scene: Phaser.Scene
  private container!: Phaser.GameObjects.Container
  private visible = false
  private onResume?: () => void
  private onRestart?: () => void
  private onMenu?: () => void

  constructor(
    scene: Phaser.Scene,
    callbacks: { onResume?: () => void; onRestart?: () => void; onMenu?: () => void }
  ) {
    this.scene = scene
    this.onResume = callbacks.onResume
    this.onRestart = callbacks.onRestart
    this.onMenu = callbacks.onMenu
    this.create()
    this.hide()
  }

  private create(): void {
    this.container = this.scene.add.container(0, 0)
    this.container.setDepth(1000)

    const bg = this.scene.add.rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, 0x000000, 0.75)
      .setOrigin(0)
    this.container.add(bg)

    const panel = this.scene.add.rectangle(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
      320,
      280,
      0x1a1a2e,
      0.98
    ).setStrokeStyle(2, 0x444488)
    this.container.add(panel)

    const title = this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height / 2 - 90, 'PAUSED', {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    this.container.add(title)

    this.createBtn(0, 'Resume', () => this.onResume?.())
    this.createBtn(1, 'Restart', () => this.onRestart?.())
    this.createBtn(2, 'Main Menu', () => this.onMenu?.())
  }

  private createBtn(index: number, label: string, callback: () => void): void {
    const x = this.scene.scale.width / 2
    const y = this.scene.scale.height / 2 - 20 + index * 60
    const bg = this.scene.add.rectangle(x, y, 220, 44, 0x222244, 0.9)
      .setStrokeStyle(2, 0x444488)
      .setInteractive({ useHandCursor: true })
    const text = this.scene.add.text(x, y, label, {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ccccdd',
    }).setOrigin(0.5)

    bg.on('pointerover', () => {
      bg.setFillStyle(0x333366)
      text.setColor('#ffffff')
    })
    bg.on('pointerout', () => {
      bg.setFillStyle(0x222244)
      text.setColor('#ccccdd')
    })
    bg.on('pointerdown', callback)

    this.container.add([bg, text])
  }

  show(): void {
    if (this.visible) return
    this.visible = true
    this.container.setVisible(true)
    this.container.setActive(true)
  }

  hide(): void {
    if (!this.visible) return
    this.visible = false
    this.container.setVisible(false)
    this.container.setActive(false)
  }

  toggle(): void {
    if (this.visible) this.hide()
    else this.show()
  }

  isVisible(): boolean {
    return this.visible
  }
}
