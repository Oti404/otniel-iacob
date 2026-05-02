import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { ApiResponse, Profile, Project, Experience, Semester, Hobby } from '@monorepo/shared';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private http = inject(HttpClient);

  getProfile() {
    return this.http.get<ApiResponse<Profile>>('/api/profile').pipe(map((r) => r.data));
  }

  getProjects() {
    return this.http.get<ApiResponse<Project[]>>('/api/projects').pipe(map((r) => r.data));
  }

  getExperience() {
    return this.http.get<ApiResponse<Experience[]>>('/api/experience').pipe(map((r) => r.data));
  }

  getSemesters() {
    return this.http.get<ApiResponse<Semester[]>>('/api/semesters').pipe(map((r) => r.data));
  }

  getHobbies() {
    return this.http.get<ApiResponse<Hobby[]>>('/api/hobbies').pipe(map((r) => r.data));
  }
}
