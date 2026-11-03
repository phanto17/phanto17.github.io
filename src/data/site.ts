export const site = {
  name: 'Tymoteusz Jaskólski',
  title: 'Junior Gameplay Programmer (Unity / C#)',
  tagline:
    'I write the systems that make games feel like games: abilities, turn engines, enemy AI, save data. And I write about why they work — on my channel about the psychology of play.',
  location: 'Poznań, Poland',
  email: 'tmtjsk@gmail.com',
  github: 'https://github.com/phanto17',
  githubHandle: 'phanto17',
  youtube: 'https://youtube.com/@phanto.official',
  youtubeHandle: '@phanto.official',
  cv: '/CV_Tymoteusz_Jaskolski_EN.pdf',
  url: 'https://phanto17.github.io',
  description:
    'Portfolio of Tymoteusz Jaskólski, Junior Gameplay Programmer (Unity / C#) and Game Development student in Poznań: playable projects, technical breakdowns and contact.',
};

/** JSON-LD @id of the site owner; every page's graph links its nodes to this Person. */
export const PERSON_ID = `${site.url}/#person`;

/** The home page is the field map; the text sections live on /overview/. */
export const OVERVIEW = '/overview/';
export const nav = [
  { href: '/', label: 'Map' },
  { href: `${OVERVIEW}#about`, label: 'About' },
  { href: `${OVERVIEW}#projects`, label: 'Projects' },
  { href: `${OVERVIEW}#lab`, label: 'Lab' },
  { href: `${OVERVIEW}#activities`, label: 'Activities' },
  { href: `${OVERVIEW}#contact`, label: 'Contact' },
];
