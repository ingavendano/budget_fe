// onboarding-step.interface.ts
export interface OnboardingStep {
    id: number;
    label: string;
    description: string;
    ctaText: string;
    route: string;
    skippable: boolean;
}

