import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatResponseTime(value?: number | null) {
  if (value == null) return "-";
  return `${value} ms`;
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
