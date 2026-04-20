import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PasswordResetRequest {
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/admin/users`;

  resetAllPasswords(newPassword: string): Observable<string> {
    const request: PasswordResetRequest = { newPassword };
    return this.http.post(`${this.apiUrl}/reset-all-passwords`, request, { responseType: 'text' });
  }
}


