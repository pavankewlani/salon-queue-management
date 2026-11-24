import { AuthUser, QueueToken } from '../types';

/**
 * Privacy helper to mask customer names on public screens or for unauthorized viewers.
 * Example: "Rajesh Patel" -> "Rajesh P."
 * Example: "Vikram" -> "Vikram"
 */
export function maskName(fullName: string): string {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) {
    return trimmed;
  }
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
}

/**
 * Privacy helper to mask phone numbers on public screens or for unauthorized viewers.
 * Example: "9825012345" -> "98250 •••••"
 */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 5) return '•••••';
  const prefix = clean.slice(0, 5);
  return `${prefix} •••••`;
}

/**
 * Evaluates whether a given user session is authorized to view a customer's unmasked details.
 * - Staff (Admin, Receptionist, Barber) can view full details.
 * - Customer can view full details only if the token's phone matches their account phone.
 * - Guests and other customers get masked/redacted views.
 */
export function canViewCustomerDetails(user: AuthUser | null, token: QueueToken): boolean {
  if (!user) return false;
  // Staff always has authorized front-desk access
  if (user.role === 'admin' || user.role === 'receptionist' || user.role === 'barber') {
    return true;
  }
  // Customer can only view their own token
  if (user.role === 'customer' && user.phone) {
    const cleanUserPhone = user.phone.replace(/\D/g, '');
    const cleanTokenPhone = token.customerPhone.replace(/\D/g, '');
    return cleanUserPhone === cleanTokenPhone;
  }
  return false;
}
