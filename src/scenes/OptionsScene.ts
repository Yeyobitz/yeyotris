import Phaser from 'phaser'
import type { InputAction, KeyBindings } from '../types'
import { StorageManager, type GameSettings, DEFAULT_SETTINGS } from '../storage/StorageManager'
import { getKeyDisplayName, getPhaserKeyCode } from '../utils/helpers'

const CONTROL_LABELS: Record<InputAction, string> = {
  moveLeft: 'Move Left',
  moveRight: 'Move Right',
  softDrop: 'Soft Drop',
  hardDrop: 'Hard Drop',
  rotateCW: 'Rotate CW',
  rotateCCW: 'Rotate CCW',
  hold: 'Hold Piece',
  pause: 'Pause',
}

export class OptionsScene extends Phaser.Scene {
  private settings!: GameSettings
  private bindingRows: Map<InputAction, Phaser.GameObjects.Text> = new Map()
  private awaitingAction: InputAction | null = null
  private awaitingText: Phaser.GameObjects.Text | null = null
  private overlayContainer: Phaser.GameObjects.Container | null = null
  private settingsTexts: Map<string, Phaser.GameObjects.Text> = new Map()

  constructor() {
    super({ key: 'OptionsScene' })
  }

  create(): void {
    this.settings = StorageManager.getSettings()
    this.bindingRows.clear()
    this.settingsTexts.clear()

    // Background
    this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'bg-checker')
      .setOrigin(0)
      .setAlpha(0.3)

    const cx = this.scale.width / 2
    const cy = this.scale.height / 2

