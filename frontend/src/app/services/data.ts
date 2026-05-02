import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor() { }

  public data = {

    profile: {
      name: 'Otniel-Viorel Iacob',
      role: 'Software Developer',
      description: 'Building the future with code. I transform complex ideas into simple, fast, and interactive web applications.',
      photo: 'images/profile-picture.jpg',
      avatar: 'assets/tech-core.webp',
      cvPdf: 'documents/otniel-iacob-cv.pdf',
      location: 'Cluj-Napoca, RO',
      email: 'otniel.contact@gmail.com',
      linkedin: 'https://linkedin.com/in/otniel-iacob',
      github: 'https://github.com/Oti404'
    },

    hobbies:[
      {
      id: 1,
      name: 'PROGRAMMING',
      description: 'Capturarea momentelor speciale prin lentilă.',
      icon: 'assets/hobby/web.png',
      link: 'images/profile-picture.jpg'
    },
    {
      id: 2,
      name: 'ART',
      description: 'Capturarea momentelor speciale prin lentilă.',
      icon: 'assets/hobby/painting.png',
      link: '#'
    },
    {
      id: 3,
      name: 'WRITING',
      description: 'Capturarea momentelor speciale prin lentilă.',
      icon: 'assets/hobby/writing.png',
      link: '#'
    },
    {
      id: 4,
      name: 'TRAVELLING',
      description: 'Capturarea momentelor speciale prin lentilă.',
      icon: 'assets/hobby/world.png',
      link: '#'
    },
    {
      id: 5,
      name: 'SINGING',
      description: 'Capturarea momentelor speciale prin lentilă.',
      icon: 'assets/hobby/microphone.png',
      link: '#'
    },
    {
      id:  6,
      name: 'MECHANICAL AUTOMOBILES',
      description: 'Capturarea momentelor speciale prin lentilă.',
      icon: 'assets/hobby/car.png',
      link: '#'
    },
    {
      id: 7,
      name: 'Sports',
      description: 'Capturarea momentelor speciale prin lentilă.',
      icon: 'assets/hobby/sports.png',
      link: '#'
    },
    {
      id: 8,
      name: 'SELF DEVELOPMENT',
      description: 'Capturarea momentelor speciale prin lentilă.',
      icon: 'assets/hobby/development.png',
      link: '#'
    },
    {
      id: 9,
      name: 'READING',
      description: 'Capturarea momentelor speciale prin lentilă.',
      icon: 'assets/hobby/reading.png',
      link: '#'
    },
  ]
  };
}
