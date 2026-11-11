'use client';
/**
 * Build ONE PDF for a meeting: cover → contents → for each agenda item a divider page + its documents.
 *   PDF            → pages copied as they are
 *   PNG/JPG/WEBP/GIF → one page each, fitted
 *   XLSX/XLS/CSV   → table pages (every sheet)
 *   DOCX           → text pages
 *   PPTX/PPT/DOC/other → a page saying so, with the original file attached inside the PDF
 * Every page after the cover gets a footer: organisation · meeting · classification · page X of Y.
 */
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import type { BookCover, MeetingBookData } from './types';

const A4: [number, number] = [595.28, 841.89];
const M = 56; // margin
const INK = rgb(0.12, 0.14, 0.18);
const MUTED = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.86, 0.87, 0.9);
const BRAND = rgb(0.27, 0.37, 0.95);

export interface BuildProgress {
  step: string;
  done: number;
  total: number;
}

/** Standard PDF fonts only cover WinAnsi; replace what they can't draw. */
function clean(s: unknown): string {
  return String(s ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[\t\r]/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '?');
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const out: string[] = [];
  for (const para of clean(text).split('\n')) {
    if (!para.trim()) {
      out.push('');
      continue;
    }
    let line = '';
    for (const word of para.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width) {
        line = next;
        continue;
      }
      if (line) out.push(line);
      // Break very long words.
      let w = word;
      while (font.widthOfTextAtSize(w, size) > width) {
        let i = w.length;
        while (i > 1 && font.widthOfTextAtSize(w.slice(0, i), size) > width) i--;
        out.push(w.slice(0, i));
        w = w.slice(i);
      }
      line = w;
    }
    if (line) out.push(line);
  }
  return out;
}

function fmtDate(iso?: string | null, withTime = true) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

function ext(name: string) {
  return name.split('?')[0].split('.').pop()?.toLowerCase() || '';
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const abs = /^https?:/i.test(url) ? url : new URL(url, window.location.origin).toString();
  const res = await fetch(abs);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

/** Convert any browser-decodable image to PNG bytes (for WEBP/GIF/SVG). */
async function toPng(bytes: Uint8Array, mime: string): Promise<Uint8Array> {
  const blob = new Blob([bytes as BlobPart], { type: mime });
  const bmp = await createImageBitmap(blob);
  const c = document.createElement('canvas');
  c.width = bmp.width;
  c.height = bmp.height;
  c.getContext('2d')!.drawImage(bmp, 0, 0);
  const out = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/png'));
  return new Uint8Array(await out.arrayBuffer());
}

type Fonts = { regular: PDFFont; bold: PDFFont };

/** Simple flowing text writer that adds pages as needed. */
class Writer {
  page!: PDFPage;
  y = 0;
  constructor(
    private doc: PDFDocument,
    private fonts: Fonts,
  ) {
    this.newPage();
  }
  newPage() {
    this.page = this.doc.addPage(A4);
    this.y = A4[1] - M;
  }
  ensure(h: number) {
    if (this.y - h < M + 24) this.newPage();
  }
  text(s: string, opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; gap?: number; indent?: number } = {}) {
    const size = opts.size ?? 10.5;
    const font = opts.bold ? this.fonts.bold : this.fonts.regular;
    const indent = opts.indent ?? 0;
    for (const line of wrap(s, font, size, A4[0] - 2 * M - indent)) {
      this.ensure(size * 1.45);
      this.page.drawText(line, { x: M + indent, y: this.y - size, size, font, color: opts.color ?? INK });
      this.y -= size * 1.45;
    }
    this.y -= opts.gap ?? 0;
  }
  rule(gap = 10) {
    this.ensure(gap * 2);
    this.y -= gap / 2;
    this.page.drawLine({ start: { x: M, y: this.y }, end: { x: A4[0] - M, y: this.y }, thickness: 0.6, color: LINE });
    this.y -= gap / 2;
  }
}

