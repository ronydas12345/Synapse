import { describe, expect, it } from 'vitest';
import { isMissingSchema, isSchemaCacheError } from './client';

describe('isSchemaCacheError', () => {
  it('maps PostgREST missing-function and missing-table codes', () => {
    expect(isSchemaCacheError({ message: 'x', code: 'PGRST202' })).toBe(true);
    expect(isSchemaCacheError({ message: 'x', code: 'PGRST205' })).toBe(true);
  });

  it('maps schema-cache wording without treating missing columns as cache misses', () => {
    expect(
      isSchemaCacheError({
        message:
          'Could not find the function public.publish_workshop_creation with parameter p_kind in the schema cache',
      })
    ).toBe(true);
    expect(
      isSchemaCacheError({
        message: 'function public.publish_workshop_creation does not exist',
      })
    ).toBe(true);
    expect(
      isSchemaCacheError({
        message: 'column "kind" of relation "workshop_creations" does not exist',
        code: '42703',
      })
    ).toBe(false);
  });
});

describe('isMissingSchema', () => {
  it('still treats staff RPC permission gaps as a missing schema', () => {
    expect(
      isMissingSchema({
        message: 'permission denied for function is_staff',
      })
    ).toBe(true);
  });
});
