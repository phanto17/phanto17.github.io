/**
 * Structured copy for the About, Principles, Experience and Education sections.
 */

export interface AboutCard {
  label: string;
  html: string;
}

export interface PrincipleCard {
  num: string;
  title: string;
  body: string;
}

export interface ExperienceEntry {
  period: string;
  org: string;
  role: string;
  context: string;
  bullets: string[];
}

export const DOSSIER: AboutCard[] = [
  {
    label: 'Who I am',
    html: `I'm <strong>Tymoteusz Jaskólski</strong>, a <strong>BA Game Development</strong> student at Collegium Da Vinci in Poznań (2024&nbsp;–&nbsp;present). Alongside university, I work full-time as an Intern at <strong>Taskscape Ltd</strong> across web projects (<em>isv.pl</em>, <em>skillsdeck.ai</em>), social media, media production and AI-assisted daily workflows.`,
  },
  {
    label: 'Specialisation',
    html: `<strong>Unity / C# gameplay programmer</strong>. Focus areas: deterministic turn engines, ability and spawn directors, state machines, grid combat, object pooling, input routing and binary/JSON save systems — backed by standalone <strong>.NET 10</strong> and <strong>Java 8</strong> tooling, automated tests (NUnit, xUnit, JUnit), Unreal Engine 5.6, Git LFS and Azure DevOps.`,
  },
  {
    label: 'Interests',
    html: `<strong>Gameplay systems &amp; AI</strong> — how state machines, telegraphed attacks and spawn pacing shape player tension. <strong>Tactics &amp; roguelite design</strong> — compact rule sets that create readable decisions. <strong>The psychology of play</strong> — explored through video essays on my English YouTube channel, <em>phanto</em>.`,
  },
  {
    label: 'Goals',
    html: `My goal is a <strong>Junior Gameplay Programmer</strong> role where teams ship playable slices regularly and keep state testable. Long term, I want to be the programmer who reads a design brief, asks which edge case breaks when two systems fire on the same frame, and proves it does not.`,
  },
];

export const PRINCIPLES: PrincipleCard[] = [
  {
    num: '01',
    title: 'Pure-C# / Pure-Core Rules',
    body: 'Simulation math, push chains, dice checks, queue state and save parsing live in plain C# or Java classes decoupled from MonoBehaviours and scene trees.',
  },
  {
    num: '02',
    title: 'Automated Verification First',
    body: 'Core mechanics run headlessly in EditMode, PlayMode, xUnit and JUnit suites so regressions fail immediately instead of hiding inside a playable build.',
  },
  {
    num: '03',
    title: 'Reproducible Scenes & Data',
    body: 'Idempotent editor builders, ScriptableObject configs and ASCII/JSON room layouts keep scenes and test fixtures cleanly reconstructible without manual YAML edits.',
  },
  {
    num: '04',
    title: 'Readable Player State',
    body: 'Pre-commit shove previews, telegraphed attacks, structured logs and crisp diegetic UI come before extra VFX so players always understand why an outcome happened.',
  },
  {
    num: '05',
    title: 'Atomic Persistence & Budgets',
    body: 'Save pipelines enforce byte/type invariants and atomic replacement; asset imports use power-of-four texture sizing and Brotli compression budgets for fast WebGL loads.',
  },
  {
    num: '06',
    title: 'Transparent AI Attribution',
    body: 'Where coding agents (Codex, Claude Code, Antigravity) or synthesis tools assisted under my direction, exact scopes, prompts, human playtesting and third-party licenses are documented.',
  },
];

export const EXPERIENCE_ENTRIES: ExperienceEntry[] = [
  {
    period: 'Jan 2026 – present',
    org: 'Taskscape Ltd',
    role: 'IT, Web & AI Automation Intern (Full-Time · Remote)',
    context: 'Commercial software & media environment — transferable engineering & AI workflow habits',
    bullets: [
      'Working on commercial web properties (isv.pl and the skillsdeck.ai project): WordPress maintenance, UI/UX audits, social media handling, and editing/publishing 50+ YouTube videos and Shorts in DaVinci Resolve.',
      'Applying AI tooling across daily operations: task automation, programming assistance, image generation, structured workflows and written technical specifications.',
      'Collaborating via Git workflows inside a remote VM alongside sprint scoping and estimation in TaskBeat and Azure DevOps.',
    ],
  },
  {
    period: '2024 – present',
    org: 'Collegium Da Vinci, Poznań',
    role: 'BA Game Development Student',
    context: 'University degree programme & multidisciplinary team productions',
    bullets: [
      'Delivered multi-term solo and team prototypes across Unity 6 (URP 2D/3D), Unity 2022.3 VR and Unreal Engine 5.6.',
      'Built custom gameplay systems, enemy state machines, procedural/seeded dungeons, economy loops and save architecture.',
      'Practised Git LFS workflows, PR reviews and technical documentation across 3–4 person student teams.',
    ],
  },
];
