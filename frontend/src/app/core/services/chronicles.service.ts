import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { ApiResponse, Chronicle } from '@monorepo/shared';

export type ChronicleListItem = Chronicle & { passageCount: number };

@Injectable({ providedIn: 'root' })
export class ChroniclesService {
  private http = inject(HttpClient);

  getChronicles() {
    return this.http
      .get<ApiResponse<ChronicleListItem[]>>('/api/chronicles')
      .pipe(map((r) => r.data));
  }

  getChronicle(id: number) {
    return this.http
      .get<ApiResponse<Chronicle>>(`/api/chronicles/${id}`)
      .pipe(map((r) => r.data));
  }
}
