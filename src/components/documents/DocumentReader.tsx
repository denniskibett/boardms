'use client';

/**
 * DocumentReader — one reader for every board-paper format.
 *
 *  - PDF          → pdf.js (all pages, lazy rendered, zoom, page jump, text search)
 *  - DOCX         → docx-preview (keeps page layout); mammoth as fallback
 *  - PPTX         → pptx-preview (slides drawn in the browser); Microsoft viewer as an alternative
 *  - XLSX/XLS/CSV → SheetJS (sheet tabs, React table — no raw HTML injection)
 *  - PPT/DOC      → Microsoft Office web viewer (legacy binary formats; needs a public https URL)
 *  - Images       → zoomable <img>
 *  - TXT/MD/JSON  → plain text
 *  - Anything else → download card
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  Search,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export type DocumentKind =
  | 'pdf'
  | 'docx'
  | 'pptx'
  | 'office'
  | 'sheet'
  | 'csv'
  | 'image'
  | 'text'
  | 'unknown';

export interface DocumentReaderProps {
  /** Remote URL of the file (public or signed). */
  url?: string;
  /** Local file (e.g. just picked for upload) — takes precedence over url. */
  file?: File;
  /** Display name; its extension is used for type detection. */
  name: string;
  /** Optional MIME type or extension hint (e.g. "application/pdf", "pptx"). */
  type?: string;
  /** Max height of the reading area; defaults to 80vh. */
  height?: string;
  /** Hide the toolbar (download / open) — e.g. when embedded in a print view. */
  hideToolbar?: boolean;
  className?: string;
}

const EXT_KIND: Record<string, DocumentKind> = {
  pdf: 'pdf',
  docx: 'docx',
  doc: 'office',
  ppt: 'office',
  pptx: 'pptx',
  xlsx: 'sheet',
  xls: 'sheet',
  ods: 'sheet',
  csv: 'csv',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  txt: 'text',
  md: 'text',
  json: 'text',
};

