import type { LogRow } from '@/lib/types';

export function summarize(rows: LogRow[]) {
  const verified = rows.filter((r) => r.status === 'verified');
  return {
    verified: verified.length,
    duplicate: rows.filter((r) => r.status === 'duplicate').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
    last: verified[0] ?? null, // list_pickup_logs returns newest first
  };
}
