// ============================================================
//  YOUR PORTFOLIO CONTENT — this is the only file you need to
//  edit to change what your portfolio says.
//  Anything marked ✏️ is a placeholder waiting for your words.
// ============================================================

export const profile = {
  name: 'ALENA',
  callsign: 'PORTFOLIO ONE', // your "mission name", shows in the HUD
  tagline: 'Major in Design & AI · Minor in Psychology and Business Management · Minor in Computer Science',
  // Put a photo of yourself named me.jpg inside the /public folder
  // and it will appear automatically in the Sun panel.
  photo: '/me.jpg',
}

export const sections = {
  sun: {
    num: '01',
    title: 'The Sun',
    label: 'About Me',
    tagline: 'Commander profile · mission briefing',
    photo: true,
    blocks: [
      {
        heading: 'Hello, traveller',
        text: "Hi, I'm Alena! I am a Design and AI major at SUTD, double minoring in Computer Science and Business Management with Psychology. I love trying new things and pushing myself to the maximum, whether that's getting hands-on with a prototype or pitching to a room full of people. I've co-founded a nutrition app, helped build an autonomous fumigation robot that won a national deep-tech competition, and spent way too many late nights turning messy data into stories people actually want to hear. When I care about something, I go all in (ambitious is an understatement).",
      },
      {
        heading: 'Dream missions',
        list: [
          'Project manager for a mission I care about — I love leading',
          'Product designer / UI-UX designer',
          'Innovation strategist or tech consultant',
          'Marketing director',
          'Founder of my own venture',
        ],
      },
      {
        heading: 'Education',
        entries: [
          {
            title: 'Singapore University of Technology and Design',
            meta: 'BSc in Design and Artificial Intelligence, Specialising in Enterprise Design · 2024 – 2028',
            detail: 'Minors in Computer Science, Business Management, and Psychology · SUTD-Meriban Scholar',
          },
          {
            title: 'RMIT Melbourne',
            meta: 'Student Exchange Programme · Feb – Jun 2027',
          },
          {
            title: 'Technological University Berlin',
            meta: 'Winter School, Entrepreneurship · Jan 2026',
          },
          {
            title: 'Dunman High School',
            meta: 'A Levels, Integrated Programme · 2018 – 2023',
          },
        ],
      },
      {
        heading: 'How to reach me',
        entries: [
          {
            title: 'Email',
            meta: 'email2alenalim@gmail.com',
            link: 'mailto:email2alenalim@gmail.com',
          },
          {
            title: 'LinkedIn',
            meta: 'linkedin.com/in/alena-lim-9aa7762a9',
            link: 'https://www.linkedin.com/in/alena-lim-9aa7762a9/',
          },
        ],
      },
      {
        heading: 'Transmission',
        text: "You only live once. Try everything, regret nothing. Say hi — I'm always up for something new.",
      },
    ],
  },

  saturn: {
    num: '02',
    title: 'Saturn',
    label: 'Work Experience',
    tagline: 'Professional flight log',
    blocks: [
      {
        heading: 'Work experience',
        entries: [
          {
            title: 'Innovation Strategist & AI Design Solutions Intern — United Overseas Bank (UOB)',
            meta: 'Sep 2026 – Jan 2027 · Singapore',
            detail:
              'Designing and prototyping AI-driven solutions for real business challenges, supporting partnership outreach, and translating complex tech into narratives stakeholders actually understand.',
          },
          {
            title: 'Data Engineer Intern — Energy Market Authority, Power Systems Operations',
            meta: 'Sep 2025 – Dec 2025 · Singapore',
            detail:
              'Built a data automation system for nationwide solar energy data — automating the analysis and calculations that previously had to be done manually. Turned complex power systems data into insights the division could actually act on.',
          },
          {
            title: 'Partnerships & Marketing Lead — Youth Tech Singapore',
            meta: 'Oct 2025 – Jun 2026 · Singapore',
            detail:
              'Built partnerships with schools, youth organisations, and industry partners. Led marketing campaigns that grew community engagement and coordinated sponsors across events and initiatives.',
          },
          {
            title: 'Dance Teacher — The Academy of Dance & Freelance',
            meta: '2021 – Present · Singapore',
            detail:
              'Certified teacher with the Royal Academy of Dance. Five years teaching students of all ages and walks of life, four freelance, one at The Academy of Dance. Learnt how to adapt to every kind of learner in the room, even parents!',
          },
        ],
      },
    ],
  },

  moon: {
    num: '03',
    title: 'The Moon',
    label: 'Projects & Ventures',
    tagline: 'Things I have built and am building',
    blocks: [
      {
        heading: 'Projects',
        entries: [
          {
            title: 'Fee Fi Fumigation',
            meta: 'Award-winning fumigation robot',
            role: 'Project lead & co-founder · marketing director · designer · lead pitcher',
            videos: [{ id: 'qCTYmuL8Voo' }],
            detail:
              'Co-founded a deep-tech startup building an autonomous fumigation robot. Won 1st place at Deep Dive Singapore against 40 teams, then took it to the international quarter-finals in Helsinki — pitching to investors and global teams along the way. I led branding, presentations, and coordination.',
          },
          {
            title: 'Athena — AI Marketing Dashboard',
            meta: 'Real client, real workflow tool',
            role: 'Project lead · lead UI/UX designer · AI design solutions — bridging client, design and tech team',
            videos: [{ id: '8Dl4zxwASxk' }],
            detail:
              'Designed an AI-powered marketing dashboard for a real client — social monitoring, competitor analysis, and AI content generation rolled into one weekly workflow tool. Built the full working interface in 10 hours, animations included.',
            mockups: [
              {
                type: 'laptop',
                iframe: '/athena.html',
                href: '/athena.html',
                caption: 'Click to explore the full dashboard — every page is real and clickable.',
              },
              {
                type: 'browser',
                image: '/athena-case-study.png',
                href: 'https://sites.google.com/view/athena-urbanspace/home',
                url: 'athena-urbanspace · full case study',
                hint: 'OPEN THE CASE STUDY ↗',
                caption:
                  'Click the window to read the full Athena case study — the research, the design journey, and the team behind it.',
              },
            ],
          },
          {
            title: 'BTO Ai Mai',
            meta: 'Financial planning for young couples',
            role: 'UI/UX design lead',
            videos: [{ id: 'JUMczhqF__8' }],
            detail:
              'A mobile app helping young Singaporean couples plan financially for their BTO flat. Designed, tested, and iterated through usability testing and a controlled web experiment.',
            mockup: {
              type: 'phone',
              // drop bto-ai-mai-screen.png into /public and it will show on
              // the phone; until then the phone shows the live app itself
              image: '/bto-ai-mai-screen.png',
              iframe: 'https://hci-bto.web.app/',
              href: 'https://hci-bto.web.app/',
              caption:
                "Tap the phone to launch the real app. Create an account with your actual Gmail and verify via the link (check your junk folder!). Don't worry — we don't collect data.",
            },
          },
          {
            title: 'Part the Plate',
            meta: 'Recipes matched to your skill level',
            role: 'Solo project — every pixel designed and every line coded by me',
            videos: [{ id: 'MjtnwZV0BCI' }],
            detail:
              'An HCI project that splits cooking recipes by skill level and age group — so a 10-year-old and a seasoned home cook can make the same dish, each with steps pitched at their level. Built with Claude as part of the design and development workflow.',
          },
          {
            title: 'Lifty',
            meta: 'Robot that changes bedsheets',
            role: '3D modelling · robotics & electronics · slide and poster design · client comms',
            videos: [
              { id: 'EUVHy4amr48', label: 'The Ad' },
              { id: 'Fgaw8gNU2G8', label: 'Instruction Video' },
            ],
            detail:
              'Co-developed an autonomous robot that reduces physical strain during bedsheet changing — a real workplace problem, tackled in collaboration with LionsBot International. Led design, user research, and prototyping.',
          },
          {
            title: 'Block Box',
            meta: "Singapore's heritage, packed to go",
            role: 'Designer · prototyper · builder — from concept sketches to the hands-on build',
            videos: [{ id: '7_QsfaxuOok' }],
            detail:
              "A portable, interactive exhibition built for my Spatial Design (architecture) module — drawing inspiration from old-school Singapore: childhood games, snacks, and HDB blocks. A love letter to Singapore's cultural heritage that connects design, innovation, and hands-on prototyping.",
          },
          {
            title: 'SUTD Cleans',
            meta: 'Closed-loop cleaning system',
            role: 'Project lead · 3D modelling · design',
            detail:
              'Led a team designing a hardware + AI cleaning system to make SUTD cleaners’ work safer and more efficient. Nominated for "Most Technically Robust Design."',
          },
        ],
      },
      {
        heading: 'Ventures in development',
        entries: [
          {
            title: 'PlateFull',
            meta: 'In development',
            videos: [{ id: '0A-jpZvPnD4' }],
            detail:
              "A nutrition app that actually understands Asian food. Meal recommendations tailored to Asian cuisines and eating habits — because healthy eating shouldn't mean giving up the food you grew up with. Co-founder and overall lead, backed by SUTD's Baby Shark Fund.",
          },
        ],
      },
    ],
  },

  galaxy: {
    num: '04',
    title: 'The Milky Way',
    label: 'Skills & Achievements',
    tagline: 'A hundred billion stars, a few good skills',
    blocks: [
      {
        heading: 'Skills',
        list: [
          'Technical — Python, Pseudocode, Excel Macros, Power Query, Microsoft Office, Hardware (ESP32, Arduino)',
          'Design — Rhino3D, Fusion, Figma, Canva, CapCut, Adobe Photoshop, Adobe Illustrator, Wix, Claude Design',
          'Others — UI/UX Design, Product Prototyping (Hardware & Software), Public Speaking, Pitching, Business Strategy, Marketing',
        ],
      },
      {
        heading: 'Achievements',
        list: [
          'SUTD-Meriban Scholarship 2026',
          'SUTD Student Life Awards — SUTD Student Service Excellence Award 2025',
          'SUTD Baby Shark Fund Awardee (Mar 2025 – Sep 2025) — S$6,000 for Project BOA',
          'SUTD Baby Shark Fund Awardee (Apr 2026 – Aug 2026) — S$2,000 for PlateFull',
          'Deep Dive Singapore Winner (Jan 2025) — 1st Place, Deep-tech Commercialisation Challenge',
          'Deep Dive Finland Finalist (Apr 2025) — International Quarter-Finalist (Aalto University, Helsinki)',
          'SUTD Special Award 2024',
          'Edusave Achievement, Good Leadership and Service (EAGLES) 2023, 2016',
          'Head of SUTD ROOT Media and Marketing',
          'Royal Academy of Dance — Certified Dance Teacher',
        ],
      },
    ],
  },

  jupiter: {
    num: '05',
    title: 'Jupiter',
    label: 'Design Portfolio',
    tagline: "Alena's Design Chronicles — an enchanted storybook",
    // Jupiter doesn't use the standard panel — clicking it opens the
    // interactive storybook (src/DesignBook.jsx + src/designContent.js).
    blocks: [],
  },
}

export const sectionOrder = ['sun', 'saturn', 'moon', 'galaxy', 'jupiter']
