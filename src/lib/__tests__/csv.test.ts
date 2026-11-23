import { parseStudentsCsv } from '@/lib/csv';

const H = 'nis,nama_murid,panggilan,kelas,nama_wali,hubungan,no_hp';

test('parses a clean file and keeps NIS leading zeros', () => {
  const r = parseStudentsCsv(`${H}\n00123,Aksa Pratama,Aksa,3-A,Rina,Ibu,081\n`);
  expect(r.errors).toEqual([]);
  expect(r.rows).toEqual([{ nis: '00123', nama_murid: 'Aksa Pratama', panggilan: 'Aksa', kelas: '3-A', nama_wali: 'Rina', hubungan: 'Ibu', no_hp: '081' }]);
});

test('handles a BOM and semicolon delimiter (Excel Indonesia)', () => {
  const r = parseStudentsCsv(`﻿${H.replace(/,/g, ';')}\n001;Budi;;3-B;Dewi;Ibu;082\n`);
  expect(r.errors).toEqual([]);
  expect(r.rows[0].nama_murid).toBe('Budi');
  expect(r.rows[0].panggilan).toBe('');
});

test('keeps commas inside quotes', () => {
  const r = parseStudentsCsv(`${H}\n001,"Budi, S.Pd",,3-B,Dewi,Ibu,082\n`);
  expect(r.rows[0].nama_murid).toBe('Budi, S.Pd');
});

test('ignores blank trailing lines', () => {
  const r = parseStudentsCsv(`${H}\n001,Budi,,3-B,Dewi,Ibu,082\n\n\n`);
  expect(r.rows).toHaveLength(1);
  expect(r.errors).toEqual([]);
});

test('reports a duplicate NIS on the second occurrence', () => {
  const r = parseStudentsCsv(`${H}\n001,A,,1-A,W,Ibu,1\n002,B,,1-A,W,Ibu,2\n001,C,,1-A,W,Ibu,3\n`);
  expect(r.errors).toEqual([{ row: 3, message: expect.stringContaining('001') }]);
});

test('reports a missing required field with its row', () => {
  const r = parseStudentsCsv(`${H}\n001,A,,,W,Ibu,1\n`);
  expect(r.errors).toEqual([{ row: 1, message: expect.stringContaining('kelas') }]);
});

test('wrong header is a row-0 error', () => {
  const r = parseStudentsCsv('a,b,c\n1,2,3\n');
  expect(r.rows).toEqual([]);
  expect(r.errors[0].row).toBe(0);
});
