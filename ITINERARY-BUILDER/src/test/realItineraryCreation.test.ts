import { test, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
  test('REAL Itinerary Creation: inserts manual_itineraries, daily_plans, and selected_places (shared by AI/manual)', async () => {
  const userId = "6cc2e5bd-4648-41be-bdf6-e4676f87239f";
  const itineraryId = uuidv4();
  const start_date = '2025-05-10';
  const end_date = '2025-05-12';

  const { error: itineraryError } = await supabase
    .from('manual_itineraries')
    .insert({
      id: itineraryId,
      user_id: userId,
      start_date,
      end_date,
      type: 'ai',
      ai_description: 'This is a test AI-generated itinerary.'
    });

  expect(itineraryError).toBeNull();

  const day1Id = uuidv4();
  const day2Id = uuidv4();

  const { error: dayError } = await supabase.from('daily_plans').insert([
    { id: day1Id, itinerary_id: itineraryId, day_number: 1, city: 'Riyadh' },
    { id: day2Id, itinerary_id: itineraryId, day_number: 2, city: 'Jeddah' }
  ]);
  expect(dayError).toBeNull();

  
  const { error: placeError } = await supabase.from('selected_places').insert([
    {
      daily_plan_id: day1Id,
      place_name: 'Edge of the World',
      address: 'Riyadh, Saudi Arabia',
      image_url: 'https://example.com/edge.jpg',
      type: 'tourist_attraction',
      lat: 24.9500,
      lng: 45.1500
    },
    {
      daily_plan_id: day2Id,
      place_name: 'Jeddah Corniche',
      address: 'Jeddah, Saudi Arabia',
      image_url: 'https://example.com/corniche.jpg',
      type: 'tourist_attraction',
      lat: 21.5433,
      lng: 39.1728
    }
  ]);

  expect(placeError).toBeNull();

 
  const { data: fetchedPlans } = await supabase
    .from('daily_plans')
    .select('*')
    .eq('itinerary_id', itineraryId);

  expect(fetchedPlans?.length).toBe(2);

  const { data: fetchedPlaces } = await supabase
    .from('selected_places')
    .select('*')
    .in('daily_plan_id', [day1Id, day2Id]);

  expect(fetchedPlaces?.length).toBe(2);

  console.log('✅ AI itinerary, daily plans, and places created successfully.');
});