    // Title
    this.add.text(cx, 60, 'OPTIONS', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // Left column: Controls
    this.add.text(cx - 220, 130, 'CONTROLS', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#8888aa',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    const actions: InputAction[] = [
      'moveLeft', 'moveRight', 'softDrop', 'hardDrop',
      'rotateCW', 'rotateCCW', 'hold', 'pause',
    ]

    actions.forEach((action, i) => {
      const y = 175 + i * 44
      this.add.text(cx - 330, y, CONTROL_LABELS[action], {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: '#ccccdd',
      }).setOrigin(0, 0.5)

      const keyName = this.settings.keyBindings[action]
      const keyText = this.add.text(cx - 110, y, getKeyDisplayName(keyName), {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: '#ffffff',
        backgroundColor: '#222244',
        padding: { left: 12, right: 12, top: 4, bottom: 4 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      keyText.on('pointerover', () => keyText.setBackgroundColor('#333366'))
      keyText.on('pointerout', () => keyText.setBackgroundColor('#222244'))
      keyText.on('pointerdown', () => this.startRebinding(action, keyText))

      this.bindingRows.set(action, keyText)
    })

    // Right column: Settings
    this.add.text(cx + 180, 130, 'SETTINGS', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#8888aa',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.createNumberSetting(cx + 180, 175, 'DAS (ms)', 'das', 50, 300, 1)
    this.createNumberSetting(cx + 180, 230, 'ARR (ms)', 'arr', 10, 100, 1)
    this.createNumberSetting(cx + 180, 285, 'Soft Drop Factor', 'softDropFactor', 1, 40, 1)

    this.add.text(cx + 180, 340, 'AUDIO', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#8888aa',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.createNumberSetting(cx + 180, 385, 'Music Volume', 'volumeMusic', 0, 1, 0.1)
    this.createNumberSetting(cx + 180, 440, 'SFX Volume', 'volumeSfx', 0, 1, 0.1)

    // Bottom buttons
    this.createButton(cx - 120, this.scale.height - 70, 'Reset Defaults', () => {
      this.resetDefaults()
    })

    this.createButton(cx + 120, this.scale.height - 70, 'Back to Menu', () => {
      StorageManager.saveSettings(this.settings)
      this.scene.start('MenuScene')
    })

    // Awaiting key overlay
    this.overlayContainer = this.add.container(0, 0)
    const overlayBg = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7)
      .setOrigin(0)
      .setVisible(false)
    this.awaitingText = this.add.text(cx, cy, 'Press any key...', {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setVisible(false)
    this.overlayContainer.add([overlayBg, this.awaitingText])
  }

  private createNumberSetting(
    x: number,
    y: number,
    label: string,
    key: keyof GameSettings,
    min: number,
    max: number,
    step: number
  ): void {
    this.add.text(x - 120, y, label, {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ccccdd',
    }).setOrigin(0, 0.5)

    const formatValue = (v: number): string => {
      if (step < 1) return v.toFixed(1)
      return String(v)
    }

    const valueText = this.add.text(x + 40, y, formatValue(Number(this.settings[key])), {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#222244',
      padding: { left: 12, right: 12, top: 4, bottom: 4 },
    }).setOrigin(0.5)
    this.settingsTexts.set(key, valueText)

    const btnStyle = {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ccccdd',
      backgroundColor: '#222244',
      padding: { left: 10, right: 10, top: 2, bottom: 2 },
    }

    const minusBtn = this.add.text(x + 90, y, '-', btnStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    const plusBtn = this.add.text(x + 130, y, '+', btnStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true })

    minusBtn.on('pointerover', () => minusBtn.setBackgroundColor('#333366'))
    minusBtn.on('pointerout', () => minusBtn.setBackgroundColor('#222244'))
    plusBtn.on('pointerover', () => plusBtn.setBackgroundColor('#333366'))
    plusBtn.on('pointerout', () => plusBtn.setBackgroundColor('#222244'))

    minusBtn.on('pointerdown', () => {
      const newVal = Math.max(min, Number(this.settings[key]) - step)
      this.settings[key] = newVal as never
      valueText.setText(formatValue(newVal))
    })
    plusBtn.on('pointerdown', () => {
      const newVal = Math.min(max, Number(this.settings[key]) + step)
      this.settings[key] = newVal as never
      valueText.setText(formatValue(newVal))
    })
  }

  private startRebinding(action: InputAction, textObj: Phaser.GameObjects.Text): void {
    if (this.awaitingAction) return
    this.awaitingAction = action
    this.overlayContainer?.setVisible(true)
    this.awaitingText?.setVisible(true)

    this.input.keyboard?.once('keydown', (event: KeyboardEvent) => {
      event.preventDefault()
      const code = event.code
      let keyName = code.replace('Key', '').replace('Digit', '').replace('Numpad', 'NUMPAD_')

      // Map common codes to Phaser names
      const codeMap: Record<string, string> = {
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        Space: 'SPACE',
        Escape: 'ESC',
        Enter: 'ENTER',
        Backspace: 'BACKSPACE',
        Tab: 'TAB',
        ShiftLeft: 'SHIFT',
        ShiftRight: 'SHIFT',
        ControlLeft: 'CTRL',
        ControlRight: 'CTRL',
        AltLeft: 'ALT',
        AltRight: 'ALT',
        Delete: 'DELETE',
        Insert: 'INSERT',
        Home: 'HOME',
        End: 'END',
        PageUp: 'PAGE_UP',
        PageDown: 'PAGE_DOWN',
        NumpadAdd: 'PLUS',
        NumpadSubtract: 'MINUS',
        NumpadDecimal: 'PERIOD',
        NumpadDivide: 'FORWARD_SLASH',
        NumpadMultiply: 'ASTERISK',
        Comma: 'COMMA',
        Period: 'PERIOD',
        Slash: 'FORWARD_SLASH',
        Backslash: 'BACK_SLASH',
        Semicolon: 'SEMICOLON',
        Quote: 'QUOTES',
        BracketLeft: 'OPEN_BRACKET',
        BracketRight: 'CLOSED_BRACKET',
        Backquote: 'BACK_TICK',
        Minus: 'MINUS',
        Equal: 'PLUS',
      }

      if (codeMap[code]) {
        keyName = codeMap[code]
      } else if (code.startsWith('Key')) {
        keyName = code.replace('Key', '').toUpperCase()
      } else if (code.startsWith('Digit')) {
        keyName = code.replace('Digit', '')
      } else if (code.startsWith('Numpad')) {
        const num = code.replace('Numpad', '')
        if (/^\d+$/.test(num)) {
          keyName = `NUMPAD_${num}`
        }
      }

      // Validate that Phaser knows this key
      if (getPhaserKeyCode(keyName) === undefined) {
        // Try uppercase
        keyName = keyName.toUpperCase()
        if (getPhaserKeyCode(keyName) === undefined) {
          // Cancel if invalid
          this.awaitingAction = null
          this.overlayContainer?.setVisible(false)
          this.awaitingText?.setVisible(false)
          return
        }
      }

      // Check for duplicates
      const bindings = this.settings.keyBindings as KeyBindings
      for (const [otherAction, otherKey] of Object.entries(bindings)) {
        if (otherAction !== action && otherKey === keyName) {
          // Swap bindings
          (bindings as unknown as Record<string, string>)[otherAction] = bindings[action]
          const otherText = this.bindingRows.get(otherAction as InputAction)
          if (otherText) {
            otherText.setText(getKeyDisplayName(bindings[action]))
          }
          break
        }
      }

      bindings[action] = keyName
      textObj.setText(getKeyDisplayName(keyName))

      this.awaitingAction = null
      this.overlayContainer?.setVisible(false)
      this.awaitingText?.setVisible(false)
    })
  }

  private resetDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS, keyBindings: { ...DEFAULT_SETTINGS.keyBindings } }
    StorageManager.saveSettings(this.settings)

    // Update UI
    for (const [action, textObj] of this.bindingRows) {
      textObj.setText(getKeyDisplayName(this.settings.keyBindings[action]))
    }
    for (const [key, textObj] of this.settingsTexts) {
      textObj.setText(String(this.settings[key as keyof GameSettings]))
    }
  }

  private createButton(x: number, y: number, text: string, onClick: () => void): void {
    const btnBg = this.add.rectangle(x, y, 220, 46, 0x222244, 0.9)
      .setStrokeStyle(2, 0x444488)
      .setInteractive({ useHandCursor: true })

    const btnText = this.add.text(x, y, text, {
      fontSize: '20px',
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
