import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private userToken = signal<string | null>(localStorage.getItem('token'));
  
  public isAuthenticated = computed(() => !!this.userToken());

  constructor() {
    // Check for token in URL (Google OAuth success)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      this.setSession(token);
      // Clean up URL
      this.router.navigate([], { queryParams: { token: null }, queryParamsHandling: 'merge' });
    }
  }

  login(credentials: any) {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => this.setSession(res.accessToken))
    );
  }

  register(userData: any) {
    return this.http.post(`${this.apiUrl}/signup`, userData, { responseType: 'text' });
  }

  logout() {
    localStorage.removeItem('token');
    this.userToken.set(null);
    this.router.navigate(['/login']);
  }

  private setSession(token: string) {
    localStorage.setItem('token', token);
    this.userToken.set(token);
  }

  getToken() {
    return this.userToken();
  }

  /** Decode JWT payload and return the role claim, or null if not authenticated. */
  getUserRole(): string | null {
    const token = this.userToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role ?? payload.authorities?.[0]?.authority ?? null;
    } catch {
      return null;
    }
  }
}
