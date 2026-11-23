import { buildAnnouncement, createSpeechQueue, numberToIndonesian, pickIndonesianVoices, type SpeechOpts } from '@/lib/speech';

describe('buildAnnouncement', () => {
  const base = { full_name: 'Aksa Pratama', class_name: '3-A' };
  test('uses nickname and spaces the class', () => {
    expect(buildAnnouncement({ ...base, nickname: 'Aksa' })).toBe('Aksa, kelas tiga A, sudah dijemput.');
  });
  test.each([null, '', '   '])('falls back to full name when nickname is %p', (nickname) => {
    expect(buildAnnouncement({ ...base, nickname })).toBe('Aksa Pratama, kelas tiga A, sudah dijemput.');
  });
  test('keeps non-ASCII names intact', () => {
    expect(buildAnnouncement({ full_name: 'Nūr Aïsyah', nickname: null, class_name: '1-B' }))
      .toBe('Nūr Aïsyah, kelas satu B, sudah dijemput.');
  });
});

describe('createSpeechQueue', () => {
  const opts: SpeechOpts = { language: 'id-ID', rate: 0.95, pitch: 1 };
  const setup = () => {
    const spoken: string[] = [];
    const done: Array<() => void> = [];
    const q = createSpeechQueue((text, _o, onDone) => { spoken.push(text); done.push(onDone); }, () => opts);
    return { q, spoken, finish: () => done.shift()!() };
  };

  test('speaks one at a time in FIFO order', () => {
    const { q, spoken, finish } = setup();
    q.enqueue('a'); q.enqueue('b'); q.enqueue('c');
    expect(spoken).toEqual(['a']);
    finish();
    expect(spoken).toEqual(['a', 'b']);
    finish(); finish();
    expect(spoken).toEqual(['a', 'b', 'c']);
  });

  test('repeatLast replays the latest sentence', () => {
    const { q, spoken, finish } = setup();
    q.enqueue('a'); finish();
    q.repeatLast();
    expect(spoken).toEqual(['a', 'a']);
  });

  test('passes current options to speak', () => {
    const calls: SpeechOpts[] = [];
    const q = createSpeechQueue((_t, o) => { calls.push(o); }, () => ({ language: 'id-ID', rate: 0.8, pitch: 1.2 }));
    q.enqueue('x');
    expect(calls[0]).toEqual({ language: 'id-ID', rate: 0.8, pitch: 1.2 });
  });
});

describe('numberToIndonesian', () => {
  test.each([[1,'satu'],[2,'dua'],[10,'sepuluh'],[11,'sebelas'],[12,'dua belas'],[20,'dua puluh'],[21,'dua puluh satu']])(
    '%i -> %s', (n, w) => expect(numberToIndonesian(n)).toBe(w));
});

test('class numbers become words, including two digits', () => {
  expect(buildAnnouncement({ nickname: 'Dimas', full_name: 'Dimas N', class_name: '12-IPA' }))
    .toBe('Dimas, kelas dua belas IPA, sudah dijemput.');
});

describe('pickIndonesianVoices', () => {
  const v = (identifier: string, language: string, quality = 'Default') => ({ identifier, name: identifier, language, quality });
  test('keeps only Indonesian voices, best quality first', () => {
    const r = pickIndonesianVoices([v('en', 'en-US', 'Enhanced'), v('a', 'id-ID'), v('b', 'id-ID', 'Enhanced'), v('c', 'in_ID')]);
    expect(r.map((x) => x.identifier)).toEqual(['b', 'a', 'c']);
  });
  test('returns an empty list when no Indonesian voice is installed', () => {
    expect(pickIndonesianVoices([v('en', 'en-US')])).toEqual([]);
  });
});
