/**
 * Input handling with DAS, ARR, hard drop, hold, and pause.
 */

import type { InputAction, InputConfig } from '../types';
import { DEFAULT_INPUT_CONFIG } from '../config/game.config';

interface KeyState {
  isPressed: boolean;
  wasPressed: boolean;
  dasElapsed: number;
  arrElapsed: number;
}

export class InputHandler {
  config: InputConfig;
  private states: Map<InputAction, KeyState>;
  private repeatableActions: InputAction[] = ['moveLeft', 'moveRight', 'softDrop'];

  constructor(config: InputConfig = DEFAULT_INPUT_CONFIG) {
    this.config = config;
    this.states = new Map();
    const actions: InputAction[] = [
      'moveLeft', 'moveRight', 'softDrop', 'hardDrop',
      'rotateCW', 'rotateCCW', 'hold', 'pause',
    ];
    for (const action of actions) {
      this.states.set(action, {
        isPressed: false,
        wasPressed: false,
        dasElapsed: 0,
        arrElapsed: 0,
      });
    }
  }

  setKey(action: InputAction, pressed: boolean): void {
    const state = this.states.get(action);
    if (!state) return;
    if (!pressed && state.isPressed) {
      state.isPressed = false;
      state.wasPressed = false;
      state.dasElapsed = 0;
      state.arrElapsed = 0;
    } else if (pressed && !state.isPressed) {
      state.isPressed = true;
      state.wasPressed = false;
      state.dasElapsed = 0;
      state.arrElapsed = 0;
    }
  }

  update(dt: number): InputAction[] {
    const actions: InputAction[] = [];
    for (const [action, state] of this.states) {
      if (!state.isPressed) continue;

      if (this.repeatableActions.includes(action)) {
        if (!state.wasPressed) {
          // First press
          actions.push(action);
          state.wasPressed = true;
          state.dasElapsed = 0;
          state.arrElapsed = 0;
        } else {
          // Holding
          state.dasElapsed += dt;
          const das = action === 'softDrop' ? 0 : this.config.das;
          const arr = action === 'softDrop'
            ? 1000 / (this.config.softDropFactor * 60)
            : this.config.arr;

          if (state.dasElapsed >= das) {
            state.arrElapsed += dt;
            while (state.arrElapsed >= arr) {
              actions.push(action);
              state.arrElapsed -= arr;
            }
          }
        }
      } else {
        // Single-shot actions
        if (!state.wasPressed) {
          actions.push(action);
          state.wasPressed = true;
        }
      }
    }
    return actions;
  }

  isPressed(action: InputAction): boolean {
    return this.states.get(action)?.isPressed ?? false;
  }

  reset(): void {
    for (const state of this.states.values()) {
      state.isPressed = false;
      state.wasPressed = false;
      state.dasElapsed = 0;
      state.arrElapsed = 0;
    }
  }
}
