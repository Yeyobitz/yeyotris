/**
 * Storage Manager for persisting high scores and settings.
 */

import type { LeaderboardEntry, GameMode } from '../types';

const LEADERBOARD_KEY = 'tetris_leaderboard';
const SETTINGS_KEY = 'tetris_settings';

export interface GameSettings {
  das: number;
  arr: number;
  softDropFactor: number;
  volumeMusic: number;
  volumeSfx: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
  das: 167,
  arr: 33,
  softDropFactor: 20,
  volumeMusic: 0.5,
  volumeSfx: 0.5,
};

export class StorageManager {
  static getLeaderboard(): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(LEADERBOARD_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as LeaderboardEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  static saveLeaderboard(entries: LeaderboardEntry[]): void {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  }

  static addEntry(entry: LeaderboardEntry): void {
    const board = this.getLeaderboard();
    board.push(entry);
    board.sort((a, b) => b.score - a.score);
    this.saveLeaderboard(board.slice(0, 10));
  }

  static getSettings(): GameSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<GameSettings>) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  static saveSettings(settings: GameSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  static clearLeaderboard(mode?: GameMode): void {
    if (!mode) {
      localStorage.removeItem(LEADERBOARD_KEY);
    } else {
      const board = this.getLeaderboard().filter((e) => e.mode !== mode);
      this.saveLeaderboard(board);
    }
  }
}
