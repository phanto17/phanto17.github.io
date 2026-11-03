/**
 * About me, as data: the four dossier facets read on the overview page and in the Field Station
 * panel of the map. One source, so the two never drift. Every line here is the owner's own text.
 */
import { site } from './site';
import { education } from './activities';

export interface Facet {
  code: string;
  title: string;
  /** Paragraph HTML (links allowed). */
  html: string;
  rows?: [string, string][];
}

export const aboutFacets: Facet[] = [
  {
    code: '01',
    title: 'Who I am',
    html:
      "I'm a BA Game Development student at Collegium Da Vinci in Poznań (2024 – present), specialising in gameplay programming in Unity 6 and C#. My projects include a survivors-like with a data-driven ability system, a deterministic grid-tactics game, and a 2D dungeon crawler I'm rebuilding from the ground up. Since July 2026 I've also been shipping Eternity Keeper, an open-source save editor for Pillars of Eternity — reverse-engineering a real RPG's save format and verifying every edit in the game.",
    rows: [
      ['Education', `${education.title} (${education.period})`],
      ['Languages', 'Polish (native), English (C1)'],
    ],
  },
  {
    code: '02',
    title: 'Specialisation',
    html: `${site.title}.`,
    rows: [
      ['Engine', 'Unity 6 (URP) · Unreal Engine 5 (Blueprints / C++)'],
      ['Language', 'C#'],
      ['Gameplay', 'AI &amp; NavMesh, ScriptableObject-driven design, Input System, Cinemachine, UI Toolkit'],
      ['Multiplayer', 'Netcode for GameObjects (architecture)'],
      ['Workflow', 'Git / GitHub (LFS, pull requests), Jira, Azure DevOps'],
      ['Also', 'DaVinci Resolve, Photoshop'],
    ],
  },
  {
    code: '03',
    title: 'Interests',
    html: `I care about the psychology of games — telegraphing, tension, the feeling of a "perfect turn". I explore that on my YouTube channel <a href="${site.youtube}">phanto</a>, and it feeds back into how I design mechanics.`,
    rows: [['Interests', 'Gameplay systems &amp; AI, tactics / roguelite design, game psychology']],
  },
  {
    code: '04',
    title: 'Goals',
    html:
      "I'm looking to start out as a Junior Gameplay Programmer at a studio that makes systemic games—things like tactics, roguelites, RPGs or action titles where emergent systems, smart enemy behavior and reactive environments really drive the experience. Down the line, I'd love to grow into a systems and AI role where I'm not just coding those mechanics, but actively helping design them.",
  },
];
