import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import QRCode from 'qrcode';
import { buildCardsHtml, type Card } from '@/lib/cards';

export const qrFileName = (nis: string) => `qr-${nis}.png`;

function saveInBrowser(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Browser: save a PNG. Phone: a one-card PDF through the share sheet (Save to Files / send).
export async function downloadQr(card: Card, platform: string = Platform.OS, save: (url: string, name: string) => void = saveInBrowser) {
  if (platform === 'web') {
    save(await QRCode.toDataURL(card.token, { width: 720, margin: 2 }), qrFileName(card.nis));
    return;
  }
  const { uri } = await Print.printToFileAsync({ html: await buildCardsHtml([card]) });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
}
