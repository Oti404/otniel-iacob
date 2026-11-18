import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, Chronicle, Contributor, Passage, PassageMedia, Profile, Project, Experience, Semester, Hobby, Subject } from '@monorepo/shared';

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

  // ─── CONTRIBUTORS ────────────────────────────────────────────────────────────
  getContributors(): Observable<Contributor[]> {
    return this.http.get<ApiResponse<Contributor[]>>('/api/admin/contributors').pipe(map((r) => r.data));
  }
  createContributor(data: { name: string; link?: string | null }): Observable<Contributor> {
    return this.http.post<ApiResponse<Contributor>>('/api/admin/contributors', data).pipe(map((r) => r.data));
  }
  updateContributor(id: number, data: { name: string; link?: string | null }): Observable<Contributor> {
    return this.http.put<ApiResponse<Contributor>>(`/api/admin/contributors/${id}`, data).pipe(map((r) => r.data));
  }
  deleteContributor(id: number): Observable<{ id: number }> {
    return this.http.delete<ApiResponse<{ id: number }>>(`/api/admin/contributors/${id}`).pipe(map((r) => r.data));
  }

  // ─── CHRONICLES ──────────────────────────────────────────────────────────────
  getAdminChronicles(): Observable<(Chronicle & { passageCount: number })[]> {
    return this.http.get<ApiResponse<(Chronicle & { passageCount: number })[]>>('/api/admin/chronicles').pipe(map((r) => r.data));
  }
  getAdminChronicle(id: number): Observable<Chronicle> {
    return this.http.get<ApiResponse<Chronicle>>(`/api/admin/chronicles/${id}`).pipe(map((r) => r.data));
  }
  createChronicle(data: { title: string; description?: string | null; coverImage?: string | null }): Observable<Chronicle> {
    return this.http.post<ApiResponse<Chronicle>>('/api/admin/chronicles', data).pipe(map((r) => r.data));
  }
  updateChronicle(id: number, data: { title: string; description?: string | null; coverImage?: string | null }): Observable<Chronicle> {
    return this.http.put<ApiResponse<Chronicle>>(`/api/admin/chronicles/${id}`, data).pipe(map((r) => r.data));
  }
  deleteChronicle(id: number): Observable<{ id: number }> {
    return this.http.delete<ApiResponse<{ id: number }>>(`/api/admin/chronicles/${id}`).pipe(map((r) => r.data));
  }
  publishChronicle(id: number): Observable<Chronicle> {
    return this.http.post<ApiResponse<Chronicle>>(`/api/admin/chronicles/${id}/publish`, {}).pipe(map((r) => r.data));
  }
  updateChroniclePublishedAt(id: number, publishedAt: string): Observable<Chronicle> {
    return this.http.put<ApiResponse<Chronicle>>(`/api/admin/chronicles/${id}/published-at`, { publishedAt }).pipe(map((r) => r.data));
  }
  uploadChronicleCover(file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<{ url: string }>>('/api/admin/chronicles/upload-cover', form).pipe(map((r) => r.data.url));
  }

  // ─── PASSAGES ────────────────────────────────────────────────────────────────
  createPassage(chronicleId: number, data: { title: string; content?: string | null; order: number }): Observable<Passage> {
    return this.http.post<ApiResponse<Passage>>(`/api/admin/chronicles/${chronicleId}/passages`, data).pipe(map((r) => r.data));
  }
  updatePassage(pid: number, data: { title: string; content?: string | null; order: number }): Observable<Passage> {
    return this.http.put<ApiResponse<Passage>>(`/api/admin/passages/${pid}`, data).pipe(map((r) => r.data));
  }
  deletePassage(pid: number): Observable<{ id: number }> {
    return this.http.delete<ApiResponse<{ id: number }>>(`/api/admin/passages/${pid}`).pipe(map((r) => r.data));
  }
  publishPassage(pid: number): Observable<Passage> {
    return this.http.post<ApiResponse<Passage>>(`/api/admin/passages/${pid}/publish`, {}).pipe(map((r) => r.data));
  }
  updatePassagePublishedAt(pid: number, publishedAt: string): Observable<Passage> {
    return this.http.put<ApiResponse<Passage>>(`/api/admin/passages/${pid}/published-at`, { publishedAt }).pipe(map((r) => r.data));
  }

  // ─── MEDIA ───────────────────────────────────────────────────────────────────
  addYoutubeLink(pid: number, data: { url: string; caption?: string | null; order: number }): Observable<PassageMedia> {
    return this.http.post<ApiResponse<PassageMedia>>(
      `/api/admin/passages/${pid}/media`,
      { url: data.url, type: 'YOUTUBE', order: data.order, caption: data.caption ?? null },
    ).pipe(map((r) => r.data));
  }
  uploadPassageMedia(pid: number, file: File, caption?: string | null): Observable<PassageMedia> {
    const form = new FormData();
    form.append('file', file);
    if (caption) form.append('caption', caption);
    return this.http.post<ApiResponse<PassageMedia>>(`/api/admin/passages/${pid}/media/upload`, form).pipe(map((r) => r.data));
  }
  deleteMedia(mid: number): Observable<{ id: number }> {
    return this.http.delete<ApiResponse<{ id: number }>>(`/api/admin/media/${mid}`).pipe(map((r) => r.data));
  }
  reorderMedia(mid: number, order: number): Observable<PassageMedia> {
    return this.http.put<ApiResponse<PassageMedia>>(`/api/admin/media/${mid}/order`, { order }).pipe(map((r) => r.data));
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
