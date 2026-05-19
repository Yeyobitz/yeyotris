/**
 * Utility helpers.
 */

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
