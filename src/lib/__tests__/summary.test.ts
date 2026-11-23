import { summarize } from '@/lib/summary';
import type { LogRow } from '@/lib/types';

const row = (id: string, status: LogRow['status'], name = 'X'): LogRow => ({
  id, status, scanned_at: '2026-11-23T07:00:00Z', student_nis: '1', student_name: name, class_name: '3-A',
  guardian_name: null, relationship: null, scanner_name: 'P', substitute_name: null, substitute_status: null,
});

test('counts each status and picks the newest verified pickup as last', () => {
  const r = summarize([row('1', 'duplicate'), row('2', 'verified', 'Aksa'), row('3', 'verified', 'Budi'), row('4', 'rejected')]);
  expect(r).toMatchObject({ verified: 2, duplicate: 1, rejected: 1 });
  expect(r.last?.student_name).toBe('Aksa');
});

test('an empty day has zero counts and no last pickup', () => {
  expect(summarize([])).toEqual({ verified: 0, duplicate: 0, rejected: 0, last: null });
});
