import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OnboardingService } from './onboarding.service';
import { AuthService } from '../../core/auth/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-onboarding-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding-banner.html',
  styleUrl: './onboarding-banner.css',
})
export class OnboardingBanner implements OnInit, OnDestroy {
  visible = false;
  currentStep = 0;
  private destroy$ = new Subject<void>();

  currentUser$;

  constructor(
    public onboarding: OnboardingService,
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = toObservable(this.authService.currentUser);
  }

  ngOnInit(): void {
    // Cargar el paso actual desde el perfil del usuario
    this.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.onboarding.setStep(user.onboardingStep ?? 0);
          this.visible = this.onboarding.shouldShow();
        }
      });

    this.onboarding.step$
      .pipe(takeUntil(this.destroy$))
      .subscribe(step => {
        this.currentStep = step;
      });
  }

  getStepState(index: number): 'done' | 'active' | 'pending' {
    if (index < this.currentStep) return 'done';
    if (index === this.currentStep) return 'active';
    return 'pending';
  }

  goToNextStep(): void {
    const next = this.onboarding.nextStep;
    if (next) {
      this.router.navigate([next.route]);
    }
  }

  dismiss(): void {
    this.onboarding.dismiss();
    this.visible = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