async function coverPage(doc: PDFDocument, f: Fonts, data: MeetingBookData, cover: BookCover) {
  const p = doc.addPage(A4);
  const [W, H] = A4;
  const cls = cover.classification;

  if (cls) {
    for (const y of [H - 30, 22]) {
      const w = f.bold.widthOfTextAtSize(cls, 11);
      p.drawText(cls, { x: (W - w) / 2, y, size: 11, font: f.bold, color: rgb(0.75, 0.1, 0.1) });
    }
  }

  let y = H - 120;
  if (data.org.logo) {
    try {
      const bytes = await fetchBytes(data.org.logo);
      const e = ext(data.org.logo);
      const img =
        e === 'png' ? await doc.embedPng(bytes) : e === 'jpg' || e === 'jpeg' ? await doc.embedJpg(bytes) : await doc.embedPng(await toPng(bytes, `image/${e || 'png'}`));
      const s = Math.min(90 / img.height, 160 / img.width);
      p.drawImage(img, { x: (W - img.width * s) / 2, y: y - img.height * s + 40, width: img.width * s, height: img.height * s });
      y -= img.height * s + 10;
    } catch {
      /* logo is optional */
    }
  }

  const center = (s: string, size: number, font: PDFFont, color = INK) => {
    for (const line of wrap(s, font, size, W - 2 * M - 40)) {
      const w = font.widthOfTextAtSize(line, size);
      p.drawText(line, { x: (W - w) / 2, y, size, font, color });
      y -= size * 1.35;
    }
  };

  center(data.org.name.toUpperCase(), 15, f.bold);
  if (data.org.slogan) center(data.org.slogan, 10, f.regular, MUTED);
  y -= 70;
  p.drawRectangle({ x: M, y: y + 18, width: W - 2 * M, height: 2, color: BRAND });
  y -= 24;
  center(cover.title || data.meeting.name, 24, f.bold);
  y -= 6;
  center(cover.subtitle || `${data.meeting.type || 'Board'} Meeting Book`, 13, f.regular, MUTED);
  y -= 14;
  p.drawRectangle({ x: M, y, width: W - 2 * M, height: 2, color: BRAND });
  y -= 60;

  const rows: [string, string | null | undefined][] = [
    ['Date', fmtDate(data.meeting.start_at)],
    ['Venue', data.meeting.location],
    ['Chair', data.meeting.chair],
    ['Reference', cover.reference],
    ['Agenda items', String(data.sections.length)],
    ['Documents', String(data.sections.reduce((n, s) => n + s.documents.length, 0))],
    ['Prepared by', cover.preparedBy],
    ['Status', data.meeting.status],
  ];
  for (const [k, v] of rows) {
    if (!v) continue;
    p.drawText(clean(k), { x: M + 60, y, size: 11, font: f.regular, color: MUTED });
    const lines = wrap(v, f.bold, 11, W - 2 * M - 220);
    lines.forEach((line, i) => p.drawText(line, { x: M + 200, y: y - i * 15, size: 11, font: f.bold, color: INK }));
    y -= 15 * lines.length + 10;
  }

  if (cover.note) {
    y -= 20;
    center(cover.note, 10, f.regular, MUTED);
  }

  const gen = `Compiled ${fmtDate(new Date().toISOString())}`;
  p.drawText(gen, { x: (W - f.regular.widthOfTextAtSize(gen, 8)) / 2, y: 48, size: 8, font: f.regular, color: MUTED });
}

function placeholder(doc: PDFDocument, f: Fonts, title: string, lines: string[]) {
  const w = new Writer(doc, f);
  w.y -= 160;
  w.text(title, { size: 16, bold: true, gap: 10 });
  for (const l of lines) w.text(l, { color: MUTED, gap: 4 });
}

