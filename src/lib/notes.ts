/**
 * Nonlinear notes for project write-ups.
 *
 * Splits the rendered Markdown of a project at its "Technical breakdown" heading: every H3 below it
 * becomes one note, and the "What changed in …" H3s are gathered into a single "Release notes" note
 * (their headings drop to H4). The page shows the notes as an explorable grid with a reading pane
 * (InteractivePanel + the inspector pattern from the Telegraph Recall lab); without JavaScript, or in
 * "one page" mode, the same sections read top to bottom.
 *
 * Works on the HTML string Astro renders for the entry, after heading ids are assigned.
 */
export interface Note {
  /** Section id, `note-<heading id>`. */
  id: string;
  /** Id of the note's H3, the anchor shared links point at. */
  headingId: string;
  code: string;
  title: string;
  tag: string;
  summary: string;
  html: string;
}

export interface SplitWriteUp {
  /** Everything up to and including the "Technical breakdown" H2. */
  before: string;
  /** HTML between that H2 and its first H3 (an intro paragraph), if any. */
  intro: string;
  notes: Note[];
}

const H2 = /<h2\b[^>]*>[\s\S]*?<\/h2>/gi;
const H3 = /<h3\b([^>]*)>([\s\S]*?)<\/h3>/gi;
const RELEASE = /^What changed\b/i;

const stripTags = (html: string): string =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

const attr = (attrs: string, name: string): string | undefined =>
  new RegExp(String.raw`(?:^|\s)${name}="([^"]*)"`).exec(attrs)?.[1];

/** First sentence of the first paragraph, cut at a word boundary to `max` characters. */
export function firstSentence(html: string, max = 120): string {
  const para = /<p\b[^>]*>([\s\S]*?)<\/p>/i.exec(html);
  const text = stripTags(para?.[1] ?? html);
  const sentence = /^(.+?[.!?])(\s|$)/.exec(text)?.[1] ?? text;
  if (sentence.length <= max) return sentence;
  const cut = sentence.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '')}…`;
}

function tagFor(title: string): string {
  if (/^\d+\./.test(title)) return 'System';
  if (/next/i.test(title)) return 'Roadmap';
  if (/how i worked/i.test(title)) return 'Process';
  return 'Note';
}

export function splitWriteUp(html: string): SplitWriteUp | null {
  let breakdownEnd = -1;
  let tailStart = html.length;
  for (const m of html.matchAll(H2)) {
    if (breakdownEnd < 0 && /Technical breakdown/i.test(stripTags(m[0]))) breakdownEnd = m.index! + m[0].length;
    else if (breakdownEnd >= 0 && m.index! > breakdownEnd) {
      tailStart = m.index!;
      break;
    }
  }
  if (breakdownEnd < 0 || tailStart < html.length) return null; // only split when the breakdown runs to the end

  const body = html.slice(breakdownEnd);
  const heads = [...body.matchAll(H3)];
  if (heads.length < 2) return null;

  type Raw = { headingId: string; title: string; headingHtml: string; content: string };
  const raws: Raw[] = heads.map((m, i) => ({
    headingId: attr(m[1], 'id') ?? `note-${i + 1}`,
    title: stripTags(m[2]),
    headingHtml: m[0],
    content: body.slice(m.index! + m[0].length, i + 1 < heads.length ? heads[i + 1].index! : body.length),
  }));

  const notes: Note[] = [];
  const releases = raws.filter((r) => RELEASE.test(r.title));
  let releaseAdded = false;
  for (const r of raws) {
    if (RELEASE.test(r.title)) {
      if (releaseAdded) continue;
      releaseAdded = true;
      const versions = releases
        .map((x) => /\d+\.\d+\.\d+/.exec(x.title)?.[0])
        .filter((v): v is string => Boolean(v))
        .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
      const inner = releases
        .map((x) => `${x.headingHtml.replace(/^<h3/i, '<h4').replace(/<\/h3>$/i, '</h4>')}${x.content}`)
        .join('');
      notes.push({
        id: 'note-release-notes',
        headingId: 'release-notes',
        code: '',
        title: 'Release notes',
        tag: 'Changelog',
        summary: versions.length > 0 ? `What changed in each build: ${versions.join(', ')}.` : 'What changed in each build.',
        html: `<h3 id="release-notes">Release notes</h3>${inner}`,
      });
      continue;
    }
    notes.push({
      id: `note-${r.headingId}`,
      headingId: r.headingId,
      code: '',
      title: r.title.replace(/^\d+\.\s*/, ''),
      tag: tagFor(r.title),
      summary: firstSentence(r.content),
      html: `${r.headingHtml}${r.content}`,
    });
  }
  notes.forEach((n, i) => (n.code = `N-${String(i + 1).padStart(2, '0')}`));

  return { before: html.slice(0, breakdownEnd), intro: body.slice(0, heads[0].index!), notes };
}
