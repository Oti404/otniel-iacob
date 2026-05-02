import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, Profile, Project, Experience, Semester, Hobby, Subject } from '@monorepo/shared';

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  private http = inject(HttpClient);

  updateProfile(data: Partial<Profile>): Observable<Profile> {
    return this.http.put<ApiResponse<Profile>>('/api/admin/profile', data).pipe(map((r) => r.data));
  }

  // ─── PROJECTS ────────────────────────────────────────────────────────────────
  createProject(data: Partial<Project>): Observable<Project> {
    return this.http.post<ApiResponse<Project>>('/api/admin/projects', data).pipe(map((r) => r.data));
  }
  updateProject(id: number, data: Partial<Project>): Observable<Project> {
    return this.http.put<ApiResponse<Project>>(`/api/admin/projects/${id}`, data).pipe(map((r) => r.data));
  }
  deleteProject(id: number): Observable<{ id: number }> {
    return this.http.delete<ApiResponse<{ id: number }>>(`/api/admin/projects/${id}`).pipe(map((r) => r.data));
  }

  // ─── EXPERIENCE ──────────────────────────────────────────────────────────────
  createExperience(data: Partial<Experience>): Observable<Experience> {
    return this.http.post<ApiResponse<Experience>>('/api/admin/experience', data).pipe(map((r) => r.data));
  }
  updateExperience(id: number, data: Partial<Experience>): Observable<Experience> {
    return this.http.put<ApiResponse<Experience>>(`/api/admin/experience/${id}`, data).pipe(map((r) => r.data));
  }
  deleteExperience(id: number): Observable<{ id: number }> {
    return this.http.delete<ApiResponse<{ id: number }>>(`/api/admin/experience/${id}`).pipe(map((r) => r.data));
  }

  // ─── HOBBIES ─────────────────────────────────────────────────────────────────
  createHobby(data: Partial<Hobby>): Observable<Hobby> {
    return this.http.post<ApiResponse<Hobby>>('/api/admin/hobbies', data).pipe(map((r) => r.data));
  }
  updateHobby(id: number, data: Partial<Hobby>): Observable<Hobby> {
    return this.http.put<ApiResponse<Hobby>>(`/api/admin/hobbies/${id}`, data).pipe(map((r) => r.data));
  }
  deleteHobby(id: number): Observable<{ id: number }> {
    return this.http.delete<ApiResponse<{ id: number }>>(`/api/admin/hobbies/${id}`).pipe(map((r) => r.data));
  }

  // ─── SEMESTERS ───────────────────────────────────────────────────────────────
  createSemester(data: Partial<Semester>): Observable<Semester> {
    return this.http.post<ApiResponse<Semester>>('/api/admin/semesters', data).pipe(map((r) => r.data));
  }
  updateSemester(id: string, data: Partial<Semester>): Observable<Semester> {
    return this.http.put<ApiResponse<Semester>>(`/api/admin/semesters/${id}`, data).pipe(map((r) => r.data));
  }
  deleteSemester(id: string): Observable<{ id: string }> {
    return this.http.delete<ApiResponse<{ id: string }>>(`/api/admin/semesters/${id}`).pipe(map((r) => r.data));
  }

  // ─── SUBJECTS ────────────────────────────────────────────────────────────────
  createSubject(data: Partial<Subject>): Observable<Subject> {
    return this.http.post<ApiResponse<Subject>>('/api/admin/subjects', data).pipe(map((r) => r.data));
  }
  updateSubject(id: number, data: Partial<Subject>): Observable<Subject> {
    return this.http.put<ApiResponse<Subject>>(`/api/admin/subjects/${id}`, data).pipe(map((r) => r.data));
  }
  deleteSubject(id: number): Observable<{ id: number }> {
    return this.http.delete<ApiResponse<{ id: number }>>(`/api/admin/subjects/${id}`).pipe(map((r) => r.data));
  }
}
