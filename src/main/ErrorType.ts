interface ApiError {
  code: number;
  error: string;
}

export function isApiError(x: unknown): x is ApiError {
  if (x && typeof x === "object" && "code" in x) {
    return true;
  }
  return false;
}
