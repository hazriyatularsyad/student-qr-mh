export function createScanGate(cooldownMs = 4000, now: () => number = Date.now) {
  const seen = new Map<string, number>();
  return {
    accept(token: string): boolean {
      const t = now();
      const at = seen.get(token);
      if (at !== undefined && t - at < cooldownMs) return false;
      seen.set(token, t);
      return true;
    },
  };
}
