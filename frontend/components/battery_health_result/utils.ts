
export function hasVal(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

export function firstParam(
  value: string | string[] | undefined
): string | undefined {

  return Array.isArray(value)
    ? value[0]
    : value;
}


export function safeParse<T>(
  value: string | undefined,
  fallback: T
): T {

  if (!value) {
    return fallback;
  }

  try {

    return JSON.parse(value) as T;

  } catch {

    return fallback;
  }
}


export function toNumber(
  value:
    | string
    | number
    | null
    | undefined
): number | null {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {

    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


export function healthLabel(
  value: number | null
): string {

  if (value === null) {
    return "Unknown";
  }

  if (value >= 90) {
    return "Excellent";
  }

  if (value >= 80) {
    return "Good";
  }

  return "Degraded";
}


export function healthColor(
  value: number | null
): string {

  if (value === null) {
    return "#534AB7";
  }

  if (value >= 90) {
    return "#0F6E56";
  }

  if (value >= 80) {
    return "#BA7517";
  }

  return "#A32D2D";
}



export function formatSohChange(
  degradation: number | null | undefined
): string {

  const value = toNumber(degradation);

  if (value === null) {
    return "Pending";
  }

  return `${Math.abs(value).toFixed(4)}%`;
}


export function escapeHtml(
  value: string | number | null | undefined
): string {

  const textValue =
    value === null || value === undefined
      ? ""
      : String(value);

  return textValue
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
