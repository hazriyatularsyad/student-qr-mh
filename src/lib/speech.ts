export type SpeechOpts = { language: 'id-ID'; rate: number; pitch: number };

export function buildAnnouncement(s: { nickname: string | null; full_name: string; class_name: string }): string {
  const name = s.nickname?.trim() || s.full_name;
  const cls = s.class_name.replace(/-/g, ' ');
  return `${name} kelas ${cls} sudah dijemput.`;
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
