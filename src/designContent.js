// ============================================================
//  DESIGN PORTFOLIO STORYBOOK CONTENT
//  Each project = one entry, in book order. Images live in
//  /public/design-portfolio/<id>/ — list the filenames in `files`.
//  `heroGifs` are shown near full-page width (the stars of the page).
// ============================================================

export const BOOK = {
  coverTitle: "Alena's Design Chronicles",
  coverSub: 'a storybook of things made with love',
  backCover: 'The end — for now. More missions loading…',
}

export const designProjects = [
  {
    id: 'crochet',
    title: '@by.nanacrochet — Crochet Business',
    kicker: 'Small business · handmade',
    text: 'Learned to crochet in 2021 to become financially capable and donate toys to children in hospitals. Grew it into a small business, selling 30+ plushies. Designed my own name cards, logo, and icon; filmed and edited every post, adapting marketing to trends and customers’ tastes.',
    files: ['01.png', '02.png', '03.png', '04.png', '05.png', '06.png', '07.png', '08.png', '09.png', '10.png', '11.png'],
    links: [{ label: 'Instagram ↗', href: 'https://www.instagram.com/by.nanacrochet' }],
  },
  {
    id: 'dreaming-or-reality',
    title: 'Dreaming or Reality',
    kicker: 'Computational Thinking & Design',
    text: 'A Rhino animation representing the state of anxiety and overwhelm — where it becomes hard to tell reality from dream.',
    files: ['01.png', '02.gif'],
  },
  {
    id: 'water-bending',
    title: 'Water Bending',
    kicker: 'Computational Thinking & Design',
    text: 'A parametric design created in Rhino with multiple variations, then 3D printed. It represents how water forms waves from any view, veins from the top, and mountains from the side — a vital force of erosion.',
    files: ['01.png', '02.png'],
  },
  {
    id: 'mathlete',
    title: 'Mathlete',
    kicker: 'Computational Thinking & Design',
    text: 'With my team, coded and designed a math game for anyone of any age — specifically targeting primary school children and children with attention difficulties.',
    files: ['01.png'],
    videos: [{ id: '09LWVD_oheU' }],
  },
  {
    id: 'parachute',
    title: 'Humanitarian Parachute',
    kicker: '2D Project',
    text: 'A parachute designed with CAD and physical materials to help deliver humanitarian aid to the people of Myanmar.',
    files: ['01.png', '02.png'],
  },
  {
    id: 'rubber-band-car',
    title: 'Rubber Band Car',
    kicker: '1D Project',
    text: 'A car built with physics, CAD, and prototyping that runs solely on stored energy — no electronics at all.',
    files: ['01.png', '02.png'],
    videos: [{ id: 'yRYwWKuXjUo' }],
  },
  {
    id: 'sutd-cleans',
    title: 'SUTD Cleans',
    kicker: 'Design Thinking Innovation',
    text: 'Led a team creating a new system for SUTD’s cleaning ecosystem: a modular bin and soap sensor linked to an integrated app, helping elderly cleaners work more efficiently and safely. Nominated for two awards: “Technically Robust Design” and “Bouncing Back.”',
    files: ['01.png', '02.jpg'],
  },
  {
    id: 'spatial',
    title: 'Potter, Reparo!',
    kicker: 'Spatial Design World',
    text: 'An architectural module I took in Term 3 to go deeper into Rhino and 3D modelling — producing full section drawings, site isometrics, and room plans.',
    files: ['01.png', '02.png', '03.png', '04.jpg', '05.jpg', '06.gif', '07.gif'],
  },
  {
    id: 'block-box',
    title: 'Block Box',
    kicker: 'Design Thinking Project',
    text: 'A portable, interactive exhibition inspired by old-school Singapore — childhood games, snacks, and HDB blocks. I led the team and creative direction, designing the posters and producing the promotional video.',
    files: ['01.png', '02.jpg', '03.jpg'],
    videos: [{ id: '7_QsfaxuOok' }],
  },
  {
    id: 'fee-fi-fumigation',
    title: 'Fee Fi Fumigation',
    kicker: 'Deep-tech startup',
    text: 'Our deep-tech startup pushing an autonomous fumigation robot to market locally and globally. I lead marketing — pitch decks, website, logos, and branding.',
    files: ['01.png', '02.png', '03.jpg', '04.jpg'],
    videos: [{ id: 'qCTYmuL8Voo' }],
  },
  {
    id: 'root',
    title: 'ROOT Shirt Design',
    kicker: 'Hand-drawn',
    text: 'Hand-drawn by me: the ROOT 13th edition logo and a full comic strip, printed on the official shirt.',
    files: ['01.png', '02.png'],
  },
  {
    id: 'dsutd',
    title: 'DSUTD',
    kicker: 'Media & Marketing',
    text: 'In charge of DSUTD publications — a 4-month project creating videos, posters, and merchandise for freshmen. Kick-started and ran the TikTok page, filming and editing everything myself — 100 followers in the first month, now past 200.',
    files: ['01.png', '02.png', '03.png', '04.png', '05.png'],
  },
  {
    id: 'what-the-hack',
    title: 'What the Hack',
    kicker: 'Hackathon Design Committee',
    text: 'Designed the t-shirts, lanyard, stickers, and Instagram posts for SUTD’s hackathon.',
    files: ['01.png', '02.png', '03.png', '04.png', '05.png'],
  },
  {
    id: 'uld',
    title: 'University Leaders Dialogue 2026',
    kicker: 'Sole design IC',
    text: 'Represented SUTD as the sole member in charge of design — creating the logos, t-shirt, and lanyard for a forum uniting leaders across all 6 Singapore universities (NUS, NTU, SUTD, SMU, SIT, SUSS).',
    files: ['01.png', '02.png', '03.png'],
  },
  {
    id: 'youth-tech-sg',
    title: 'Youth Tech SG',
    kicker: 'Marcomms',
    text: 'Interned under Youth Tech Alliance and Marcomms — designing for the YTSG Mentorship Programme, YTSG Recruitment, CYSAT, and the YouthxSkills Cybersecurity Scholarship, plus stakeholder outreach.',
    files: ['01.png', '02.png', '03.png', '04.png'],
  },
  {
    id: 'platefull',
    title: 'PlateFull',
    kicker: 'My very first startup',
    text: 'A weekly meal-planning app built for Asian families: tell it who’s home each night and it generates a 7-day dinner plan that respects everyone’s dietary constraints — halal, gluten-free, vegetarian, shellfish-free — and matches health goals. Tap any meal for the full recipe, cook step by step, log meals in the food diary, and track your fridge so nothing goes to waste.',
    files: ['01.jpg', '02.jpg', '03.png'],
    videos: [{ id: '0A-jpZvPnD4' }],
    preview: {
      href: '/platefull-app.html',
      device: 'phone',
      caption: 'This is the first draft — not the final product, only a sample. Tap the phone to explore.',
    },
  },
  {
    id: 'loreal-brandstorm',
    title: 'L’Oréal Brandstorm — Empreinte',
    kicker: 'Sustainable perfume concept',
    text: 'Developed and pitched a sustainable perfume concept focused on technology integration, accessibility, and eco-conscious design — including an immersive interactive walkthrough booth for experiential storytelling.',
    files: ['01.png', '02.png', '03.png'],
  },
  {
    id: 'lifty',
    title: 'Lifty',
    kicker: 'Assistive robotics',
    text: 'An ergonomic assistive device enabling hotel housekeepers to make beds without bending or back strain — motorised mattress slider, mecanum wheels, adjustable height, and knee/palm cushioning. I contributed across the full design process: CAD modelling, hardware integration, and product communication.',
    files: [],
    videos: [
      { id: 'Fgaw8gNU2G8', label: 'Lifty Prototype' },
      { id: 'EUVHy4amr48', label: 'Lifty Ad' },
    ],
  },
  {
    id: 'cashi',
    title: 'Cashi',
    kicker: 'AI-powered ATM dashboard',
    text: 'An AI-powered ATM cash replenishment dashboard designed for UOB’s 350-ATM network across Singapore: 7-day proactive scheduling, real-time cash profiling with denomination-level breakdown, geographic van route optimisation, calendar event impact planning, and a live news scenario simulator — powered by a hybrid Holt-Winters + XGBoost model forecasting each ATM’s cash drain up to 2 days ahead, generating an optimised vendor schedule by 4:30PM daily.',
    files: [],
    preview: {
      href: '/cashi.html',
      device: 'laptop',
      caption: 'Click the laptop to explore the live dashboard.',
    },
  },
  {
    id: 'athena',
    title: 'Athena — Urban Space Dashboard',
    kicker: 'Real client · real workflow tool',
    text: 'An AI-powered marketing dashboard designed for a real client — social monitoring, competitor analysis, and AI content generation in one weekly workflow tool. Built the full working interface in 10 hours, animations included.',
    files: [],
    videos: [{ id: '8Dl4zxwASxk' }],
    figma: {
      embed: 'https://embed.figma.com/design/jENwKiDWApuUxlZa8Yw8zy/Urban-Space-Dashboard?node-id=37-2&embed-host=share',
      open: 'https://www.figma.com/design/jENwKiDWApuUxlZa8Yw8zy/Urban-Space-Dashboard?node-id=37-2',
    },
    links: [{ label: 'Full case study →', href: 'https://sites.google.com/view/athena-urbanspace/home' }],
    preview: {
      href: '/athena.html',
      device: 'laptop',
      caption: 'Click the laptop to explore the full dashboard — every page is real and clickable.',
    },
  },
  {
    id: 'bto-ai-mai',
    title: 'BTO Ai Mai',
    kicker: 'HCI · mobile app',
    text: 'A mobile app helping young Singaporean couples financially plan for their Build-To-Order HDB flat — validated and iterated through usability testing and a controlled web experiment.',
    files: [],
    videos: [{ id: 'JUMczhqF__8' }],
    links: [{ label: 'Launch the app ↗', href: 'https://hci-bto.web.app/' }],
    figma: {
      embed: 'https://embed.figma.com/design/ufgRVhaPcRZETiR0iicH70/BTO-Ai-Mai?node-id=0-1&embed-host=share',
      open: 'https://www.figma.com/design/ufgRVhaPcRZETiR0iicH70/BTO-Ai-Mai?node-id=0-1',
    },
    preview: {
      href: 'https://hci-bto.web.app/',
      device: 'phone',
      caption: 'Tap the phone to launch the real app in a new tab.',
    },
  },
  {
    id: 'cura',
    title: 'Cura',
    kicker: 'TU Berlin Winter School',
    text: 'A medicine translator app developed during my entrepreneurship course at TU Berlin’s Winter School. Cura helps people from all walks of life find medicine that suits them — and find the equivalent of what they use back home. In Singapore, a headache means Panadol; on exchange in Canada, what’s the equivalent? Cura tells you, and points you to the nearest store that stocks it.',
    files: ['01.png', '02.png', '03.png', '04.jpg', '05.jpeg'],
  },
]

export const assetBase = '/design-portfolio'
