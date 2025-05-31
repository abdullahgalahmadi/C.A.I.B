import { test, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

test("REAL EditPlaceModal behavior: fetch and update place in Supabase", async () => {
  const currentPlaceId = "19a8ed75-5f42-438b-9295-7f30e87fb800"; 
  const city = "Riyadh";
  const type = "restaurant";

 
  const response = await axios.get("http://localhost:3001/api/places", {
    params: { city, type },
  });

  expect(response.status).toBe(200);
  const places = response.data;
  expect(places.length).toBeGreaterThan(0);

  const newPlace = places[0];

  
  const { error } = await supabase
    .from("selected_places")
    .update({
      place_name: newPlace.name,
      address: newPlace.address,
      image_url: newPlace.imageUrl,
      lat: newPlace.lat,
      lng: newPlace.lng,
      type: Array.isArray(newPlace.type) ? newPlace.type[0] : newPlace.type,
    })
    .eq("id", currentPlaceId);

  expect(error).toBeNull();

  
  const { data: updated, error: fetchError } = await supabase
    .from("selected_places")
    .select("place_name, address, image_url, lat, lng, type")
    .eq("id", currentPlaceId)
    .single();

  expect(fetchError).toBeNull();
  expect(updated?.place_name).toBe(newPlace.name);
  expect(updated?.address).toBe(newPlace.address);
});
