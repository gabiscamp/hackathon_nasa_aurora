let seed = Date.now();

export function setSeed(s: number): void {
  seed = s;
}

export function seededRandom(): number {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}

export function rollSuccess(rate: number): boolean {
  return seededRandom() * 100 < rate;
}
