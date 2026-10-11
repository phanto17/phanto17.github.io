/**
 * Activities: team projects, channel, community. Short entries, no playable requirement.
 * Every claim here is backed by git history or by Tymoteusz directly — see docs/audit-2026-10-11.md.
 * Team footage / code is NOT shown for now (decision 2026-10-11).
 */
export type Activity = {
  period: string;
  title: string;
  kind: string;
  text: string;
  credits?: string;
};

export const activities: Activity[] = [
  {
    period: 'Oct 2026 – present',
    title: 'TagTheGame',
    kind: 'Team project · Unity 6 / URP',
    text:
      '3D third-person multiplayer "bomb tag" for PC, four-person team. I implemented the bomb-fuse and explosion mechanic, designed the host-authoritative multiplayer architecture (Netcode for GameObjects) and set up the team\'s Git LFS repository, pull-request workflow and Git guide. Networking is not implemented yet.',
  },
  {
    period: 'Oct 2025 – Jul 2026',
    title: 'Mansion of Grief',
    kind: 'Team project · Unity 6 / URP · first-person horror',
    text:
      'Four-person team. I built the bear enemy AI (patrol / roar / chase state machine, field-of-view and raycast detection on NavMesh, pulsing URP danger vignette, hurt-and-retreat window, blood overlay and jumpscare sequence), the pause and main menus with fades and post-exposure brightness, the inventory (equip, drop, use), the shadow, keypad, pressure-plate and mirror-beam puzzles with their editor tooling, the level intro flow and the player health state.',
    credits: 'Team: Ivan Liaskovski, Maris, Dariia Sedrova. Repository owned by Ivan Liaskovski (MIT).',
  },
  {
    period: 'Jul 2026 – present',
    title: 'phanto',
    kind: 'YouTube channel',
    text:
      'English-language video essays on the psychology of video games, including a narrative adaptation of a Pillars of Eternity questline. I research, script and produce the videos and manage the pipeline in Notion.',
  },
  {
    period: 'Jun – Jul 2026',
    title: 'Garden Simulator VR',
    kind: 'Team project · Unity 2022.3 · XR Interaction Toolkit',
    text:
      'VR gardening sim built on a course template. I wrote the economy layer: an event-driven inventory, item and shop-catalog ScriptableObjects, the vendor and shop UI, a harvest crate that detects produce by physics overlap, collect-on-grab, a pest-infestation system with a timed clear-the-bugs mini-loop, a wild mushroom spawner and multi-fruit clusters.',
    credits: 'Team: Joanna Vetulani (template), Ivan Liaskovski, Maris, Dariia Sedrova.',
  },
  {
    period: 'Jun 2026',
    title: 'Academic Counter-Strike 2 Championships of Poznań and Wielkopolska',
    kind: 'E-sports organisation',
    text: 'I helped prepare and run the tournament on site as a member of the AZS Collegium Da Vinci organising team.',
  },
  {
    period: 'Feb 2026',
    title: 'Animal Shelter',
    kind: 'Team project · Unreal Engine 5.6 · Blueprints / C++',
    text:
      'Top-down animal-shelter management prototype. My part was small: minor UI work plus ideas for mechanics and the dog species. Version control in Unity Version Control.',
    credits: 'Team: Andrzej "BappoEatTaco", Julia "Yuchan".',
  },
];

/** Experience outside games, framed around transferable skills (decision 2026-10-11). */
export const experience = [
  {
    period: 'Jan 2026 – present',
    title: 'Intern — Taskscape Ltd (remote)',
    text:
      'Web development, content and video production. What transfers to game teams: task planning and estimation in TaskBeat and Azure DevOps, writing technical specifications, UI/UX audits, Git-based work on a remote VM, and editing and publishing 50+ YouTube videos and Shorts in DaVinci Resolve.',
  },
];

export const education = {
  period: '2024 – present',
  title: 'BA Game Development — Collegium Da Vinci, Poznań',
};
