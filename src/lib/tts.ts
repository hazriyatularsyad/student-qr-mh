import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSpeechQueue, pickIndonesianVoices, type SpeechOpts, type VoiceInfo } from '@/lib/speech';

let opts: SpeechOpts = { language: 'id-ID', rate: 0.9, pitch: 1.0 };
let voices: VoiceInfo[] = [];

export const getSpeechOpts = () => opts;
export const setSpeechOpts = (o: Partial<Pick<SpeechOpts, 'rate' | 'pitch' | 'voice'>>) => { opts = { ...opts, ...o }; };
export const getVoices = () => voices;

// Picks the best installed Indonesian voice; safe to call more than once.
export async function initVoices(): Promise<VoiceInfo[]> {
  try {
    const raw = await AsyncStorage.getItem('speech-opts');
    if (raw) opts = { ...opts, ...(JSON.parse(raw) as Partial<SpeechOpts>), language: 'id-ID' };
  } catch { /* defaults */ }
  try {
    voices = pickIndonesianVoices((await Speech.getAvailableVoicesAsync()) as VoiceInfo[]);
    if (!opts.voice && voices[0]) opts = { ...opts, voice: voices[0].identifier };
  } catch {
    voices = [];
  }
  return voices;
}

export const speechQueue = createSpeechQueue(
  (text, o, onDone) => Speech.speak(text, { ...o, onDone, onError: onDone, onStopped: onDone }),
  getSpeechOpts,
);