async function addDocument(doc: PDFDocument, f: Fonts, d: { name: string; file_url: string; file_type: string }): Promise<void> {
  const e = ext(d.name) || ext(d.file_url);
  const bytes = await fetchBytes(d.file_url);

  if (e === 'pdf' || d.file_type === 'pdf') {
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await doc.copyPages(src, src.getPageIndices());
    pages.forEach((pg) => doc.addPage(pg));
    return;
  }

  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(e)) {
    const img = e === 'png' ? await doc.embedPng(bytes) : e === 'jpg' || e === 'jpeg' ? await doc.embedJpg(bytes) : await doc.embedPng(await toPng(bytes, `image/${e}`));
    const landscape = img.width > img.height;
    const size: [number, number] = landscape ? [A4[1], A4[0]] : A4;
    const p = doc.addPage(size);
    const s = Math.min((size[0] - 2 * M) / img.width, (size[1] - 2 * M) / img.height, 1.5);
    p.drawImage(img, { x: (size[0] - img.width * s) / 2, y: (size[1] - img.height * s) / 2, width: img.width * s, height: img.height * s });
    return;
  }

  if (['xlsx', 'xls', 'csv', 'ods'].includes(e)) {
    const XLSX = await import('xlsx');
    const wb = XLSX.read(bytes, { type: 'array', cellDates: true });
    for (const sheetName of wb.SheetNames) {
      const rows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[sheetName], { header: 1, raw: false, defval: '', blankrows: false });
      tablePages(doc, f, `${d.name}${wb.SheetNames.length > 1 ? ` - ${sheetName}` : ''}`, rows);
    }
    return;
  }

  if (e === 'docx') {
    const mammoth = await import('mammoth');
    const { value } = await mammoth.extractRawText({ arrayBuffer: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer });
    const w = new Writer(doc, f);
    w.text(d.name, { size: 13, bold: true, gap: 8 });
    w.rule(12);
    w.text(value || '(This document has no text.)', { size: 10.5 });
    return;
  }

  // PowerPoint, legacy Word, archives…: the original is attached to the final PDF (see buildBookPdf).
  placeholder(doc, f, d.name, [
    e === 'pptx' || e === 'ppt' ? 'This presentation is included as an attachment in this PDF.' : 'This file is included as an attachment in this PDF.',
    'Open the attachments panel of your PDF reader (paper-clip icon) to view it,',
    'or open the meeting book in the system to see it in full.',
  ]);
}

function tablePages(doc: PDFDocument, f: Fonts, title: string, rows: string[][]) {
  const landscape: [number, number] = [A4[1], A4[0]];
  const width = landscape[0] - 2 * M;
  const size = 8;
  const cols = Math.min(12, Math.max(1, ...rows.map((r) => r.length)));
  const colW = width / cols;
  let p = doc.addPage(landscape);
  let y = landscape[1] - M;
  const head = () => {
    p.drawText(clean(title).slice(0, 120), { x: M, y: y - 12, size: 12, font: f.bold, color: INK });
    y -= 26;
  };
  head();
  rows.slice(0, 3000).forEach((row, r) => {
    if (y < M + 20) {
      p = doc.addPage(landscape);
      y = landscape[1] - M;
      head();
    }
    if (r === 0) p.drawRectangle({ x: M, y: y - 12, width, height: 14, color: rgb(0.95, 0.96, 0.97) });
    for (let c = 0; c < cols; c++) {
      let t = clean(row[c] ?? '');
      const font = r === 0 ? f.bold : f.regular;
      while (t && font.widthOfTextAtSize(t, size) > colW - 6) t = t.slice(0, -1);
      p.drawText(t, { x: M + c * colW + 3, y: y - 9, size, font, color: INK });
    }
    y -= 14;
    p.drawLine({ start: { x: M, y: y + 2 }, end: { x: M + width, y: y + 2 }, thickness: 0.3, color: LINE });
  });
  if (rows.length > 3000) p.drawText(`… ${rows.length - 3000} more rows not shown`, { x: M, y: y - 12, size, font: f.regular, color: MUTED });
}

