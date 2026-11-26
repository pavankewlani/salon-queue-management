export type Language = 'en' | 'gu';

// Token Status Lifecycle
export type TokenStatus = 
  | 'WAITING'      // In queue line
  | 'UP_NEXT'      // 1 or 2 slots away from chair
  | 'CALLED'       // Barber ready; 10-minute grace timer active
  | 'IN_SERVICE'   // Currently receiving service in chair
  | 'COMPLETED'    // Finished (Terminal)
  | 'NO_SHOW'      // Expired after 10-minute grace (Terminal)
  | 'CANCELLED';   // Customer cancelled (Terminal)

export type BarberPreference = 'ANY' | string;

export interface ServiceItem {
  id: string;
  nameEn: string;
  nameGu: string;
  durationMinutes: number;
  priceInr: number;
  isActive: boolean;
  descriptionEn?: string;
  descriptionGu?: string;
  category?: 'hair' | 'beard' | 'spa' | 'skin';
}

export interface QueueToken {
  id: string;              // e.g. "G-14"
  customerName: string;
  customerPhone: string;   // 10 digits
  services: ServiceItem[]; // 1 <= services.length <= 3
  barberPreference: BarberPreference;
  assignedBarberId?: string;
  assignedBarberName?: string;
  chairNumber?: number;
  status: TokenStatus;
  isWalkIn: boolean;
  createdAt: string;       // ISO 8601 UTC
  calledAt?: string;
  serviceStartedAt?: string;
  serviceCompletedAt?: string;
  estimatedWaitMinutes: number;
  /** Customer feedback rating (1-5 stars) after service */
  feedbackRating?: number;
  /** Customer feedback comment after service */
  feedbackComment?: string;
}

export interface BarberStation {
  id: string;
  name: string;
  nameGu?: string;
  chairNumber: number;
  status: 'IDLE' | 'CALLING' | 'IN_SERVICE' | 'ON_BREAK' | 'OFFLINE';
  currentCustomerTokenId?: string;
  currentCustomerName?: string;
  specialtiesEn?: string;
  specialtiesGu?: string;
  currentWaitMins?: number;
  avatar?: string;
  shiftStart: string;
  shiftEnd: string;
  /** ISO timestamp: barber cannot auto-accept new customers until this time (1-min cooldown after service) */
  cooldownUntil?: string;
  /** ISO timestamp when the barber's break started (auto-ends after 15 minutes) */
  breakStartedAt?: string;
}

export interface SalonConfiguration {
  salonNameEn: string;
  salonNameGu: string;
  openingTime: string;
  closingTime: string;
  onlineCutoffMinutesBeforeClosing: number;
  maxServicesPerBooking: number;
  noShowGracePeriodSeconds: number;
  strictOneTokenPerPhone: boolean;
  isEmergencyPaused: boolean;
  forceOnlineQueueOpen?: boolean | null;
  autoAcceptNextCustomer?: boolean;
}

// User Authentication & Role-Based Access Control (RBAC)
export type UserRole = 'admin' | 'receptionist' | 'barber' | 'customer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}
