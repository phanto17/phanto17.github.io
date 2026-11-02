/**
 * The write-up plan: a project's rendered Markdown turned into the nonlinear notes the project page
 * shows, each with the visual the pinned pane holds for it.
 *
 * `planWriteUp` is the one entry point. It splits the rendered HTML at the "Technical breakdown"
 * heading: every H3 below it becomes one note, and the "What changed in …" H3s are gathered into a
 * single "Release notes" note (their headings drop to H4). Each note then gets a visual: the page's
 * widget on the first note when the write-up asks for one, else the note's first code block (tagged
 * `data-in-pane` in the note so the split layout can show the copy in the pane instead), else the
 * gallery images in turn, else the cover. The result is a fresh value; nothing passed in is changed.
 *
 * The conventions a write-up must follow are data here (`WRITE_UP_RULES`), and `checkWriteUpSource`
 * applies them to a write-up's Markdown source so tests/write-ups.test.ts catches a broken write-up
 * before it is rendered wrong on the live page.
 *
 * Works on the HTML string Astro renders for the entry, after heading ids are assigned.
 */

export type WidgetKind = 'shove-lab';

export interface MediaItem {
  type: string;
  src: string;
  alt: string;
  caption?: string;
}

export type NoteVisual =
  | { kind: 'widget'; widget: WidgetKind }
  /** The note's first code block, copied here; the note's own copy is tagged `data-in-pane`. */
  | { kind: 'code'; html: string }
  | { kind: 'image'; src?: string; alt?: string; caption?: string };

export interface Note {
  /** Section id, `note-<heading id>`. */
  id: string;
  /** Id of the note's H3, the anchor shared links point at. */
  headingId: string;
  code: string;
  title: string;
  tag: string;
  summary: string;
  /** The note's H3. */
  headingHtml: string;
  /** Everything after the H3 (the first code block tagged `data-in-pane` when the pane shows it). */
  bodyHtml: string;
  visual: NoteVisual;
}

export interface WriteUpPlan {
  /** Everything up to and including the "Technical breakdown" H2. */
  before: string;
  /** HTML between that H2 and its first H3 (an intro paragraph), if any. */
  intro: string;
  notes: Note[];
}

export interface WriteUpInput {
  html: string;
  media: readonly MediaItem[];
  /** The page's interactive widget, shown with the first note. */
  widget?: WidgetKind;
}

/** What a write-up's Markdown must look like for the plan to apply. */
export const WRITE_UP_RULES = {
  /** The H2 that starts the breakdown; it must be the last H2 of the write-up. */
  breakdownHeading: /^Technical breakdown$/i,
  /** Below it, at least this many H3s (one note each). */
  minNotes: 2,
  /** H3s gathered into the "Release notes" note. */
  release: /^What changed\b/i,
  /** The build a release note names, when it does (the summary lists the ones that do). */
  version: /\d+\.\d+\.\d+/,
  /** A note's tag, from its title: the first match wins, else "Note". */
  tags: [
    [/^\d+\./, 'System'],
    [/next/i, 'Roadmap'],
    [/how i worked/i, 'Process'],
  ] as readonly (readonly [RegExp, string])[],
} as const;

const H2 = /<h2\b[^>]*>[\s\S]*?<\/h2>/gi;
const H3 = /<h3\b([^>]*)>([\s\S]*?)<\/h3>/gi;
const PRE = /<pre\b[^>]*>[\s\S]*?<\/pre>/i;

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

const tagFor = (title: string): string => WRITE_UP_RULES.tags.find(([re]) => re.test(title))?.[1] ?? 'Note';

type Section = Omit<Note, 'visual' | 'code'>;

