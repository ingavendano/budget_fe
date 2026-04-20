import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { map, catchError, of } from 'rxjs';

export const planGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Use the centralized user profile from AuthService
  const user = authService.currentUser();
  if (user) {
    if (authService.isPlanExpired(user)) {
      router.navigate(['/subscription']);
      return false;
    }
    return true;
  }

  // Otherwise, load it from the backend before allowing navigation
  return authService.fetchProfile().pipe(
    map(updatedUser => {
      if (authService.isPlanExpired(updatedUser)) {
        router.navigate(['/subscription']);
        return false;
      }
      return true;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};



