import { buildAnnouncementPlaceholder } from '@/lib/smoke';

test('alias @/ resolves to src', () => {
  expect(buildAnnouncementPlaceholder()).toBe('ok');
});
