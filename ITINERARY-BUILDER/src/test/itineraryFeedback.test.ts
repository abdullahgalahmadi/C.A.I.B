import { test, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
test('REAL Feedback Submission: inserts and verifies itinerary feedback in Supabase', async () => {
  const itineraryId = '4393157b-3e09-4370-8ec6-d8cd4425e534'; 
  const userId = '6cc2e5bd-4648-41be-bdf6-e4676f87239f'; 
  const rating = 5;
  const comments = 'Amazing trip experience!';
  const timestamp = new Date().toISOString();
  const { data: inserted, error: insertError } = await supabase
    .from('itinerary_feedback')
    .insert([
      {
        user_id: userId,
        itinerary_id: itineraryId,
        rating,
        comments,
        created_at: timestamp,
      },
    ])
    .select();
  expect(insertError).toBeNull();
  expect(inserted).toBeDefined();
  if (!inserted || inserted.length === 0) {
    throw new Error("❌ Insert failed — no feedback was inserted.");
  }
  console.log("✅ Inserted Feedback:", inserted[0]);
  const { data: fetched, error: fetchError } = await supabase
    .from('itinerary_feedback')
    .select()
    .eq('user_id', userId)
    .eq('itinerary_id', itineraryId)
    .order('created_at', { ascending: false })
    .limit(1);

  expect(fetchError).toBeNull();
  expect(fetched?.[0]).toBeDefined();
  expect(fetched?.[0].rating).toBe(rating);
  expect(fetched?.[0].comments).toBe(comments);
});
