/// <reference types="vitest" />
import { test, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

test('real signInWithPassword works with test user', async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'testuser@example.com',
    password: 'FCIT123',
  });

  expect(error).toBeNull();
  expect(data.user?.email).toBe('testuser@example.com');
});



