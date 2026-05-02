import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // ─── ADMIN USER ──────────────────────────────────────────────────────────────
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) throw new Error('ADMIN_PASSWORD env variable is required');

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.adminUser.upsert({
    where: { email: 'otnieliacob@gmail.com' },
    update: { passwordHash },
    create: { email: 'otnieliacob@gmail.com', passwordHash },
  });

  // ─── PROFILE ─────────────────────────────────────────────────────────────────
  await prisma.profile.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Otniel-Viorel Iacob',
      role: 'Software Developer',
      description: 'Building the future with code. I transform complex ideas into simple, fast, and interactive web applications.',
      photo: 'images/profile-picture.jpg',
      avatar: 'assets/tech-core.webp',
      cvPdf: 'documents/otniel-iacob-cv.pdf',
      location: 'Cluj-Napoca, RO',
      email: 'otniel.contact@gmail.com',
      linkedin: 'https://linkedin.com/in/otniel-iacob',
      github: 'https://github.com/Oti404',
    },
  });

  // ─── HOBBIES ─────────────────────────────────────────────────────────────────
  const hobbies = [
    { name: 'PROGRAMMING', description: 'Building projects and solving complex problems through code.', icon: 'assets/hobby/web.png', link: '#', order: 1 },
    { name: 'ART', description: 'Expressing creativity through visual art and design.', icon: 'assets/hobby/painting.png', link: '#', order: 2 },
    { name: 'WRITING', description: 'Sharing ideas and stories through the written word.', icon: 'assets/hobby/writing.png', link: '#', order: 3 },
    { name: 'TRAVELLING', description: 'Exploring new cultures, places, and perspectives around the world.', icon: 'assets/hobby/world.png', link: '#', order: 4 },
    { name: 'SINGING', description: 'Expressing emotions and connecting with music through voice.', icon: 'assets/hobby/microphone.png', link: '#', order: 5 },
    { name: 'MECHANICAL AUTOMOBILES', description: 'Fascination with the engineering and mechanics behind automobiles.', icon: 'assets/hobby/car.png', link: '#', order: 6 },
    { name: 'SPORTS', description: 'Staying active and competitive through various physical activities.', icon: 'assets/hobby/sports.png', link: '#', order: 7 },
    { name: 'SELF DEVELOPMENT', description: 'Continuously learning and growing as a person through books and practice.', icon: 'assets/hobby/development.png', link: '#', order: 8 },
    { name: 'READING', description: 'Expanding knowledge and imagination through books and articles.', icon: 'assets/hobby/reading.png', link: '#', order: 9 },
  ];

  for (const hobby of hobbies) {
    await prisma.hobby.upsert({
      where: { id: hobbies.indexOf(hobby) + 1 },
      update: {},
      create: hobby,
    });
  }

  // ─── PROJECTS ────────────────────────────────────────────────────────────────
  const projects = [
    {
      name: 'University Research Project: NLP in Finance',
      description: 'Research and development of AI solutions for financial text analysis, specifically sentiment analysis. Focused on creating robust datasets and algorithms to predict stock market trends.',
      tech: 'Python, NLP, Machine Learning, TensorFlow',
      contributors: [['Coord. Assist. Prof. Dr. BRICIU Anamaria', 'https://www.linkedin.com/in/anamaria-briciu-626109101/']],
      display: true,
      date: new Date('2026-02-01'),
      status: 'wip' as const,
      order: 1,
    },
    {
      name: 'Personal Portfolio (V2)',
      description: 'Current professional portfolio platform featuring a Cyberpunk-inspired design. Implements automated CI/CD pipelines via GitHub Actions and a modular Angular architecture.',
      tech: 'Angular 17, TypeScript, SCSS, GitHub Actions',
      link: 'https://github.com/Oti404/portofoliu-personal',
      liveLink: 'https://oti404.github.io/portofoliu-personal/',
      display: true,
      date: new Date('2026-01-15'),
      status: 'wip' as const,
      order: 2,
    },
    {
      name: 'Smart City Parking System (Hackathon)',
      description: 'Digital solution for intelligent public parking management. Integrates AI-powered Optical Character Recognition (OCR) to automatically identify license plates and verify active subscriptions in real-time.',
      tech: 'Angular, Python, AI (OCR)',
      contributors: [['Robert Hatos', 'https://www.linkedin.com/in/robert-hatos-251598378/'], 'Gabriel Pașca'],
      display: true,
      date: new Date('2026-01-27'),
      status: 'wip' as const,
      order: 3,
    },
    {
      name: 'WearWise (Innovation Labs 2026)',
      description: 'Digital wardrobe platform that helps users organize their clothing inventory, curate outfits, and discover new style combinations using existing wardrobe items.',
      tech: 'React, Web/Frontend, GitHub, Vercel, Lovable, Business, Marketing',
      contributors: [
        ['Robert Hatos', 'https://www.linkedin.com/in/robert-hatos-251598378/'],
        ['Gabriel Dumiter', 'https://www.linkedin.com/in/george-dumiter-647a9a3b5/'],
        ['Carina Faur', 'https://www.linkedin.com/in/carina-faur/'],
        ['Mara Dorhoi', 'https://www.linkedin.com/in/mara-dorhoi-1a32033b5/'],
      ],
      display: true,
      date: new Date('2026-03-08'),
      status: 'wip' as const,
      order: 4,
    },
    {
      name: 'Movie World (Globant Internship)',
      description: 'Complex movie streaming and cataloging application. Features include advanced search filters, secure user authentication, and seamless integration with external APIs.',
      tech: 'Angular, API Integration, RxJS',
      link: 'https://github.com/Oti404/movie-world',
      liveLink: 'https://oti404-movie-world.netlify.app/',
      contributors: ['Vlad Priscu (Globant Mentor)'],
      display: true,
      date: new Date('2025-11-01'),
      endDate: new Date('2026-01-15'),
      status: 'completed' as const,
      order: 5,
    },
    {
      name: 'Car World (MHP Lab)',
      description: 'Car management platform developed under the mentorship of MHP - A Porsche Company. Key features include dynamic inventory management and an interactive car configurator.',
      tech: 'Angular 16+, TypeScript, SCSS',
      link: 'https://github.com/Oti404/car-world',
      liveLink: 'https://oti404.github.io/car-world/',
      contributors: ['MHP - A Porsche Company'],
      display: true,
      date: new Date('2025-11-15'),
      endDate: new Date('2026-01-10'),
      status: 'completed' as const,
      order: 6,
    },
    {
      name: '2D Arrays Educational Platform',
      description: 'Interactive educational platform designed for learning matrix algorithms and data structures, developed for the Professional Competence Certificate.',
      tech: 'HTML, CSS, JavaScript, C++ (Algorithms)',
      link: 'https://github.com/Oti404/website-tablouri_bidimensionale',
      liveLink: 'https://oti404.github.io/website-tablouri_bidimensionale/',
      display: true,
      date: new Date('2024-09-15'),
      endDate: new Date('2025-05-20'),
      status: 'completed' as const,
      order: 7,
    },
    {
      name: 'Weather App',
      description: 'Simple application displaying real-time weather data.',
      tech: 'JavaScript, API Integration',
      display: false,
      date: new Date('2023-10-05'),
      status: 'completed' as const,
      order: 8,
    },
  ];

  for (const project of projects) {
    await prisma.project.upsert({
      where: { id: projects.indexOf(project) + 1 },
      update: {},
      create: project,
    });
  }

  // ─── EXPERIENCE ──────────────────────────────────────────────────────────────
  const experiences = [
    {
      company: 'Innovation Labs 2026',
      role: '3rd Place Winner & Frontend Developer',
      startDate: new Date('2026-03-01'),
      description: [
        '🏆 Secured 3rd Place at the Innovation Labs Cluj-Napoca regional hackathon/pitch.',
        'Developing "WearWise", a digital wardrobe platform for organizing clothing and curating outfits.',
        'Collaborating in a cross-functional team focusing on web development, business strategy, and marketing.',
        'Building a robust MVP for a national entrepreneurship program.',
      ],
      tech: 'React, Web/Frontend, GitHub, Business Strategy',
      type: 'event' as const,
      order: 1,
    },
    {
      company: 'Smart City Hackathon',
      role: 'Participant / Frontend Developer',
      startDate: new Date('2026-01-27'),
      description: [
        'Prototyped a digital solution for intelligent public parking management.',
        'Integrated the frontend with AI-powered OCR for automatic license plate recognition and real-time subscription verification.',
        'Developed a functional MVP under tight time constraints.',
      ],
      tech: 'Angular, Python, AI (OCR)',
      type: 'event' as const,
      order: 2,
    },
    {
      company: 'Globant',
      role: 'Frontend Developer Intern',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2026-01-31'),
      description: [
        'Developed "Movie World", a complex movie streaming and cataloging application.',
        'Integrated seamlessly with external APIs (TMDB) for real-time data fetching and state management.',
        'Implemented advanced search filters, secure authentication, and pagination functionalities.',
        'Focused on application architecture, responsive UI/UX, and asynchronous programming with RxJS.',
      ],
      tech: 'Angular, TypeScript, RxJS, REST API, Git',
      type: 'job' as const,
      order: 3,
    },
    {
      company: 'MHP - A Porsche Company',
      role: 'Mentee / Frontend Developer (MHP Lab)',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2026-01-31'),
      description: [
        'Developed "Car World", a dynamic car management platform under the direct coordination and mentorship of MHP.',
        'Engineered inventory management features and an interactive car configurator.',
        'Applied enterprise-level development standards and component-based architecture.',
      ],
      tech: 'Angular 16+, TypeScript, SCSS, Git',
      type: 'job' as const,
      order: 4,
    },
    {
      company: 'MHP Romania',
      role: 'Technical Workshop Participant',
      startDate: new Date('2024-11-15'),
      endDate: new Date('2024-11-15'),
      description: [
        'Intensive Workshop: "React vs Angular" - Comparative analysis of modern frameworks.',
        'Deep dive into Component-Based Architecture concepts.',
        'First technical contact with development standards within MHP.',
      ],
      tech: 'React, Angular concepts, Frontend Architecture',
      type: 'event' as const,
      order: 5,
    },
    {
      company: 'Principal33',
      role: 'Noaptea Companiilor - Participant',
      startDate: new Date('2024-10-22'),
      endDate: new Date('2024-10-22'),
      description: [
        'First direct interaction with the IT industry in Cluj-Napoca.',
        'Participated in sessions regarding internal projects and organizational culture.',
        'Networked with industry professionals to understand current market demands.',
      ],
      tech: 'Networking, Industry Awareness, Soft Skills',
      type: 'event' as const,
      order: 6,
    },
    {
      company: 'Babeș-Bolyai University',
      role: 'Bachelor Student - Computer Science',
      startDate: new Date('2024-10-01'),
      description: [
        'Researching AI/NLP solutions for financial text analysis and stock market prediction under university coordination.',
        'Semester 1-2: Strong foundation in Data Structures & Algorithms, OOP (C++), OS (Linux), and Math.',
        'Semester 3: Advanced Programming (Java), Databases (SQL), Computer Networks, and Probability.',
      ],
      tech: 'Python, Machine Learning, C++, Java, SQL, Algorithms',
      type: 'education' as const,
      order: 7,
    },
    {
      company: '"Spiru Haret" National Computer Science College',
      role: 'High School Student - Math & Informatics',
      startDate: new Date('2020-09-01'),
      endDate: new Date('2024-06-30'),
      description: [
        'Intensive Mathematics and Informatics specialization.',
        'Developed an interactive "2D Arrays Educational Platform" in HTML/JS/C++ for the Professional Competence Certificate.',
        'Built a solid foundation in Graph Algorithms and Data Structures.',
      ],
      tech: 'C++, HTML, CSS, JavaScript, Algorithms',
      type: 'education' as const,
      order: 8,
    },
    {
      company: 'School in Greece (Elefsina)',
      role: 'Student (International Experience)',
      startDate: new Date('2013-09-01'),
      endDate: new Date('2018-06-30'),
      description: [
        'Integration into an international educational system and adaptation to a new culture.',
        'Developed linguistic skills (Greek - Upper-Intermediate Level).',
        'Gained a multicultural perspective and flexibility in thinking.',
      ],
      tech: 'Greek Language, Adaptability, Intercultural Skills',
      type: 'education' as const,
      order: 9,
    },
  ];

  for (const exp of experiences) {
    await prisma.experience.upsert({
      where: { id: experiences.indexOf(exp) + 1 },
      update: {},
      create: exp,
    });
  }

  // ─── SEMESTERS & SUBJECTS ─────────────────────────────────────────────────────
  const semesters = [
    {
      id: 'sem1', name: 'Semestrul 1', order: 1,
      subjects: [
        { code: 'MLR5005', name: 'Fundamentele programării', passed: true, credits: 6, docPath: '1-FP.pdf' },
        { code: 'MLR5004', name: 'Arhitectura sistemelor de calcul', passed: true, credits: 5, docPath: '1-ASC.pdf' },
        { code: 'MLR0002', name: 'Analiză matematică', passed: true, credits: 5, docPath: '1-AM.pdf' },
        { code: 'MLR0020', name: 'Algebră', passed: true, credits: 5, docPath: '1-A.pdf' },
        { code: 'MLR5055', name: 'Logică computaţională', passed: true, credits: 4, docPath: '1-LC.pdf' },
        { code: 'YLU0011', name: 'Educaţie fizică 1', passed: true, credits: 1 },
      ],
    },
    {
      id: 'sem2', name: 'Semestrul 2', order: 2,
      subjects: [
        { code: 'MLR5006', name: 'Programare orientată obiect', passed: true, credits: 6, docPath: '2-POO.pdf' },
        { code: 'MLR5022', name: 'Structuri de date şi algoritmi', passed: true, credits: 6, docPath: '2-SDA.pdf' },
        { code: 'MLR5007', name: 'Sisteme de operare', passed: true, credits: 5, docPath: '2-SO.pdf' },
        { code: 'MLR0014', name: 'Geometrie', passed: true, credits: 4, docPath: '2-G.pdf' },
        { code: 'MLR0010', name: 'Sisteme dinamice', passed: true, credits: 4, docPath: '2-SD.pdf' },
        { code: 'MLR5025', name: 'Algoritmica grafelor', passed: true, credits: 5, docPath: '2-AG.pdf' },
        { code: 'YLU0012', name: 'Educaţie fizică 2', passed: true, credits: 1 },
      ],
    },
    {
      id: 'sem3', name: 'Semestrul 3', order: 3,
      subjects: [
        { code: 'MLR5008', name: 'Metode avansate de programare', passed: false, credits: 6, docPath: '3-MAP.pdf' },
        { code: 'MLR5027', name: 'Baze de date', passed: false, credits: 6, docPath: '3-BD.pdf' },
        { code: 'MLR5009', name: 'Programare logică și funcțională', passed: true, credits: 5, docPath: '3-PLF.pdf' },
        { code: 'MLR5002', name: 'Rețele de calculatoare', passed: false, credits: 5, docPath: '3-RC.pdf' },
        { code: 'MLR0031', name: 'Probabilităţi şi statistică', passed: false, credits: 5 },
        { code: 'LLU0013', name: 'Limba engleză 1 - specializat', passed: false, credits: 2 },
      ],
    },
    {
      id: 'sem4', name: 'Semestrul 4', order: 4,
      subjects: [
        { code: 'MLR5029', name: 'Inteligență artificială', passed: false, credits: 6, docPath: '4-IA.pdf' },
        { code: 'MLR5015', name: 'Programare Web', passed: false, credits: 6, docPath: '4-PW.pdf' },
        { code: 'MLR5011', name: 'Ingineria sistemelor soft', passed: false, credits: 5, docPath: '4-ISS.pdf' },
        { code: 'MLR5028', name: 'Sisteme de gestiune a bazelor de date', passed: false, credits: 5, docPath: '4-SGBD.pdf' },
        { code: 'MLR5013', name: 'Medii de proiectare și programare', passed: false, credits: 4, docPath: '4-MPP.pdf' },
        { code: 'LLU0014', name: 'Limba engleză 2 - specializat', passed: false, credits: 2 },
      ],
    },
    {
      id: 'sem5', name: 'Semestrul 5', order: 5,
      subjects: [
        { code: 'MLR5023', name: 'Limbaje formale și tehnici de compilare', passed: false, credits: 5 },
        { code: 'MLR7001', name: 'Practică', passed: false, credits: 6 },
        { code: 'MLR5077', name: 'Programare paralelă și distribuită', passed: false, credits: 5 },
        { code: 'MLR5078', name: 'Programare pentru dispozitive mobile', passed: false, credits: 4 },
        { code: 'MLR5067', name: 'Metode inteligente de rezolvare a problemelor', passed: false, credits: 4 },
        { code: 'MLR0044', name: 'Aplicaţii ale geometriei în informatică', passed: false, credits: 4 },
        { code: 'MLR5044', name: 'Instrumente CASE', passed: false, credits: 4 },
        { code: 'MLR5048', name: 'Interacţiunea om-calculator', passed: false, credits: 4 },
        { code: 'MLR8114', name: 'Securitate software', passed: false, credits: 4 },
        { code: 'MLR5012', name: 'Proiect colectiv', passed: false, credits: 2 },
        { code: 'MLR5161', name: 'Proiect de cercetare', passed: false, credits: 2 },
      ],
    },
    {
      id: 'sem6', name: 'Semestrul 6', order: 6,
      subjects: [
        { code: 'MLR5014', name: 'Verificarea şi validarea sistemelor soft', passed: false, credits: 7 },
        { code: 'MLR0028', name: 'Calcul numeric', passed: false, credits: 7 },
        { code: 'MLR2001', name: 'Elaborarea lucrării de licență', passed: false, credits: 3 },
        { code: 'MLR5039', name: 'Fundamentele limbajelor de programare', passed: false, credits: 5 },
        { code: 'MLR5060', name: 'Grafică pe calculator', passed: false, credits: 5 },
        { code: 'MLR5091', name: 'Dezvoltarea de jocuri', passed: false, credits: 5 },
        { code: 'MLR5074', name: 'Business Intelligence', passed: false, credits: 5 },
        { code: 'MLR5155', name: 'Modele de AI în schimbarea climatică', passed: false, credits: 5 },
        { code: 'MLR0005', name: 'Tehnici de optimizare', passed: false, credits: 5 },
        { code: 'MLR5063', name: 'Tehnici de realizare a sistemelor inteligente', passed: false, credits: 5 },
        { code: 'MLR8112', name: 'Gestiunea proiectelor soft', passed: false, credits: 5 },
        { code: 'MLR5156', name: 'Învățare interactivă', passed: false, credits: 5 },
        { code: 'MLR5163', name: 'Limbaje de programare multi-paradigmă', passed: false, credits: 5 },
        { code: 'MLR2006', name: 'Istoria matematicii', passed: false, credits: 3 },
        { code: 'MLR7007', name: 'Istoria informaticii', passed: false, credits: 3 },
        { code: 'FEULR01', name: 'Fundamente de educație umanistă', passed: false, credits: 3 },
        { code: 'FAULR02', name: 'Fundamente de antreprenoriat', passed: false, credits: 3 },
      ],
    },
  ];

  for (const sem of semesters) {
    await prisma.semester.upsert({
      where: { id: sem.id },
      update: {},
      create: { id: sem.id, name: sem.name, order: sem.order },
    });

    for (const subject of sem.subjects) {
      await prisma.subject.upsert({
        where: { code: subject.code },
        update: {},
        create: { ...subject, semesterId: sem.id },
      });
    }
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