export async function buildBookPdf(data: MeetingBookData, onProgress?: (p: BuildProgress) => void): Promise<Uint8Array> {
  const cover = data.cover;
  const total = data.sections.reduce((n, s) => n + s.documents.length, 0) + 2;
  let done = 0;
  const tick = (step: string) => onProgress?.({ step, done: ++done, total });

  // 1. Build each section as its own document so we know page counts for the contents page.
  const sectionDocs: { doc: PDFDocument; title: string; pages: number }[] = [];
  for (const s of data.sections) {
    const sd = await PDFDocument.create();
    const f = { regular: await sd.embedFont(StandardFonts.Helvetica), bold: await sd.embedFont(StandardFonts.HelveticaBold) };
    const w = new Writer(sd, f);
    w.y -= 120;
    w.text(`AGENDA ITEM ${s.order}`, { size: 11, bold: true, color: BRAND, gap: 6 });
    w.text(s.title, { size: 20, bold: true, gap: 12 });
    w.rule(16);
    if (s.ministry) w.text(`Ministry: ${s.ministry}`, { color: MUTED, gap: 2 });
    if (s.presenter) w.text(`Presenter: ${s.presenter}`, { color: MUTED, gap: 2 });
    if (s.approvalRequired) w.text('Requires Cabinet approval', { color: MUTED, gap: 2 });
    if (s.description) {
      w.y -= 10;
      w.text(s.description, { gap: 8 });
    }
    w.y -= 10;
    w.text(s.documents.length ? 'Documents in this item:' : 'No documents attached to this item.', { bold: true, gap: 4 });
    s.documents.forEach((d, i) => w.text(`${i + 1}. ${d.name}`, { indent: 12 }));

    for (const d of s.documents) {
      onProgress?.({ step: `Adding ${d.name}`, done, total });
      try {
        await addDocument(sd, f, d);
      } catch (e) {
        console.error('Book: could not add', d.name, e);
        placeholder(sd, f, d.name, ['This document could not be included in the PDF.', 'Open it from the meeting book in the system.']);
      }
      tick(d.name);
    }
    sectionDocs.push({ doc: sd, title: s.title, pages: sd.getPageCount() });
  }

  // 2. Final document: cover, contents, sections.
  const out = await PDFDocument.create();
  out.setTitle(clean(cover.title || data.meeting.name));
  out.setSubject(clean(cover.subtitle || 'Meeting book'));
  out.setAuthor(clean(data.org.name));
  out.setCreator('boardms');
  const f = { regular: await out.embedFont(StandardFonts.Helvetica), bold: await out.embedFont(StandardFonts.HelveticaBold) };

  await coverPage(out, f, data, cover);
  tick('Cover');

  const tocLinesPerPage = 34;
  const tocPages = Math.max(1, Math.ceil(sectionDocs.length / tocLinesPerPage));
  let start = 1 + tocPages + 1; // first page number after cover + contents
  const entries = sectionDocs.map((s, i) => {
    const e = { n: i + 1, title: s.title, page: start };
    start += s.pages;
    return e;
  });
  for (let t = 0; t < tocPages; t++) {
    const p = out.addPage(A4);
    let y = A4[1] - M;
    if (t === 0) {
      p.drawText('Contents', { x: M, y: y - 20, size: 20, font: f.bold, color: INK });
      y -= 50;
    }
    for (const e of entries.slice(t * tocLinesPerPage, (t + 1) * tocLinesPerPage)) {
      const label = `${e.n}.  ${clean(e.title)}`;
      const lines = wrap(label, f.regular, 11, A4[0] - 2 * M - 60);
      p.drawText(lines[0], { x: M, y, size: 11, font: f.regular, color: INK });
      const num = String(e.page);
      p.drawText(num, { x: A4[0] - M - f.regular.widthOfTextAtSize(num, 11), y, size: 11, font: f.regular, color: INK });
      y -= 20;
    }
  }
  tick('Contents');

  for (const s of sectionDocs) {
    const pages = await out.copyPages(s.doc, s.doc.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  // Attachments live on the section docs; re-attach them on the final document.
  for (const s of data.sections)
    for (const d of s.documents) {
      const e = ext(d.name) || ext(d.file_url);
      if (['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'xlsx', 'xls', 'csv', 'ods', 'docx'].includes(e)) continue;
      try {
        await out.attach(await fetchBytes(d.file_url), d.name, { description: `Agenda item ${s.order}: ${s.title}` });
      } catch {
        /* already noted on its page */
      }
    }

  // 3. Footer on every page after the cover.
  const n = out.getPageCount();
  const left = clean(`${data.org.name} - ${cover.title || data.meeting.name}`).slice(0, 90);
  out.getPages().forEach((p, i) => {
    if (i === 0) return;
    const { width } = p.getSize();
    p.drawLine({ start: { x: M, y: 34 }, end: { x: width - M, y: 34 }, thickness: 0.4, color: LINE });
    p.drawText(left, { x: M, y: 22, size: 7.5, font: f.regular, color: MUTED });
    const right = `${cover.classification ? `${cover.classification}  -  ` : ''}Page ${i + 1} of ${n}`;
    p.drawText(right, { x: width - M - f.regular.widthOfTextAtSize(right, 7.5), y: 22, size: 7.5, font: f.regular, color: MUTED });
  });

  return out.save();
}

export function downloadPdf(bytes: Uint8Array, fileName: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.replace(/[^\w.\- ]+/g, '_');
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
