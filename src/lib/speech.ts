export type SpeechOpts = { language: 'id-ID'; rate: number; pitch: number; voice?: string };

const UNITS = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];

export function numberToIndonesian(n: number): string {
  if (n < 10) return UNITS[n];
  if (n === 10) return 'sepuluh';
  if (n === 11) return 'sebelas';
  if (n < 20) return `${UNITS[n - 10]} belas`;
  if (n < 100) {
    const rest = n % 10;
    return `${UNITS[Math.floor(n / 10)]} puluh${rest ? ' ' + UNITS[rest] : ''}`;
  }
  return String(n);
}

// Digits are spelled out because some voices read "3" in English.
const spellDigits = (text: string) =>
  text.replace(/\d+/g, (d) => numberToIndonesian(Number(d)));

export function buildAnnouncement(s: { nickname: string | null; full_name: string; class_name: string }): string {
  const name = s.nickname?.trim() || s.full_name;
  const cls = spellDigits(s.class_name.replace(/-/g, ' '));
  return `${name}, kelas ${cls}, sudah dijemput.`;
}

export type VoiceInfo = { identifier: string; name: string; language: string; quality?: string };

// Indonesian voices only, Enhanced/Premium first.
export function pickIndonesianVoices(voices: VoiceInfo[]): VoiceInfo[] {
  const rank = (v: VoiceInfo) => (v.quality && v.quality !== 'Default' ? 0 : 1);
  return voices
    .filter((v) => /^(id|in)([-_]|$)/i.test(v.language))
    .sort((a, b) => rank(a) - rank(b));
}

export function createSpeechQueue(
  speak: (text: string, opts: SpeechOpts, onDone: () => void) => void,
  getOpts: () => SpeechOpts,
) {
  const pending: string[] = [];
  let speaking = false;
  let last: string | null = null;

  const next = () => {
    const text = pending.shift();
    if (text === undefined) {
      speaking = false;
      return;
    }
    speaking = true;
    speak(text, getOpts(), next);
  };

  const enqueue = (text: string) => {
    last = text;
    pending.push(text);
    if (!speaking) next();
  };

  return {
    enqueue,
    repeatLast: () => { if (last !== null) enqueue(last); },
    size: () => pending.length + (speaking ? 1 : 0),
  };
}
