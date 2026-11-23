import * as Speech from 'expo-speech';
import { createSpeechQueue, type SpeechOpts } from '@/lib/speech';

let opts: SpeechOpts = { language: 'id-ID', rate: 0.95, pitch: 1.0 };
export const getSpeechOpts = () => opts;
export const setSpeechOpts = (o: Partial<Pick<SpeechOpts, 'rate' | 'pitch'>>) => { opts = { ...opts, ...o }; };

export const speechQueue = createSpeechQueue(
  (text, o, onDone) => Speech.speak(text, { ...o, onDone, onError: onDone, onStopped: onDone }),
  getSpeechOpts,
);
