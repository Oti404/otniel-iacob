import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { ApiResponse, Profile, Project, Experience, Semester, Hobby } from '@monorepo/shared';

/**
 * Public portfolio content. Each endpoint is fetched once per page load and
 * shared, so sections that need the same data (profile is read by four of them)
 * don't each make their own request.
 */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private http = inject(HttpClient);

  private readonly profile$ = this.cached<Profile>('/api/profile');
  private readonly projects$ = this.cached<Project[]>('/api/projects');
  private readonly experience$ = this.cached<Experience[]>('/api/experience');
  private readonly semesters$ = this.cached<Semester[]>('/api/semesters');
  private readonly hobbies$ = this.cached<Hobby[]>('/api/hobbies');

  getProfile() { return this.profile$; }
  getProjects() { return this.projects$; }
  getExperience() { return this.experience$; }
  getSemesters() { return this.semesters$; }
  getHobbies() { return this.hobbies$; }

  private cached<T>(url: string): Observable<T> {
    return this.http.get<ApiResponse<T>>(url).pipe(
      map((r) => r.data),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }
}
