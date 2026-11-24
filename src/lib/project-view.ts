/**
 * How a project's state reads on the site, in one wording: its status, its period and where it can be
 * played or downloaded. The map's panel, the overview's tile, the projects index row and the write-up
 * page all show these; before 2026-11-04 each built its own (four copies, three wordings). Pure.
 */
export type ProjectStatus = 'playable' | 'released' | 'in-progress' | 'planned';

/** The frontmatter fields this reads (src/content.config.ts). */
export interface ProjectFacts {
  kind?: 'game' | 'tool' | 'engine';
  status: ProjectStatus;
  dates: { start: string; end?: string };
  itchUrl?: string;
  downloadUrl?: string;
  githubUrl?: string;
}

export interface ProjectView {
  /** "Playable", "Released", "Build in progress" or "Rework planned". */
  status: string;
  /** "2026-03 – now", or "start – end" once it ended. */
  period: string;
  /** "Play" for a game, "Download" for a tool, "Source" for an engine. */
  liveTerm: 'Play' | 'Download' | 'Source';
  /** Where to play, download or inspect it; null while nothing is published. */
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
  const period = `${d.dates.start} – ${d.dates.end ?? 'now'}`;
  if (d.kind === 'tool') {
    return {
      status: STATUS_LABEL[d.status],
      period,
      liveTerm: 'Download',
      live: d.downloadUrl
        ? { href: d.downloadUrl, label: '↓ Download on GitHub', short: 'GitHub Releases ↗' }
        : null,
      pending: 'Not released yet',
    };
  }
  if (d.kind === 'engine') {
    const href = d.downloadUrl ?? d.githubUrl;
    return {
      status: STATUS_LABEL[d.status],
      period,
      liveTerm: 'Source',
      live: href
        ? d.downloadUrl
          ? { href, label: '↓ Download on GitHub', short: 'GitHub ↗' }
          : { href, label: 'View on GitHub ↗', short: 'GitHub ↗' }
        : null,
      pending: 'Repository pending',
    };
  }
  const live = d.itchUrl
    ? { href: d.itchUrl, label: '▶ Play on itch.io', short: 'itch.io ↗' }
    : d.downloadUrl
      ? { href: d.downloadUrl, label: '↓ Download Playable Build', short: 'Download ↗' }
      : d.githubUrl
        ? { href: d.githubUrl, label: '▶ Get & Play on GitHub', short: 'GitHub ↗' }
        : null;
  return {
    status: STATUS_LABEL[d.status],
    period,
    liveTerm: 'Play',
    live,
    pending: 'Not on itch.io yet',
  };
}
