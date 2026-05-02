export interface Subject {
  code: string;
  name: string;
  passed: boolean;
  credits: number;
  docPath?: string; // Câmp opțional nou pentru PDF
}

export interface Semester {
  semester: string;
  id: string;
  subjects: Subject[];
}

export const ACADEMIC_DATA: Semester[] = [
  {
    semester: "Semestrul 1",
    id: "sem1",
    subjects: [
      { code: "MLR5005", name: "Fundamentele programării", passed: true, credits: 6, docPath: "1-FP.pdf" },
      { code: "MLR5004", name: "Arhitectura sistemelor de calcul", passed: true, credits: 5, docPath: "1-ASC.pdf" },
      { code: "MLR0002", name: "Analiză matematică", passed: true, credits: 5, docPath: "1-AM.pdf" },
      { code: "MLR0020", name: "Algebră", passed: true, credits: 5, docPath: "1-A.pdf" },
      { code: "MLR5055", name: "Logică computaţională", passed: true, credits: 4, docPath: "1-LC.pdf" },
      { code: "YLU0011", name: "Educaţie fizică 1", passed: true, credits: 1 } // Fără PDF
    ]
  },
  {
    semester: "Semestrul 2",
    id: "sem2",
    subjects: [
      { code: "MLR5006", name: "Programare orientată obiect", passed: true, credits: 6, docPath: "2-POO.pdf" },
      { code: "MLR5022", name: "Structuri de date şi algoritmi", passed: true, credits: 6, docPath: "2-SDA.pdf" },
      { code: "MLR5007", name: "Sisteme de operare", passed: true, credits: 5, docPath: "2-SO.pdf" },
      { code: "MLR0014", name: "Geometrie", passed: true, credits: 4, docPath: "2-G.pdf" },
      { code: "MLR0010", name: "Sisteme dinamice", passed: true, credits: 4, docPath: "2-SD.pdf" },
      { code: "MLR5025", name: "Algoritmica grafelor", passed: true, credits: 5, docPath: "2-AG.pdf" },
      { code: "YLU0012", name: "Educaţie fizică 2", passed: true, credits: 1 }
    ]
  },
  {
    semester: "Semestrul 3",
    id: "sem3",
    subjects: [
      { code: "MLR5008", name: "Metode avansate de programare", passed: false, credits: 6, docPath: "3-MAP.pdf" },
      { code: "MLR5027", name: "Baze de date", passed: false, credits: 6, docPath: "3-BD.pdf" },
      { code: "MLR5009", name: "Programare logică și funcțională", passed: true, credits: 5, docPath: "3-PLF.pdf" },
      { code: "MLR5002", name: "Rețele de calculatoare", passed: false, credits: 5, docPath: "3-RC.pdf" },
      { code: "MLR0031", name: "Probabilităţi şi statistică", passed: false, credits: 5 }, // Nu apare în listă
      { code: "LLU0013", name: "Limba engleză 1 - specializat", passed: false, credits: 2 }
    ]
  },
  {
    semester: "Semestrul 4",
    id: "sem4",
    subjects: [
      { code: "MLR5029", name: "Inteligență artificială", passed: false, credits: 6, docPath: "4-IA.pdf" },
      { code: "MLR5015", name: "Programare Web", passed: false, credits: 6, docPath: "4-PW.pdf" },
      { code: "MLR5011", name: "Ingineria sistemelor soft", passed: false, credits: 5, docPath: "4-ISS.pdf" },
      { code: "MLR5028", name: "Sisteme de gestiune a bazelor de date", passed: false, credits: 5, docPath: "4-SGBD.pdf" },
      { code: "MLR5013", name: "Medii de proiectare și programare", passed: false, credits: 4, docPath: "4-MPP.pdf" },
      { code: "LLU0014", name: "Limba engleză 2 - specializat", passed: false, credits: 2 }
    ]
  },
  // Semestrele 5 și 6 rămân momentan fără PDF-uri mapate, dar structura e pregătită
  {
      semester: "Semestrul 5",
      id: "sem5",
      subjects: [
          { code: "MLR5023", name: "Limbaje formale și tehnici de compilare", passed: false, credits: 5 },
          { code: "MLR7001", name: "Practică", passed: false, credits: 6 },
          { code: "MLR5077", name: "Programare paralelă și distribuită", passed: false, credits: 5 },
          { code: "MLR5078", name: "Programare pentru dispozitive mobile", passed: false, credits: 4 },
          { code: "MLR5067", name: "Metode inteligente de rezolvare a problemelor", passed: false, credits: 4 },
          { code: "MLR0044", name: "Aplicaţii ale geometriei în informatică", passed: false, credits: 4 },
          { code: "MLR5044", name: "Instrumente CASE", passed: false, credits: 4 },
          { code: "MLR5048", name: "Interacţiunea om-calculator", passed: false, credits: 4 },
          { code: "MLR8114", name: "Securitate software", passed: false, credits: 4 },
          { code: "MLR5012", name: "Proiect colectiv", passed: false, credits: 2 },
          { code: "MLR5161", name: "Proiect de cercetare", passed: false, credits: 2 }
      ]
  },
  {
      semester: "Semestrul 6",
      id: "sem6",
      subjects: [
          { code: "MLR5014", name: "Verificarea şi validarea sistemelor soft", passed: false, credits: 7 },
          { code: "MLR0028", name: "Calcul numeric", passed: false, credits: 7 },
          { code: "MLR2001", name: "Elaborarea lucrării de licență", passed: false, credits: 3 },
          { code: "MLR5039", name: "Fundamentele limbajelor de programare", passed: false, credits: 5 },
          { code: "MLR5060", name: "Grafică pe calculator", passed: false, credits: 5 },
          { code: "MLR5091", name: "Dezvoltarea de jocuri", passed: false, credits: 5 },
          { code: "MLR5074", name: "Business Intelligence", passed: false, credits: 5 },
          { code: "MLR5155", name: "Modele de AI în schimbarea climatică", passed: false, credits: 5 },
          { code: "MLR0005", name: "Tehnici de optimizare", passed: false, credits: 5 },
          { code: "MLR5063", name: "Tehnici de realizare a sistemelor inteligente", passed: false, credits: 5 },
          { code: "MLR8112", name: "Gestiunea proiectelor soft", passed: false, credits: 5 },
          { code: "MLR5156", name: "Învățare interactivă", passed: false, credits: 5 },
          { code: "MLR5163", name: "Limbaje de programare multi-paradigmă", passed: false, credits: 5 },
          { code: "MLR2006", name: "Istoria matematicii", passed: false, credits: 3 },
          { code: "MLR7007", name: "Istoria informaticii", passed: false, credits: 3 },
          { code: "FEULR01", name: "Fundamente de educație umanistă", passed: false, credits: 3 },
          { code: "FAULR02", name: "Fundamente de antreprenoriat", passed: false, credits: 3 }
      ]
  }
];