const MIME_KIND: [RegExp, DocumentKind][] = [
  [/pdf/, 'pdf'],
  [/wordprocessingml/, 'docx'],
  [/presentationml/, 'pptx'],
  [/msword|powerpoint/, 'office'],
  [/spreadsheetml|ms-excel|opendocument\.spreadsheet/, 'sheet'],
  [/csv/, 'csv'],
  [/^image\//, 'image'],
  [/^text\/|json/, 'text'],
];

export function detectDocumentKind(name: string, type?: string): DocumentKind {
  const hint = (type || '').toLowerCase().trim();
  if (hint && EXT_KIND[hint.replace(/^\./, '')]) return EXT_KIND[hint.replace(/^\./, '')];
  const ext = name.split('?')[0].split('.').pop()?.toLowerCase() || '';
  if (EXT_KIND[ext]) return EXT_KIND[ext];
  for (const [re, kind] of MIME_KIND) if (re.test(hint)) return kind;
  if (hint === 'image') return 'image';
  if (hint === 'powerpoint') return 'pptx';
  if (hint === 'word') return 'docx';
  if (hint === 'excel') return 'sheet';
  return 'unknown';
}

/** "/uploads/x.pdf" → "https://host/uploads/x.pdf" so viewers and downloads work everywhere. */
export function absoluteUrl(url?: string): string | undefined {
  if (!url) return url;
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  if (typeof window === 'undefined') return url;
  return new URL(url, window.location.origin).toString();
}

function isPubliclyReachable(url?: string) {
  return !!url && /^https:\/\//.test(url) && !/localhost|127\.0\.0\.1|\.local\b/.test(url);
}

async function loadBytes(file: File | undefined, url: string | undefined): Promise<ArrayBuffer> {
  if (file) return file.arrayBuffer();
  if (!url) throw new Error('No file or URL provided');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load file (HTTP ${res.status})`);
  return res.arrayBuffer();
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

export default function DocumentReader({
  url: rawUrl,
  file,
  name,
  type,
  height = '80vh',
  hideToolbar = false,
  className = '',
}: DocumentReaderProps) {
  const url = useMemo(() => absoluteUrl(rawUrl), [rawUrl]);
  // The file name's extension is the most reliable hint; the stored type is a fallback.
  const kind = useMemo(() => {
    const byName = detectDocumentKind(name);
    return byName !== 'unknown' ? byName : detectDocumentKind(name, type || file?.type);
  }, [name, type, file]);

  // A blob URL for local files so <img>, download links etc. work the same way.
  const [blobUrl, setBlobUrl] = useState<string>();
  useEffect(() => {
    if (!file) return setBlobUrl(undefined);
    const u = URL.createObjectURL(file);
    setBlobUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  const src = blobUrl || url;

  let body: React.ReactNode;
  switch (kind) {
    case 'pdf':
      body = <PdfView file={file} url={url} height={height} />;
      break;
    case 'docx':
      body = <DocxView file={file} url={url} height={height} />;
      break;
    case 'sheet':
    case 'csv':
      body = <SheetView file={file} url={url} height={height} />;
      break;
    case 'pptx':
      body = <PptxView file={file} url={url} name={name} height={height} />;
      break;
    case 'office':
      body = <OfficeView url={file ? undefined : url} name={name} height={height} />;
      break;
    case 'image':
      body = <ImageView src={src} name={name} height={height} />;
      break;
    case 'text':
      body = <TextView file={file} url={url} height={height} />;
      break;
    default:
      body = <Unsupported name={name} src={src} />;
  }

  return (
    <div className={`flex flex-col rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      {!hideToolbar && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-2 dark:border-gray-800">
          <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200" title={name}>
            {name}
          </p>
          {src && (
            <div className="flex shrink-0 items-center gap-1">
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800"
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={src}
                download={name}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      )}
      {body}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared states                                                       */
/* ------------------------------------------------------------------ */

function Loading({ label = 'Loading document…' }: { label?: string }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-6 text-gray-500">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-6 text-center">
      <AlertTriangle className="h-8 w-8 text-amber-500" />
      <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
    </div>
  );
}

function Unsupported({ name, src }: { name: string; src?: string }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium">{name}</span> can&apos;t be previewed in the browser.
      </p>
      {src && (
        <a
          href={src}
          download={name}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          <Download className="h-4 w-4" /> Download
        </a>
      )}
    </div>
  );
}

/** Fetches/reads the file once and hands the bytes to a parser. */
function useParsed<T>(
  file: File | undefined,
  url: string | undefined,
  parse: (buf: ArrayBuffer) => Promise<T>,
) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  const parseRef = useRef(parse);
  parseRef.current = parse;

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true });
    loadBytes(file, url)
      .then((buf) => parseRef.current(buf))
      .then((data) => !cancelled && setState({ data, loading: false }))
      .catch((e: unknown) => {
        if (cancelled) return;
        console.error('DocumentReader:', e);
        setState({ error: e instanceof Error ? e.message : 'Failed to load document', loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [file, url]);

  return state;
}

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;
function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjs) => {
      // Worker version must match the installed pdfjs-dist exactly — bundle it locally.
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

function PdfView({ file, url, height }: { file?: File; url?: string; height: string }) {
  const [pdf, setPdf] = useState<PDFDocumentProxy>();
  const [error, setError] = useState<string>();
  const [zoomIdx, setZoomIdx] = useState(2);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<number[] | null>(null);
  const [hitIdx, setHitIdx] = useState(0);
  const [searching, setSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textCache = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    let cancelled = false;
    let doc: PDFDocumentProxy | undefined;
    setPdf(undefined);
    setError(undefined);
    textCache.current.clear();
    (async () => {
      try {
        const pdfjs = await getPdfjs();
        const data = file ? new Uint8Array(await file.arrayBuffer()) : undefined;
        doc = await pdfjs.getDocument(data ? { data } : { url: url! }).promise;
        if (cancelled) return doc.destroy();
        setPdf(doc);
        setPage(1);
      } catch (e) {
        console.error('PDF load failed:', e);
        if (!cancelled) setError('This PDF could not be opened. It may be missing or damaged.');
      }
    })();
    return () => {
      cancelled = true;
      doc?.destroy();
    };
  }, [file, url]);

  const scrollToPage = useCallback((n: number) => {
    pageRefs.current[n - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Track the page in view.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !pdf) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setPage(Number((visible.target as HTMLElement).dataset.page));
      },
      { root, threshold: [0.25, 0.5, 0.75] },
    );
    pageRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [pdf, zoomIdx]);

  const runSearch = async () => {
    if (!pdf || !query.trim()) return setHits(null);
    setSearching(true);
    const q = query.trim().toLowerCase();
    const found: number[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      let text = textCache.current.get(i);
      if (text === undefined) {
        const content = await (await pdf.getPage(i)).getTextContent();
        text = content.items.map((it) => ('str' in it ? it.str : '')).join(' ').toLowerCase();
        textCache.current.set(i, text);
      }
      if (text.includes(q)) found.push(i);
    }
    setSearching(false);
    setHits(found);
    setHitIdx(0);
    if (found.length) scrollToPage(found[0]);
  };

  const stepHit = (dir: 1 | -1) => {
    if (!hits?.length) return;
    const next = (hitIdx + dir + hits.length) % hits.length;
    setHitIdx(next);
    scrollToPage(hits[next]);
  };

  if (error) return <ErrorState message={error} />;
  if (!pdf) return <Loading label="Loading PDF…" />;

  const scale = ZOOM_STEPS[zoomIdx];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950">
        <button
          onClick={() => scrollToPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded p-1 hover:bg-gray-200 disabled:opacity-40 dark:hover:bg-gray-800"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <input
          type="number"
          min={1}
          max={pdf.numPages}
          value={page}
          onChange={(e) => {
            const n = Math.min(pdf.numPages, Math.max(1, Number(e.target.value) || 1));
            setPage(n);
            scrollToPage(n);
          }}
          className="w-14 rounded border border-gray-300 px-1 py-0.5 text-center dark:border-gray-700 dark:bg-gray-900"
          aria-label="Page number"
        />
        <span className="text-gray-500">/ {pdf.numPages}</span>
        <button
          onClick={() => scrollToPage(Math.min(pdf.numPages, page + 1))}
          disabled={page >= pdf.numPages}
          className="rounded p-1 hover:bg-gray-200 disabled:opacity-40 dark:hover:bg-gray-800"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-gray-300 dark:bg-gray-700" />
        <button
          onClick={() => setZoomIdx((z) => Math.max(0, z - 1))}
          disabled={zoomIdx === 0}
          className="rounded p-1 hover:bg-gray-200 disabled:opacity-40 dark:hover:bg-gray-800"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="w-12 text-center text-gray-600 dark:text-gray-400">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => setZoomIdx((z) => Math.min(ZOOM_STEPS.length - 1, z + 1))}
          disabled={zoomIdx === ZOOM_STEPS.length - 1}
          className="rounded p-1 hover:bg-gray-200 disabled:opacity-40 dark:hover:bg-gray-800"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        <form
          className="ml-auto flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            runSearch();
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHits(null);
              }}
              placeholder="Search in document"
              className="w-44 rounded border border-gray-300 py-0.5 pl-7 pr-2 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          {searching && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          {hits && !searching && (
            <>
              <span className="text-xs text-gray-500">
                {hits.length ? `p.${hits[hitIdx]} · ${hitIdx + 1}/${hits.length}` : 'No matches'}
              </span>
              {hits.length > 1 && (
                <>
                  <button type="button" onClick={() => stepHit(-1)} className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-800" aria-label="Previous match">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => stepHit(1)} className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-800" aria-label="Next match">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </>
          )}
        </form>
      </div>

      <div ref={scrollRef} className="overflow-auto bg-gray-100 p-4 dark:bg-gray-950" style={{ height }}>
        <div className="flex flex-col items-center gap-4">
          {Array.from({ length: pdf.numPages }, (_, i) => (
            <div
              key={i}
              data-page={i + 1}
              ref={(el) => {
                pageRefs.current[i] = el;
              }}
              className={hits?.includes(i + 1) ? 'ring-2 ring-amber-400' : ''}
            >
              <PdfPage pdf={pdf} pageNumber={i + 1} scale={scale} root={scrollRef} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/** Renders one page to a canvas when it scrolls near the viewport. */
function PdfPage({
  pdf,
  pageNumber,
  scale,
  root,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  root: React.RefObject<HTMLDivElement | null>;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(pageNumber <= 2);
  const [size, setSize] = useState<{ w: number; h: number }>();

  // Placeholder size so the scrollbar is right before pages render.
  useEffect(() => {
    let cancelled = false;
    pdf.getPage(pageNumber).then((p) => {
      if (cancelled) return;
      const vp = p.getViewport({ scale });
      setSize({ w: vp.width, h: vp.height });
    });
    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber, scale]);

  useEffect(() => {
    const el = holderRef.current;
    if (!el || visible) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { root: root.current, rootMargin: '600px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible, root]);

  useEffect(() => {
    if (!visible) return;
    let task: { cancel: () => void; promise: Promise<void> } | undefined;
    let cancelled = false;
    pdf.getPage(pageNumber).then((p) => {
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      const vp = p.getViewport({ scale });
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(vp.width * ratio);
      canvas.height = Math.floor(vp.height * ratio);
      canvas.style.width = `${vp.width}px`;
      canvas.style.height = `${vp.height}px`;
      task = p.render({
        canvas,
        viewport: vp,
        transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
      });
      task.promise.catch((e: { name?: string }) => {
        if (e?.name !== 'RenderingCancelledException') console.error(e);
      });
    });
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [visible, pdf, pageNumber, scale]);

  return (
    <div
      ref={holderRef}
      className="relative bg-white shadow"
      style={size ? { width: size.w, height: size.h } : { width: 600, height: 800 }}
    >
      {visible ? <canvas ref={canvasRef} /> : null}
      <span className="absolute bottom-1 right-2 text-[10px] text-gray-400">{pageNumber}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Word (.docx)                                                        */
/* ------------------------------------------------------------------ */

function DocxView({ file, url, height }: { file?: File; url?: string; height: string }) {
  // Preferred: docx-preview renders real pages (fonts, tables, headers/footers, page breaks).
  const pagesRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'pages' | 'html'>('pages');
  const [state, setState] = useState<{ loading: boolean; error?: string }>({ loading: true });

  useEffect(() => {
    if (mode !== 'pages') return;
    let cancelled = false;
    setState({ loading: true });
    (async () => {
      try {
        const [buf, docx] = await Promise.all([loadBytes(file, url), import('docx-preview')]);
        if (cancelled || !pagesRef.current) return;
        pagesRef.current.innerHTML = '';
        await docx.renderAsync(buf, pagesRef.current, undefined, {
          className: 'docx',
          inWrapper: true,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
          renderComments: false,
          renderChanges: false,
        });
        if (!cancelled) setState({ loading: false });
      } catch (e) {
        console.warn('docx-preview failed, falling back to simple view', e);
        if (!cancelled) setMode('html');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file, url, mode]);

  if (mode === 'pages') {
    return (
      <div className="relative overflow-auto bg-gray-100 dark:bg-gray-950" style={{ maxHeight: height }}>
        {state.loading && <Loading label="Loading Word document…" />}
        <div ref={pagesRef} className="docx-pages [&_.docx-wrapper]:bg-transparent! [&_.docx-wrapper]:p-4! [&_section.docx]:mx-auto [&_section.docx]:max-w-full [&_section.docx]:shadow" />
      </div>
    );
  }
  return <DocxHtmlView file={file} url={url} height={height} />;
}

/** Fallback for documents docx-preview can't lay out. */
function DocxHtmlView({ file, url, height }: { file?: File; url?: string; height: string }) {
  const { data, error, loading } = useParsed(file, url, async (buf) => {
    const mammoth = await import('mammoth');
    const { value } = await mammoth.convertToHtml({ arrayBuffer: buf });
    return value;
  });
  if (loading) return <Loading label="Loading Word document…" />;
  if (error) return <ErrorState message={error} />;
  return (
    <div className="overflow-auto bg-gray-100 p-4 dark:bg-gray-950" style={{ maxHeight: height }}>
      <article
        className="docx-body mx-auto max-w-3xl bg-white p-10 text-gray-800 shadow"
        // mammoth escapes document text; it only emits structural tags.
        dangerouslySetInnerHTML={{ __html: data || '<p><em>This document is empty.</em></p>' }}
      />
      <style>{`
        .docx-body { line-height: 1.6; font-size: 15px; }
        .docx-body h1 { font-size: 1.75rem; font-weight: 700; margin: 1.25rem 0 .75rem; }
        .docx-body h2 { font-size: 1.4rem; font-weight: 700; margin: 1.1rem 0 .6rem; }
        .docx-body h3 { font-size: 1.15rem; font-weight: 600; margin: 1rem 0 .5rem; }
        .docx-body p { margin: 0 0 .75rem; }
        .docx-body ul { list-style: disc; padding-left: 1.5rem; margin-bottom: .75rem; }
        .docx-body ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: .75rem; }
        .docx-body table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        .docx-body td, .docx-body th { border: 1px solid #d1d5db; padding: .4rem .6rem; vertical-align: top; }
        .docx-body img { max-width: 100%; height: auto; }
        .docx-body a { color: #2563eb; text-decoration: underline; }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Spreadsheets (.xlsx / .xls / .csv)                                  */
/* ------------------------------------------------------------------ */

type Sheet = { name: string; rows: (string | number | boolean | null)[][] };
const MAX_ROWS = 2000;

function SheetView({ file, url, height }: { file?: File; url?: string; height: string }) {
  const { data, error, loading } = useParsed<Sheet[]>(file, url, async (buf) => {
    const XLSX = await import('xlsx');
    const wb = XLSX.read(buf, { type: 'array', cellDates: true });
    return wb.SheetNames.map((n) => ({
      name: n,
      rows: XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(wb.Sheets[n], {
        header: 1,
        raw: false,
        defval: '',
        blankrows: false,
      }),
    }));
  });
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [data]);

  if (loading) return <Loading label="Loading spreadsheet…" />;
  if (error) return <ErrorState message={error} />;
  if (!data?.length) return <ErrorState message="This spreadsheet has no sheets." />;

  const sheet = data[Math.min(active, data.length - 1)];
  const [header = [], ...body] = sheet.rows;
  const shown = body.slice(0, MAX_ROWS);
  const cols = Math.max(header.length, ...shown.map((r) => r.length));

  return (
    <>
      {data.length > 1 && (
        <div className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-gray-50 px-2 pt-2 dark:border-gray-800 dark:bg-gray-950">
          {data.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setActive(i)}
              className={`whitespace-nowrap rounded-t px-3 py-1.5 text-xs font-medium ${
                i === active
                  ? 'bg-white text-blue-700 shadow-sm dark:bg-gray-900 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <div className="overflow-auto" style={{ maxHeight: height }}>
        {sheet.rows.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">This sheet is empty.</p>
        ) : (
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="w-10 border border-gray-200 px-2 py-1 text-xs text-gray-400 dark:border-gray-700">#</th>
                {Array.from({ length: cols }, (_, c) => (
                  <th key={c} className="border border-gray-200 px-3 py-1.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200">
                    {String(header[c] ?? '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((row, r) => (
                <tr key={r} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-950">
                  <td className="border border-gray-200 px-2 py-1 text-right text-xs text-gray-400 dark:border-gray-700">{r + 1}</td>
                  {Array.from({ length: cols }, (_, c) => (
                    <td key={c} className="whitespace-pre-wrap border border-gray-200 px-3 py-1 text-gray-800 dark:border-gray-700 dark:text-gray-200">
                      {String(row[c] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {body.length > MAX_ROWS && (
          <p className="p-3 text-center text-xs text-gray-500">
            Showing the first {MAX_ROWS.toLocaleString()} of {body.length.toLocaleString()} rows — download the file to see all.
          </p>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* PowerPoint / legacy Word — Office web viewer                        */
/* ------------------------------------------------------------------ */

/** PowerPoint: slides drawn in the browser (works offline / on protected previews). */
function PptxView({ file, url, name, height }: { file?: File; url?: string; name: string; height: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'slides' | 'office'>('slides');
  const [state, setState] = useState<{ loading: boolean; error?: string; count?: number }>({ loading: true });

  useEffect(() => {
    if (mode !== 'slides') return;
    let cancelled = false;
    let previewer: { destroy: () => void; slideCount: number } | undefined;
    setState({ loading: true });
    (async () => {
      try {
        const [buf, lib] = await Promise.all([loadBytes(file, url), import('pptx-preview')]);
        const host = hostRef.current;
        if (cancelled || !host) return;
        host.innerHTML = '';
        const width = Math.max(320, Math.min(host.clientWidth - 32, 1100));
        const p = lib.init(host, { width, height: Math.round((width * 9) / 16), mode: 'list' });
        previewer = p;
        await p.preview(buf);
        if (!cancelled) setState({ loading: false, count: p.slideCount });
      } catch (e) {
        console.error('PPTX render failed:', e);
        if (!cancelled) {
          if (isPubliclyReachable(url)) setMode('office');
          else setState({ loading: false, error: 'This presentation could not be displayed. Download it to view.' });
        }
      }
    })();
    return () => {
      cancelled = true;
      try {
        previewer?.destroy();
      } catch {}
    };
  }, [file, url, mode]);

  const canOffice = !file && isPubliclyReachable(url);

  return (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-950">
        <span>{mode === 'slides' ? (state.count ? `${state.count} slides` : 'Presentation') : 'Microsoft Office viewer'}</span>
        {canOffice && (
          <button
            type="button"
            onClick={() => setMode((m) => (m === 'slides' ? 'office' : 'slides'))}
            className="rounded px-2 py-1 font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
          >
            {mode === 'slides' ? 'Open in Microsoft viewer' : 'Back to slides'}
          </button>
        )}
      </div>
      {mode === 'office' ? (
        <OfficeView url={url} name={name} height={height} />
      ) : (
        <div className="overflow-auto bg-gray-100 dark:bg-gray-950" style={{ maxHeight: height }}>
          {state.loading && <Loading label="Loading presentation…" />}
          {state.error && <ErrorState message={state.error} />}
          <div ref={hostRef} className="pptx-host flex flex-col items-center gap-4 p-4 [&_.pptx-preview-slide-wrapper]:shadow" />
        </div>
      )}
    </>
  );
}

function OfficeView({ url, name, height }: { url?: string; name: string; height: string }) {
  const isPublic = isPubliclyReachable(url);
  if (!isPublic) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>
          A preview of <span className="font-medium">{name}</span> will be available once it is uploaded.
        </p>
        <p className="text-xs text-gray-400">PowerPoint and legacy .doc files are rendered by Microsoft&apos;s online viewer, which needs a public link.</p>
      </div>
    );
  }
  return (
    <iframe
      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url!)}`}
      title={name}
      className="w-full border-0"
      style={{ height }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Images & text                                                       */
/* ------------------------------------------------------------------ */

function ImageView({ src, name, height }: { src?: string; name: string; height: string }) {
  const [zoomed, setZoomed] = useState(false);
  if (!src) return <ErrorState message="Image not available." />;
  return (
    <div className="overflow-auto bg-gray-100 p-4 dark:bg-gray-950" style={{ maxHeight: height }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name}
        onClick={() => setZoomed((z) => !z)}
        className={`mx-auto rounded shadow ${zoomed ? 'max-w-none cursor-zoom-out' : 'max-w-full cursor-zoom-in'}`}
      />
    </div>
  );
}

function TextView({ file, url, height }: { file?: File; url?: string; height: string }) {
  const { data, error, loading } = useParsed(file, url, async (buf) => new TextDecoder().decode(buf));
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  return (
    <pre
      className="overflow-auto whitespace-pre-wrap bg-gray-50 p-6 font-mono text-sm leading-relaxed text-gray-800 dark:bg-gray-950 dark:text-gray-200"
      style={{ maxHeight: height }}
    >
      {data}
    </pre>
  );
}
