export interface Experience {
  company: string;
  role: string;
  period: string;
  description: string[];
  tech: string;
  type: 'job' | 'education' | 'event';
}

export const experienceData: Experience[] = [
  {
    company: 'Innovation Labs 2026',
    role: '3rd Place Winner & Frontend Developer',
    period: 'Mar 2026 - Present',
    description: [
      '🏆 Secured 3rd Place at the Innovation Labs Cluj-Napoca regional hackathon/pitch.',
      'Developing "WearWise", a digital wardrobe platform for organizing clothing and curating outfits.',
      'Collaborating in a cross-functional team focusing on web development, business strategy, and marketing.',
      'Building a robust MVP for a national entrepreneurship program.'
    ],
    tech: 'React, Web/Frontend, GitHub, Business Strategy',
    type: 'event'
  },
  {
    company: 'Smart City Hackathon',
    role: 'Participant / Frontend Developer',
    period: 'Jan 2026 - Present',
    description: [
      'Prototyped a digital solution for intelligent public parking management.',
      'Integrated the frontend with AI-powered OCR for automatic license plate recognition and real-time subscription verification.',
      'Developed a functional MVP under tight time constraints.'
    ],
    tech: 'Angular, Python, AI (OCR)',
    type: 'event'
  },
  {
    company: 'Globant',
    role: 'Frontend Developer Intern',
    period: 'Nov 2025 - Jan 2026',
    description: [
      'Developed "Movie World", a complex movie streaming and cataloging application.',
      'Integrated seamlessly with external APIs (TMDB) for real-time data fetching and state management.',
      'Implemented advanced search filters, secure authentication, and pagination functionalities.',
      'Focused on application architecture, responsive UI/UX, and asynchronous programming with RxJS.'
    ],
    tech: 'Angular, TypeScript, RxJS, REST API, Git',
    type: 'job'
  },
  {
    company: 'MHP - A Porsche Company',
    role: 'Mentee / Frontend Developer (MHP Lab)',
    period: 'Nov 2025 - Jan 2026',
    description: [
      'Developed "Car World", a dynamic car management platform under the direct coordination and mentorship of MHP.',
      'Engineered inventory management features and an interactive car configurator.',
      'Applied enterprise-level development standards and component-based architecture.'
    ],
    tech: 'Angular 16+, TypeScript, SCSS, Git',
    type: 'job'
  },
  {
    company: 'MHP Romania',
    role: 'Technical Workshop Participant',
    period: 'Nov 15, 2024',
    description: [
      'Intensive Workshop: "React vs Angular" - Comparative analysis of modern frameworks.',
      'Deep dive into Component-Based Architecture concepts.',
      'First technical contact with development standards within MHP.'
    ],
    tech: 'React, Angular concepts, Frontend Architecture',
    type: 'event'
  },
  {
    company: 'Principal33',
    role: 'Noaptea Companiilor - Participant',
    period: 'Oct 22, 2024',
    description: [
      'First direct interaction with the IT industry in Cluj-Napoca.',
      'Participated in sessions regarding internal projects and organizational culture.',
      'Networked with industry professionals to understand current market demands.'
    ],
    tech: 'Networking, Industry Awareness, Soft Skills',
    type: 'event'
  },
  {
    company: 'Babeș-Bolyai University',
    role: 'Bachelor Student - Computer Science',
    period: 'Oct 2024 - Present',
    description: [
      'Researching AI/NLP solutions for financial text analysis and stock market prediction under university coordination.',
      'Semester 1-2: Strong foundation in Data Structures & Algorithms, OOP (C++), OS (Linux), and Math.',
      'Semester 3: Advanced Programming (Java), Databases (SQL), Computer Networks, and Probability.'
    ],
    tech: 'Python, Machine Learning, C++, Java, SQL, Algorithms',
    type: 'education'
  },
  {
    company: '"Spiru Haret" National Computer Science College',
    role: 'High School Student - Math & Informatics',
    period: '2020 - 2024',
    description: [
      'Intensive Mathematics and Informatics specialization.',
      'Developed an interactive "2D Arrays Educational Platform" in HTML/JS/C++ for the Professional Competence Certificate.',
      'Built a solid foundation in Graph Algorithms and Data Structures.'
    ],
    tech: 'C++, HTML, CSS, JavaScript, Algorithms',
    type: 'education'
  },
  {
    company: 'School in Greece (Elefsina)',
    role: 'Student (International Experience)',
    period: '2013 - 2018',
    description: [
      'Integration into an international educational system and adaptation to a new culture.',
      'Developed linguistic skills (Greek - Upper-Intermediate Level).',
      'Gained a multicultural perspective and flexibility in thinking.'
    ],
    tech: 'Greek Language, Adaptability, Intercultural Skills',
    type: 'education'
  }
];