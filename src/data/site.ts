/** Global identity and links shared across pages, nav, footer and SEO JSON-LD. */
export const site = {
  name: 'Tymoteusz Jaskólski',
  title: 'Junior Gameplay Programmer (Unity / C#)',
  tagline:
    'I build the systems that make games feel cohesive: deterministic tactics, spawn directors, enemy AI and save data — alongside tools and engines that keep projects maintainable.',
  location: 'Poznań, Poland',
  email: 'tmtjsk@gmail.com',
  github: 'https://github.com/phanto17',
  githubHandle: 'phanto17',
  itch: 'https://phanto-official.itch.io',
  itchHandle: 'phanto-official',
  youtube: 'https://youtube.com/@phanto.official',
  youtubeHandle: '@phanto.official',
  cv: '/CV_Tymoteusz_Jaskolski_EN.pdf',
  url: 'https://phanto17.github.io',
  description:
    'Portfolio of Tymoteusz Jaskólski, Junior Gameplay Programmer (Unity / C#) and Game Development student in Poznań: playable WebGL projects, technical breakdowns, experience and CV.',
};

/** Schema.org Person entity @id reused by site-wide and per-project JSON-LD. */
export const PERSON_ID = `${site.url}/#person`;
export const PROJECTS_INDEX = '/projects/';
