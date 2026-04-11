export interface UserDTO {
  id: number;
  email: string;
  name: string;
  imageUrl: string | null;
  role: 'USER' | 'ADMIN';
  planType: 'FREE' | 'PREMIUM' | 'PRO' | null;
  planExpiration: string | null;
  remainingDays: number | null;
}
