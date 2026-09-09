

export function minorToMajor(minor: unknown): number | "" {
  if (minor === undefined || minor === null || minor === "") return "";
  const n = Number(minor);
  return isNaN(n) ? "" : n / 100;
}

export function majorToMinor(major: string | number): number {
  const n = Number(major);
  if (isNaN(n)) return 0;
  // Math.round matters: 19.99 * 100 evaluates to 1998.9999999999998 in JS.
  return Math.round(n * 100);
}

export function formatPKR(minor: unknown): string {
  const major = minorToMajor(minor);
  if (major === "") return "—";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(major);
}