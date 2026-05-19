/**
 * Utility helpers.
 */

import Phaser from 'phaser'

export function shuffleArray<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createEmptyGrid(width: number, height: number): (string | null)[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => null));
}

const KEY_DISPLAY_NAMES: Record<string, string> = {
  LEFT: '←',
  RIGHT: '→',
  UP: '↑',
  DOWN: '↓',
  SPACE: 'Space',
  ESC: 'Esc',
  ENTER: 'Enter',
  BACKSPACE: 'Backspace',
  TAB: 'Tab',
  SHIFT: 'Shift',
  CTRL: 'Ctrl',
  ALT: 'Alt',
  DELETE: 'Del',
  INSERT: 'Ins',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PgUp',
  PAGE_DOWN: 'PgDn',
  NUM_LOCK: 'NumLock',
  CAPS_LOCK: 'CapsLock',
  SCROLL_LOCK: 'ScrollLock',
  PAUSE: 'Pause',
  PRINT_SCREEN: 'PrtSc',
  PLUS: '+',
  MINUS: '-',
  COMMA: ',',
  PERIOD: '.',
  FORWARD_SLASH: '/',
  BACK_SLASH: '\\',
  SEMICOLON: ';',
  QUOTES: "'",
  OPEN_BRACKET: '[',
  CLOSED_BRACKET: ']',
  BACK_TICK: '`',
};

export function getKeyDisplayName(keyName: string): string {
  return KEY_DISPLAY_NAMES[keyName] ?? keyName;
}

export function getPhaserKeyCode(keyName: string): number | undefined {
  const keyCodes = Phaser.Input.Keyboard.KeyCodes as Record<string, number>;
  return keyCodes[keyName];
}
