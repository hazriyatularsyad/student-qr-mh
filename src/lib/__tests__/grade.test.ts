import { countByGrade, gradeOf, GRADES, normalizeClassName } from '@/lib/grade';

test.each([['3-A', 3], ['1-B', 1], [' 6 C', 6], ['12-IPA', 12], ['TK-A', null], ['', null], ['A3', null], ['Kelas, 3-A', 3], ['kelas 5B', 5], ['KELAS 2', 2]])(
  'gradeOf(%p) = %p', (cls, grade) => expect(gradeOf(cls)).toBe(grade));

test('the folders cover grades 1 to 6', () => {
  expect(GRADES).toEqual([1, 2, 3, 4, 5, 6]);
});

test('counts students per grade and ignores classes outside 1-6', () => {
  const rows = [{ class_name: '1-A' }, { class_name: '1-B' }, { class_name: '3-A' }, { class_name: '7-A' }, { class_name: 'TK' }];
  expect(countByGrade(rows)).toEqual({ 1: 2, 2: 0, 3: 1, 4: 0, 5: 0, 6: 0 });
});

test.each([['Kelas, 3-A', '3-A'], ['kelas 5B', '5B'], ['  3-A ', '3-A'], ['3-A', '3-A'], ['TK', 'TK']])(
  'normalizeClassName(%p) = %p', (raw, clean) => expect(normalizeClassName(raw)).toBe(clean));
