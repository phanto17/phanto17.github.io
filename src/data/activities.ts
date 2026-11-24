/**
 * Team projects (text-only summaries — footage and code stay private per team agreement)
 * alongside community and YouTube activities.
 */

export interface Activity {
  name: string;
  dates: string;
  kind: string;
  where: string;
  what: string;
  mine: string;
  credits?: string;
  url?: string;
  urlLabel?: string;
}

export const ACTIVITIES: Activity[] = [
  {
    name: 'TagTheGame (v1.0.0)',
    dates: 'Oct – Nov 2026',
    kind: 'Team project · 4 people · Unity 6.3 / URP',
    where: 'Collegium Da Vinci — multiplayer prototype',
    what: '3D multiplayer bomb-tag arena game reaching v1.0.0 with lobby/round flow, two arenas (Colosseum and Warehouse), dash, vaulting, double jump, sliding, pickable items (rocket launcher, trampoline, freeze cone, speed boost, bomb swapper), scoreboard and round podium.',
    mine: 'Implemented the core bomb-fuse timer and explosion rules, drafted the host-authoritative architecture plan, supported HUD/lobby integration, reviewed teammate PRs and configured the Git LFS repository workflow. Final networking and movement/map polish were implemented by teammates.',
    credits: 'Team: Oliwier Karło, Weronika Górowska, Jakub Błoński.',
  },
  {
    name: 'Mansion of Grief',
    dates: 'Oct 2025 – Jul 2026',
    kind: 'Team project · 4 people · Unity 6 / URP',
    where: 'University team project',
    what: 'First-person survival horror prototype set inside a haunted manor.',
    mine: 'Built the BearAI state machine (patrol, roar, chase, FOV + line-of-sight raycast, URP danger vignette, hurt/retreat and jumpscare trigger), pause and main menus, inventory system, keypad/shadow/pressure-plate/mirror-beam puzzles, LevelStartManager and PlayerHealth. I did not write the FPS controller or flashlight.',
    credits: 'Team: Ivan "Maris" Liaskovskyi (Lead Gameplay Programmer), Dariia "xieanaya" Shchedrova (Level Design, Environment & Character Art); FPS controller and flashlight built by teammates.',
  },
  {
    name: 'Garden Simulator VR',
    dates: 'Jun – Jul 2026',
    kind: 'Team project · Unity 2022.3 / XR Interaction Toolkit',
    where: 'University VR project (team extension of a lecturer template)',
    what: 'Virtual-reality gardening simulation with planting, harvest crates and pest defence.',
    mine: 'Implemented the economy and progression slice: inventory, vendor/shop pricing loop, crate deposit logic, collect-on-grab behaviour, pest infestation with bug swarm, mushroom spawner and fruit clusters.',
  },
  {
    name: 'Animal Shelter',
    dates: 'Feb 2026',
    kind: 'Team project · 3 people · Unreal Engine 5.6 (Blueprints / C++)',
    where: 'University Unreal Engine course',
    what: 'Top-down shelter management game with animal care needs, adoption matchmaking UI, NPC day cycle and a drivable rescue vehicle.',
    mine: 'Minor UI work alongside mechanics brainstorming and the dog species design.',
    credits: 'Teammates: Andrzej "BappoEatTaco" and Julia "Yuchan".',
  },
  {
    name: 'Official Unity Game Jam 2026',
    dates: 'Nov 2026',
    kind: 'Game jam · Solo entry · Unity 6 URP 3D',
    where: 'itch.io — "Lucky Number" theme',
    what: 'Joined the Official Unity Game Jam 2026 building Please Take a Number around the "Lucky Number" theme from concept to WebGL release.',
    mine: 'Scoped the five-minute waiting-room mystery, designed four endings driven by physical props, backed core ticket/queue logic with 431 EditMode tests and shipped the 14.5 MB Brotli WebGL build under jam deadlines.',
    url: 'https://itch.io/jam/official-unity-game-jam-2026',
    urlLabel: 'Official jam page ↗',
  },
  {
    name: 'phanto — Psychology of Play',
    dates: 'Jul 2026 – present',
    kind: 'YouTube video essays · @phanto.official',
    where: 'youtube.com/@phanto.official',
    what: 'English-language channel examining why game mechanics feel compelling — tension pacing, agency, feedback loops and tactical readability.',
    mine: 'Topic research, scriptwriting, gameplay capture, editing and voiceover.',
  },
  {
    name: 'Academic CS2 Championships',
    dates: 'Jun 2026',
    kind: 'Event organisation · AZS CDV',
    where: 'Poznań & Wielkopolska',
    what: 'Academic Counter-Strike 2 tournament for university rosters across Poznań and Wielkopolska.',
    mine: 'Contributed on the organising team supporting tournament operations and match scheduling.',
  },
];
