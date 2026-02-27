export interface Project {
  name: string;
  description: string;
  tech: string;

  // Optional link fields
  link?: string;
  liveLink?: string;

  contributors?: string[];
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
      description: "Research and development of AI solutions for financial text analysis (Sentiment Analysis). Focus on creating datasets and algorithms for predicting stock market trends.",
      tech: "Python, NLP, Machine Learning, TensorFlow",
      contributors: ["Coord. Assist. Prof. Dr. BRICIU Anamaria"],
      display: true,
      date: "2026-02-01",
      status: "wip" as const
    },
    {
      name: "Personal Portfolio (V2)",
      description: "Current professional presentation platform. Includes automated CI/CD with GitHub Actions, Cyberpunk design, and modular Angular structure.",
      tech: "Angular 17, TypeScript, SCSS, GitHub Actions",
      link: "https://github.com/Oti404/portofoliu-personal",
      liveLink: "https://oti404.github.io/portofoliu-personal/", // 🔴 LIVE
      display: true,
      date: "2026-01-15",
      status: "wip" as const
    },
    {
      name: "Smart City Parking System (Hackathon)",
      description: "Digital solution for intelligent public parking management. The system automatically identifies cars using AI (OCR) and verifies subscriptions in real-time.",
      tech: "Angular, Python, AI (OCR)",
      contributors: ["Robert-Lucian Hatos", "Gabriel Pașca", "Cătălin Mirișan"],
      display: true,
      date: "2026-01-27",
      status: "wip" as const
    },
    {
    name: "AI Outfit Recommender (Innovation Labs 2026)",
    description: "AI-powered outfit suggestion system driven by user interaction and reward-based feedback. Developed for the Innovation Labs 2026 Hackathon, it is designed as both a standalone product and a licensable B2B solution for fashion e-commerce to boost sales and interactivity.",
    tech: "Python, AI (Machine Learning / RL), Web/Frontend",
    contributors: ["Robert Hatos", "Gabriel Dumiter", "Carina Faur", "Mara Dorhoi"],
    display: true,
    date: "2026-03-08",
    status: "wip" as const
    },

    // =================================================================
    // 2. COMPLETED / RECENT PROJECTS
    // =================================================================
    {
      name: "Movie World (Globant Internship)",
      description: "Complex movie streaming and cataloging application. Implemented advanced filters, secure authentication, and external API consumption.",
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
      description: "Car management platform developed under the coordination of MHP - A Porsche Company. Features include inventory management and a car configurator.",
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
      description: "Educational project for the Professional Competence Certificate. An interactive platform for learning matrix algorithms and data structures.",
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
