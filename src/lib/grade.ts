export const GRADES = [1, 2, 3, 4, 5, 6] as const;
export type Grade = (typeof GRADES)[number];

// Drops a typed "Kelas" prefix: "Kelas, 3-A" -> "3-A". Class names are stored without it.
export function normalizeClassName(raw: string): string {
  return raw.replace(/^\s*kelas\W*/i, '').trim();
}

// "3-A" -> 3, "Kelas, 3-A" -> 3, "12-IPA" -> 12, "TK" -> null. The grade is the leading number.
export function gradeOf(className: string): number | null {
  const m = /^\s*(\d+)/.exec(normalizeClassName(className));
  return m ? Number(m[1]) : null;
}

export function countByGrade(rows: { class_name: string }[]): Record<Grade, number> {
  const out = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } as Record<Grade, number>;
  for (const r of rows) {
    const g = gradeOf(r.class_name);
    if (g !== null && g >= 1 && g <= 6) out[g as Grade] += 1;
  }
  return out;
}
