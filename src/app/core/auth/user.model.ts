export interface UserDTO {
  id: number;
  email: string;
  name: string;
  imageUrl: string | null;
  role: 'CLIENTE' | 'ADMIN';
  planType: 'FREE' | 'PREMIUM' | 'PRO' | null;
  planExpiration: string | null;
  remainingDays: number | null;
  active: boolean;
  features: string[];
  onboardingStep: number; // 0 = no iniciado, 5 = completado
  onboardingDismissed: boolean; // true si el usuario eligió "Recordar después"
}


