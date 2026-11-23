import { createScanGate } from '@/lib/scanGate';

test('same token inside the cooldown is ignored, after it is accepted', () => {
  let t = 0;
  const gate = createScanGate(4000, () => t);
  expect(gate.accept('A')).toBe(true);
  t = 3999;
  expect(gate.accept('A')).toBe(false);
  t = 4000;
  expect(gate.accept('A')).toBe(true);
});

test('a different token is accepted immediately', () => {
  let t = 0;
  const gate = createScanGate(4000, () => t);
  gate.accept('A');
  t = 100;
  expect(gate.accept('B')).toBe(true);
});
