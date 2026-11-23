import QRCode from 'qrcode';

export type Card = { studentName: string; className: string; nis: string; token: string };

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function buildCardsHtml(cards: Card[]): Promise<string> {
  const items = await Promise.all(cards.map(async (c) => {
    const svg = await QRCode.toString(c.token, { type: 'svg', margin: 1, width: 180 });
    return `<div class="card">${svg}<div class="name">${esc(c.studentName)}</div>` +
      `<div class="meta">Kelas ${esc(c.className)} · NIS ${esc(c.nis)}</div></div>`;
  }));
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:sans-serif;margin:16px}
    .grid{display:flex;flex-wrap:wrap;gap:12px}
    .card{width:230px;border:1px solid #999;border-radius:10px;padding:12px;text-align:center;page-break-inside:avoid}
    .name{font-weight:700;font-size:16px;margin-top:6px}.meta{font-size:13px;color:#444}
  </style></head><body><div class="grid">${items.join('')}</div></body></html>`;
}
