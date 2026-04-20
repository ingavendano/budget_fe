import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserDTO } from './user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly userUrl = `${environment.apiUrl}/api/user`;

  private userToken = signal<string | null>(localStorage.getItem('token'));
  public currentUser = signal<UserDTO | null>(null);
  
  public isAuthenticated = computed(() => !!this.userToken());
  public isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  constructor() {
    // Check for token in URL (Google OAuth success)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      this.setSession(token);
      // Clean up URL
      this.router.navigate([], { queryParams: { token: null }, queryParamsHandling: 'merge' });
    } else if (this.isAuthenticated()) {
      this.fetchProfile().subscribe(user => {
        // Automatically redirect to subscription if plan is expired on initial load
        if (this.isPlanExpired(user) && !window.location.pathname.includes('/subscription')) {
          this.router.navigate(['/subscription']);
        }
      });
    }
  }

  login(credentials: any) {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        this.setSession(res.accessToken);
        this.fetchProfile().subscribe(user => {
          if (this.isPlanExpired(user)) {
            this.router.navigate(['/subscription']);
          } else {
            this.router.navigate(['/overview']);
          }
        });
      })
    );
  }

  /**
   * Centralized logic to check if a user's plan is expired.
   * Plan is expired if:
   * 1. Plan type is null (incomplete profile).
   * 2. remainingDays is 0 or less (expired).
   * 3. Fallback: planExpiration date is in the past.
   */
  isPlanExpired(user: UserDTO | null): boolean {
    if (!user) return false;
    
    // If planType is null, we treat it as "needs a plan" -> Redirect
    if (user.planType === null) return true;
    
    // 1. Primary check: remainingDays from backend
    // If it's precisely <= 0, it means it expired or it's the last day
    if (user.remainingDays !== null && user.remainingDays !== undefined) {
      return user.remainingDays <= 0;
    }

    // 2. Fallback check: Use planExpiration date string
    if (user.planExpiration) {
      const expiration = new Date(user.planExpiration);
      // Create 'today' without time for a more accurate day-to-day comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return expiration < today;
    }

    return false;
  }

  register(userData: any) {
    return this.http.post(`${this.apiUrl}/signup`, userData, { responseType: 'text' });
  }

  logout() {
    localStorage.removeItem('token');
    this.userToken.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private setSession(token: string) {
    localStorage.setItem('token', token);
    this.userToken.set(token);
  }

  fetchProfile() {
    return this.http.get<UserDTO>(`${this.userUrl}/profile`).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  getToken() {
    return this.userToken();
  }

  updateOnboarding(step?: number, dismissed?: boolean) {
    const payload: any = {};
    if (step !== undefined) payload.onboarding_step = step;
    if (dismissed !== undefined) payload.onboarding_dismissed = dismissed;

    return this.http.patch<UserDTO>(`${this.userUrl}/onboarding`, payload).pipe(
      tap(user => this.currentUser.set(user))
    );
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


