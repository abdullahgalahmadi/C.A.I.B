import { test, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

test('REAL Delete Itinerary: deletes itinerary, its daily plans, and selected places', async () => {
  const itineraryId = '4393157b-3e09-4370-8ec6-d8cd4425e534';

  const { data: dailyPlans, error: planFetchError } = await supabase
    .from('daily_plans')
    .select('id')
    .eq('itinerary_id', itineraryId);

  expect(planFetchError).toBeNull();
  expect(dailyPlans).toBeDefined();

  const dailyPlanIds = dailyPlans?.map(plan => plan.id) || [];
  const { error: deleteError } = await supabase
    .from('manual_itineraries')
    .delete()
    .eq('id', itineraryId);

  expect(deleteError).toBeNull();

  const { data: itineraryCheck } = await supabase
    .from('manual_itineraries')
    .select('id')
    .eq('id', itineraryId);

  expect(itineraryCheck?.length).toBe(0);
  if (dailyPlanIds.length > 0) {
    const { data: plansCheck } = await supabase
      .from('daily_plans')
      .select('id')
      .in('id', dailyPlanIds);
    
    expect(plansCheck?.length).toBe(0);
  }
  const { data: placesCheck } = await supabase
    .from('selected_places')
    .select('id')
    .in('daily_plan_id', dailyPlanIds);

  expect(placesCheck?.length).toBe(0);

  console.log('✅ Itinerary, daily plans, and selected places deleted successfully.');
});
