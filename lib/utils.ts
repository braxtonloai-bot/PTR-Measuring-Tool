import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as USD currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number with commas and optional decimal places
 */
export function formatNumber(
  value: number,
  decimals: number = 0
): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Convert square meters to square feet
 */
export function sqMetersToSqFeet(meters: number): number {
  return meters * 10.7639;
}

/**
 * Convert meters to feet
 */
export function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

/**
 * Convert pitch angle in degrees to ratio (e.g., 22.6° -> "5/12")
 */
export function pitchDegreesToRatio(degrees: number): string {
  const rise = Math.round(Math.tan((degrees * Math.PI) / 180) * 12);
  return `${rise}/12`;
}

/**
 * Calculate slope correction factor for a pitched roof.
 * The Solar API returns plan-view (horizontal projection) area.
 * Actual roof surface area = plan area / cos(pitch).
 * E.g. 4/12 (18.4°) → 1.054, 6/12 (26.6°) → 1.118, 8/12 (33.7°) → 1.202
 */
export function slopeCorrectionFactor(pitchDegrees: number): number {
  if (pitchDegrees <= 0) return 1;
  return 1 / Math.cos((pitchDegrees * Math.PI) / 180);
}
