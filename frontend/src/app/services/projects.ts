export interface Project {
  name: string;
  description: string;
  tech: string;

  // Optional link fields
  link?: string;
  liveLink?: string;

  contributors?: (string | [string, string])[];
  awards?: string;
  display: boolean;

  date: string;
  endDate?: string;
  status: 'completed' | 'wip';
}

export const academicData = {
  projects: [
    // =================================================================
    // 1. WORK IN PROGRESS (WIP)
    // =================================================================
    {
      name: "University Research Project: NLP in Finance",
      description: "Research and development of AI solutions for financial text analysis, specifically sentiment analysis. Focused on creating robust datasets and algorithms to predict stock market trends.",
      tech: "Python, NLP, Machine Learning, TensorFlow",
      contributors: [["Coord. Assist. Prof. Dr. BRICIU Anamaria", "https://www.linkedin.com/in/anamaria-briciu-626109101/"]],
      display: true,
      date: "2026-02-01",
      status: "wip" as const
    },
    {
      name: "Personal Portfolio (V2)",
      description: "Current professional portfolio platform featuring a Cyberpunk-inspired design. Implements automated CI/CD pipelines via GitHub Actions and a modular Angular architecture.",
      tech: "Angular 17, TypeScript, SCSS, GitHub Actions",
      link: "https://github.com/Oti404/portofoliu-personal",
      liveLink: "https://oti404.github.io/portofoliu-personal/", // 🔴 LIVE
      display: true,
      date: "2026-01-15",
      status: "wip" as const
    },
    {
      name: "Smart City Parking System (Hackathon)",
      description: "Digital solution for intelligent public parking management. Integrates AI-powered Optical Character Recognition (OCR) to automatically identify license plates and verify active subscriptions in real-time.",
      tech: "Angular, Python, AI (OCR)",
      contributors: [["Robert Hatos", "https://www.linkedin.com/in/robert-hatos-251598378/"], "Gabriel Pașca"],
      display: true,
      date: "2026-01-27",
      status: "wip" as const
    },
    {
      name: "WearWise (Innovation Labs 2026)",
      description: "Digital wardrobe platform that helps users organize their clothing inventory, curate outfits, and discover new style combinations using existing wardrobe items.",
      tech: "React, Web/Frontend, GitHub, Vercel, Lovable, Business, Marketing",
      contributors: [
        ["Robert Hatos", "https://www.linkedin.com/in/robert-hatos-251598378/"], 
        ["Gabriel Dumiter", "https://www.linkedin.com/in/george-dumiter-647a9a3b5/"], 
        ["Carina Faur", "https://www.linkedin.com/in/carina-faur/"], 
        ["Mara Dorhoi", "https://www.linkedin.com/in/mara-dorhoi-1a32033b5/"]
      ],
      display: true,
      date: "2026-03-08",
      status: "wip" as const
    },

    // =================================================================
    // 2. COMPLETED / RECENT PROJECTS
    // =================================================================
    {
      name: "Movie World (Globant Internship)",
      description: "Complex movie streaming and cataloging application. Features include advanced search filters, secure user authentication, and seamless integration with external APIs.",
      tech: "Angular, API Integration, RxJS",
      link: "https://github.com/Oti404/movie-world",
      liveLink: "https://oti404-movie-world.netlify.app/", // 🔴 LIVE
      contributors: ["Vlad Priscu (Globant Mentor)"],
      display: true,
      date: "2025-11-01",
      endDate: "2026-01-15",
      status: "completed" as const
    },
    {
      name: "Car World (MHP Lab)",
      description: "Car management platform developed under the mentorship of MHP - A Porsche Company. Key features include dynamic inventory management and an interactive car configurator.",
      tech: "Angular 16+, TypeScript, SCSS",
      link: "https://github.com/Oti404/car-world",
      liveLink: "https://oti404.github.io/car-world/", // 🔴 LIVE
      display: true,
      contributors: ["MHP - A Porsche Company"],
      date: "2025-11-15",
      endDate: "2026-01-10",
      status: "completed" as const
    },
    {
      name: "2D Arrays Educational Platform",
      description: "Interactive educational platform designed for learning matrix algorithms and data structures, developed for the Professional Competence Certificate.",
      tech: "HTML, CSS, JavaScript, C++ (Algorithms)",
      link: "https://github.com/Oti404/website-tablouri_bidimensionale",
      liveLink: "https://oti404.github.io/website-tablouri_bidimensionale/", // 🔴 LIVE
      display: true,
      date: "2024-09-15",
      endDate: "2025-05-20",
      status: "completed" as const
    },

    // =================================================================
    // 3. ARCHIVED / HIDDEN PROJECTS
    // =================================================================
    {
      name: 'Weather App',
      description: 'Simple application displaying real-time weather data.',
      tech: 'JavaScript, API Integration',
      display: false, // Hidden
      date: "2023-10-05",
      status: "completed" as const
    }
  ]
};