import { test, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

test('REAL ItineraryDetails: fetches and displays itinerary summary and map data', async () => {
    const itineraryId = "4393157b-3e09-4370-8ec6-d8cd4425e534";
    const { data: dailyPlans } = await supabase
      .from('daily_plans')
      .select('id, day_number, city')
      .eq('itinerary_id', itineraryId);
  
    if (!dailyPlans || dailyPlans.length === 0) {
      throw new Error("❌ No daily plans found");
    }
  
    console.log("📅 Daily Plans:", dailyPlans);
  
    const planIds = dailyPlans.map((plan) => plan.id);
  
    const { data: places } = await supabase
      .from("selected_places")
      .select("place_name, lat, lng, image_url, address, daily_plan_id")
      .in("daily_plan_id", planIds);
  
    if (!places || places.length === 0) {
      throw new Error("❌ No selected places found");
    }
  
    console.log("📍 Selected Places:", places);
  
    
    const groupedByDay = dailyPlans.map(plan => ({
      day: plan.day_number,
      city: plan.city,
      places: places.filter(p => p.daily_plan_id === plan.id),
    }));
  
    for (const day of groupedByDay) {
      console.log(`\n📆 Day ${day.day} — ${day.city}`);
      for (const place of day.places) {
        console.log(`- ${place.place_name} (${place.lat}, ${place.lng})`);
      }
    }
  });
  
