/**
 * How a project's state reads on the site, in one wording: its status, its period and where it can be
 * played or downloaded. The map's panel, the overview's tile, the projects index row and the write-up
 * page all show these; before 2026-11-04 each built its own (four copies, three wordings). Pure.
 */
export type ProjectStatus = 'playable' | 'released' | 'in-progress' | 'planned';

/** The frontmatter fields this reads (src/content.config.ts). */
export interface ProjectFacts {
  kind?: 'game' | 'tool';
  status: ProjectStatus;
  dates: { start: string; end?: string };
  itchUrl?: string;
  downloadUrl?: string;
}

export interface ProjectView {
  /** "Playable", "Released", "Build in progress" or "Rework planned". */
  status: string;
  /** "2026-03 – now", or "start – end" once it ended. */
  period: string;
  /** "Play" for a game, "Download" for a tool: the word for what the live link does. */
  liveTerm: 'Play' | 'Download';
  /** Where to play or download it; null while nothing is published. */
  live: { href: string; label: string; short: string } | null;
  /** What stands in for the live link while there is none. */
  pending: string;
}

export const STATUS_LABEL: Readonly<Record<ProjectStatus, string>> = {
  playable: 'Playable',
  released: 'Released',
  'in-progress': 'Build in progress',
  planned: 'Rework planned',
};

export function projectView(d: ProjectFacts): ProjectView {
  const tool = d.kind === 'tool';
  const href = tool ? d.downloadUrl : d.itchUrl;
  return {
    status: STATUS_LABEL[d.status],
    period: `${d.dates.start} – ${d.dates.end ?? 'now'}`,
    liveTerm: tool ? 'Download' : 'Play',
    live: href
      ? tool
        ? { href, label: '↓ Download on GitHub', short: 'GitHub Releases ↗' }
        : { href, label: '▶ Play on itch.io', short: 'itch.io ↗' }
      : null,
    pending: tool ? 'Not released yet' : 'Not on itch.io yet',
  };
}
