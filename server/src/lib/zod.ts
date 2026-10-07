import { z } from 'zod';

// FormData sends everything as strings, and empty string means "unset".
const emptyToNull = (v: unknown) => (v === '' || v === 'null' || v === undefined ? null : v);

export const zBool = z.preprocess(
  (v) => (typeof v === 'string' ? v === 'true' || v === '1' : v),
  z.boolean(),
);

export const zInt = z.preprocess(
  (v) => (typeof v === 'string' && v !== '' ? Number(v) : v),
  z.number().int(),
);

export const zNullableInt = z.preprocess(
  (v) => {
    const n = emptyToNull(v);
    return typeof n === 'string' ? Number(n) : n;
  },
  z.number().int().nullable(),
);

export const zNullableDate = z.preprocess(
  emptyToNull,
  z.coerce.date().nullable(),
);

export const zNullableString = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z.string().nullable(),
);
