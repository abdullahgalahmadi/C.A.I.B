/// <reference types="vitest" />
import { test, expect } from 'vitest';
import { fetchPlacesByText } from '../lib/google/fetchPlaces';

test('REAL fetchPlacesByText returns results from Google API via backend', async () => {
  const city = "Riyadh";
  const type = "tourist_attraction";

  const places = await fetchPlacesByText(city, type);

  console.log("First Place:", {
    name: places[0]?.name,
    lat: places[0]?.lat,
    lng: places[0]?.lng
  });

  expect(places.length).toBeGreaterThan(0);
  expect(places[0].name).toBeDefined();
  expect(places[0].lat).toBeDefined();   
  expect(places[0].lng).toBeDefined();   
});





