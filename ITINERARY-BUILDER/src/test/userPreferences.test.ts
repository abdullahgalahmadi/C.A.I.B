import { test, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

test("REAL: Saves user preferences into Supabase", async () => {
  const userId = "6cc2e5bd-4648-41be-bdf6-e4676f87239f"; 
  const preferences = {
    user_id: userId,
    travel_style: "Nature",
    interests: ["Beaches", "Mountains"],
    favorite_food: ["Seafood", "Saudi"],
    preferred_cities: ["Riyadh", "Jeddah"],
    budget_range: "Medium",
  };

  const { data: insertData, error: insertError } = await supabase
    .from("user_preferences")
    .insert(preferences)
    .select()
    .single();

  expect(insertError).toBeNull();
  expect(insertData).toBeDefined();
  expect(insertData?.user_id).toBe(userId);
  expect(insertData?.travel_style).toBe("Nature");

  console.log("✅ Inserted Preferences:", insertData);
});
