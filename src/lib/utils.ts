import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  // Basic normalization for Uganda/General
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '256' + cleaned.substring(1);
  }
  if (cleaned.length === 9) {
    cleaned = '256' + cleaned;
  }
  return '+' + cleaned;
}

export function standardizeGrade(grade: string): string {
  if (!grade) return 'Unknown';
  const g = grade.toLowerCase().replace(/\s/g, '');
  if (g.includes('p7') || g.includes('primaryseven')) return 'Primary 7';
  if (g.includes('s4') || g.includes('seniorfour')) return 'Senior 4';
  if (g.includes('s1')) return 'Senior 1';
  return grade;
}

export function formatDate(date: Date | string | number): string {
  if (!date) return '';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return String(date);
  }
}
