import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SubscriptionService } from '../features/subscription/subscription.service';
import { map, catchError, of } from 'rxjs';

export const planGuard: CanActivateFn = (route, state) => {
  const subscriptionService = inject(SubscriptionService);
  const router = inject(Router);

  // If the plan is already cached in the signal, use it synchronously
  const current = subscriptionService.currentPlan();
  if (current) {
    if (current.planType === null) {
      router.navigate(['/subscription']);
      return false;
    }
    return true;
  }

  // Otherwise, load it from the backend before allowing navigation
  return subscriptionService.loadMyPlan().pipe(
    map(plan => {
      if (plan.planType === null) {
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
