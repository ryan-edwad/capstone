import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TimeclockService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}timeentry`;

  constructor() { }

  getTimeEntriesByUserAndDateRange(userId: string, startDate?: Date, endDate?: Date) {
    var timeEntriesUrl = `${this.baseUrl}/${userId}`;
    if (startDate && endDate) {
      timeEntriesUrl += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
    }
    return this.http.get(timeEntriesUrl);

  }
}
