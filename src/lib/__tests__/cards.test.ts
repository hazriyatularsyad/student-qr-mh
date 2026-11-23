import { buildCardsHtml } from '@/lib/cards';

const card = (nis: string, token: string) => ({ studentName: `Murid ${nis}`, className: '3-A', nis, token });

test('one QR svg per card and no other student data leaks in', async () => {
  const html = await buildCardsHtml([card('001', 'a'.repeat(64)), card('002', 'b'.repeat(64))]);
  expect(html.match(/<svg/g)).toHaveLength(2);
  expect(html).toContain('Murid 001');
  expect(html).not.toContain('Murid 003');
});

test('escapes HTML in names', async () => {
  const html = await buildCardsHtml([{ ...card('001', 'a'.repeat(64)), studentName: '<b>x</b>' }]);
  expect(html).not.toContain('<b>x</b>');
  expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
});
