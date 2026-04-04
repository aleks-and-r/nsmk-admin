type SetErrors<T> = (errors: Partial<Record<keyof T, string>>) => void;
type SetServerError = (msg: string) => void;

/**
 * Parses a Django REST Framework validation error response and applies
 * field-level errors to the form state. Non-field errors are surfaced via setServerError.
 */
export function applyServerErrors<T>(
  err: unknown,
  setErrors: SetErrors<T>,
  setServerError: SetServerError,
): void {
  const data = (err as { response?: { data?: Record<string, unknown> } })
    ?.response?.data;

  if (data && typeof data === "object") {
    const fieldErrors: Partial<Record<keyof T, string>> = {};
    const nonFieldMsgs: string[] = [];

    Object.entries(data).forEach(([key, val]) => {
      const msgs = Array.isArray(val) ? val.map(String) : [String(val)];
      if (key === "non_field_errors" || key === "detail") {
        nonFieldMsgs.push(...msgs);
      } else {
        fieldErrors[key as keyof T] = msgs[0];
      }
    });

    if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
    if (nonFieldMsgs.length) setServerError(nonFieldMsgs.join(" "));
    if (!Object.keys(fieldErrors).length && !nonFieldMsgs.length) {
      setServerError("Failed to save. Please try again.");
    }
  } else {
    setServerError("Failed to save. Please try again.");
  }
}
