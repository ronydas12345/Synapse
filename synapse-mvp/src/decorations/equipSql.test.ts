import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('equip_decoration SQL', () => {
  it('names the signed-in user viewer so uid is not ambiguous', () => {
    const sql = readFileSync(
      resolve(
        process.cwd(),
        '../supabase/migrations/20261004_qualify_profile_uid.sql'
      ),
      'utf8'
    );
    const start = sql.indexOf('function public.equip_decoration');
    const next = sql.indexOf('create or replace function', start + 1);
    const fn = sql.slice(start, next === -1 ? undefined : next);
    expect(fn).toMatch(/viewer uuid := auth\.uid\(\)/);
    expect(fn).not.toMatch(/declare\s+uid uuid := auth\.uid\(\)/);
    expect(fn).toMatch(/d\.uid = viewer/);
    expect(fn).toMatch(/profiles\.uid = viewer/);
  });
});
