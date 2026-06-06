export type ApiErrorResponse = {
  message: string;
  success: false;
  code: string;
  data: null;
};

export function buildErrorResponse(
  message: string,
  code: string,
): ApiErrorResponse {
  return {
    message,
    success: false,
    code,
    data: null,
  };
}

export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