/** The breakdown's sections, or null when the write-up has no breakdown that runs to the end. */
function splitSections(html: string): { before: string; intro: string; sections: Section[] } | null {
  let breakdownEnd = -1;
  let tailStart = html.length;
  for (const m of html.matchAll(H2)) {
    if (breakdownEnd < 0 && WRITE_UP_RULES.breakdownHeading.test(stripTags(m[0]))) breakdownEnd = m.index! + m[0].length;
    else if (breakdownEnd >= 0 && m.index! > breakdownEnd) {
      tailStart = m.index!;
      break;
    }
  }
  if (breakdownEnd < 0 || tailStart < html.length) return null;

  const body = html.slice(breakdownEnd);
  const heads = [...body.matchAll(H3)];
  if (heads.length < WRITE_UP_RULES.minNotes) return null;

  type Raw = { headingId: string; title: string; headingHtml: string; content: string };
  const raws: Raw[] = heads.map((m, i) => ({
    headingId: attr(m[1], 'id') ?? `note-${i + 1}`,
    title: stripTags(m[2]),
    headingHtml: m[0],
    content: body.slice(m.index! + m[0].length, i + 1 < heads.length ? heads[i + 1].index! : body.length),
  }));

  const sections: Section[] = [];
  const releases = raws.filter((r) => WRITE_UP_RULES.release.test(r.title));
  let releaseAdded = false;
  for (const r of raws) {
    if (WRITE_UP_RULES.release.test(r.title)) {
      if (releaseAdded) continue;
      releaseAdded = true;
      const versions = releases
        .map((x) => WRITE_UP_RULES.version.exec(x.title)?.[0])
        .filter((v): v is string => Boolean(v))
        .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
      sections.push({
        id: 'note-release-notes',
        headingId: 'release-notes',
        title: 'Release notes',
        tag: 'Changelog',
        summary: versions.length > 0 ? `What changed in each build: ${versions.join(', ')}.` : 'What changed in each build.',
        headingHtml: '<h3 id="release-notes">Release notes</h3>',
        bodyHtml: releases.map((x) => `${x.headingHtml.replace(/^<h3/i, '<h4').replace(/<\/h3>$/i, '</h4>')}${x.content}`).join(''),
      });
      continue;
    }
    sections.push({
      id: `note-${r.headingId}`,
      headingId: r.headingId,
      title: r.title.replace(/^\d+\.\s*/, ''),
      tag: tagFor(r.title),
      summary: firstSentence(r.content),
      headingHtml: r.headingHtml,
      bodyHtml: r.content,
    });
  }
  return { before: html.slice(0, breakdownEnd), intro: body.slice(0, heads[0].index!), sections };
}

/** The note's first code block tagged `data-in-pane`, and the block itself, when it has one. */
function liftFirstCode(bodyHtml: string): { bodyHtml: string; code: string } | null {
  const m = PRE.exec(bodyHtml);
  if (!m) return null;
  const tagged = m[0].replace(/^<pre\b/i, '<pre data-in-pane');
  return { code: m[0], bodyHtml: bodyHtml.slice(0, m.index) + tagged + bodyHtml.slice(m.index + m[0].length) };
}

/** The plan for a write-up, or null when it has no breakdown to show as notes. */
export function planWriteUp(input: WriteUpInput): WriteUpPlan | null {
  const split = splitSections(input.html);
  if (!split) return null;
  const images = input.media.filter((m) => m.type === 'image');
  const gallery = images.slice(1);
  let nextImage = 0;
  const notes = split.sections.map((section, i): Note => {
    const code = `N-${String(i + 1).padStart(2, '0')}`;
    if (i === 0 && input.widget) return { ...section, code, visual: { kind: 'widget', widget: input.widget } };
    const lifted = liftFirstCode(section.bodyHtml);
    if (lifted) return { ...section, code, bodyHtml: lifted.bodyHtml, visual: { kind: 'code', html: lifted.code } };
    const img = gallery.length > 0 ? gallery[nextImage++ % gallery.length] : images[0];
    return { ...section, code, visual: img ? { kind: 'image', src: img.src, alt: img.alt, caption: img.caption } : { kind: 'image' } };
  });
  return { before: split.before, intro: split.intro, notes };
}

/* ---- Source conventions ---------------------------------------------------------------------- */

/** Markdown headings outside fenced code blocks, in order. */
function headings(markdown: string): { level: number; text: string }[] {
  const out: { level: number; text: string }[] = [];
  let fenced = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) out.push({ level: m[1].length, text: m[2].trim() });
  }
  return out;
}

/**
 * Problems with a write-up's Markdown source against WRITE_UP_RULES; empty when it follows them: the
 * breakdown is the last H2 and has enough H3 sections. (A release note without a version is allowed;
 * the release-notes summary simply lists the versions that are named.) The frontmatter is ignored.
 */
export function checkWriteUpSource(markdown: string): string[] {
  const body = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  const hs = headings(body);
  const problems: string[] = [];
  const h2s = hs.map((h, i) => ({ ...h, i })).filter((h) => h.level === 2);
  const breakdown = h2s.find((h) => WRITE_UP_RULES.breakdownHeading.test(h.text));
  if (!breakdown) return [`no "Technical breakdown" H2 (the notes need one)`];
  if (h2s[h2s.length - 1] !== breakdown) problems.push(`"Technical breakdown" must be the last H2; "${h2s[h2s.length - 1].text}" follows it`);
  const notes = hs.slice(breakdown.i + 1).filter((h) => h.level === 3);
  if (notes.length < WRITE_UP_RULES.minNotes) problems.push(`the breakdown has ${notes.length} H3 section(s); at least ${WRITE_UP_RULES.minNotes} are needed for notes`);
  return problems;
}
