// onboarding.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { OnboardingStep } from './onboarding-step.interface';

@Injectable({
    providedIn: 'root'
})
export class OnboardingService {

    private readonly DISMISSED_KEY = 'nemia_onboarding_dismissed_session';

    readonly steps: OnboardingStep[] = [
        {
            id: 1,
            label: 'Mi perfil',
            description: 'Completa tu nombre y número telefónico',
            ctaText: 'Ir a Mi Perfil',
            route: '/profile',
            skippable: false
        },
        {
            id: 2,
            label: 'Categorías',
            description: 'Crea tus categorías de ingreso y egreso',
            ctaText: 'Ir a Configuración',
            route: '/config',
            skippable: false
        },
        {
            id: 3,
            label: 'Impuestos',
            description: 'Configura tus deducciones o impuestos',
            ctaText: 'Ir a Configuración',
            route: '/config',
            skippable: true
        },
        {
            id: 4,
            label: 'Primer ingreso',
            description: 'Registra tu primer ingreso del mes',
            ctaText: 'Ir a Ingresos',
            route: '/income',
            skippable: false
        },
        {
            id: 5,
            label: 'Primer egreso',
            description: 'Registra tu primer gasto del mes',
            ctaText: 'Ir a Egresos',
            route: '/expense',
            skippable: false
        }
    ];

    private currentStep$ = new BehaviorSubject<number>(0);

    get step$(): Observable<number> {
        return this.currentStep$.asObservable();
    }

    get currentStep(): number {
        return this.currentStep$.value;
    }

    setStep(step: number): void {
        this.currentStep$.next(step);
    }

    get progress(): number {
        return Math.round((this.currentStep / this.steps.length) * 100);
    }

    get isCompleted(): boolean {
        return this.currentStep >= this.steps.length;
    }

    get nextStep(): OnboardingStep | null {
        return this.steps[this.currentStep] ?? null;
    }

    dismiss(): void {
        sessionStorage.setItem(this.DISMISSED_KEY, 'true');
    }

    get isDismissed(): boolean {
        return sessionStorage.getItem(this.DISMISSED_KEY) === 'true';
    }

    shouldShow(): boolean {
        return !this.isCompleted && !this.isDismissed;
    }
}

