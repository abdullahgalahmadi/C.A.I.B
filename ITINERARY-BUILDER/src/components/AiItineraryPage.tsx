// AiItineraryPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseConfig";
import { v4 as uuidv4 } from "uuid";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchPlacesByText } from "../lib/google/fetchPlaces";
import "./AiItineraryPage.css";
import axios from "axios"; // add this



type AiPlace = {
  time: string;
  name: string;
  city: string;
  type: string;
};

type PlaceDetails = {
  name: string;
  address: string;
  stars: number | null;
  imageUrl: string | null;
  lat: number;
  lng: number;
  type: string;
  city: string;
};



const AiItineraryPage: React.FC = () => {
  const [loading, setLoading] = useState(true); 
  const hasGenerated = useRef(false); 
  const navigate = useNavigate();

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));


  const Prompt = (
    preferences: any,
    days: number,
    allPlaces: PlaceDetails[]
  ): string => {
    return `
  You are a smart travel planner helping a user plan a ${days}-day trip in Saudi Arabia.
  
  Here are the user's preferences:
  - Interests: ${preferences.interests.join(", ")}
  - Preferred Cities: ${preferences.preferred_cities.join(", ")}
  - Favorite Food: ${preferences.favorite_food.join(", ")}
  - Budget: ${preferences.budget_range}
  - Travel Style: ${preferences.travel_style}
  
  You have access to the following list of real places (DO NOT invent anything):
  
  ${JSON.stringify(
    allPlaces.map(p => ({
      name: p.name,
      city: p.city,
      type: p.type,
    })),
    null,
    2
  )}
  
  
  City Interest Guide:
  - Jeddah: beaches, seafood, shopping, Saudi food
  - Dammam: beaches, seafood, Saudi food
  - Al Jubail: beaches, seafood, Saudi food
  - Jazan: beaches, Saudi food
  - Riyadh: historical sites, Saudi food, international food, shopping
  - Medina: historical sites, religious sites, Saudi food
  - Mecca: historical sites, religious sites, Saudi food
  - Taif: mountains, nature
  - AlUla: historical sites, museums, nature
  - Abha: mountains, nature, Saudi food
  - Tabuk: mountains, nature
  - Diriyah: museums, Saudi food, heritage
  
  Instructions:
  - Select cities that match the user's selected **interests**.
  - When recommending restaurants, match the name and type to the user's **preferred food** (e.g. only suggest Saudi-style restaurants if they selected "Saudi food").
  - Do not suggest restaurants with clearly foreign names like "Brasa De Brazil", "Shang Palace", "P.F. Chang's" unless the user selected that cuisine.
  - You may infer cuisine based on place names or city culture. For example, if the user selected "Saudi food", prefer places like "AlRomansiah", "Najd Village", or others with traditional/local identity.
  - NEVER suggest the same place name more than once across the whole trip.
  - If the user's favorite food is "Saudi food", strictly avoid suggesting restaurants with clearly foreign names or menus.** Examples of foreign restaurants to avoid include "Italiano Pizza", "Sushi House", "Le Bistro Cafe", etc.
  - Instead, if the user selected "Saudi food", focus on suggesting restaurants with names and descriptions that indicate local or regional cuisine.** Examples of Saudi restaurants to prefer: "Al Romansiah", "Najd Village", "Al Tazaj", "Shawarma House", "Maqadir Restaurant", etc. Look for keywords like "مندي" (Mandi), "كبسة" (Kabsa), "مأكولات شعبية" (popular dishes), etc.
  
  Rules:
  - You MUST assign only ONE real city per day.
  - Each day must include 3 activities: morning, afternoon, evening.
  - Each activity must have:
    { "time": "morning" | "afternoon" | "evening", "name": string, "city": string, "type": string }
  
 Final Output Rules:
- ONLY return raw JSON. Do NOT include any explanation, notes, or text before or after it.
- The entire output must be valid parsable JSON like this:
  {
    "Day 1": [
      { "time": "morning", "name": "Place A", "city": "CityX", "type": "tourist_attraction" },
      { "time": "afternoon", "name": "Place B", "city": "CityX", "type": "shopping_mall" },
      { "time": "evening", "name": "Place C", "city": "CityX", "type": "restaurant" }
    ],
    ...
  }
  `.trim(); 
};

  const generateAndSaveItinerary = async () => {
    // get the current user
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId) return;

    await delay(1000);
    // get the last prefernce
    const { data: prefData } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!prefData) {
      console.error("No preferences found.");
      return;
    }

    const startDate = localStorage.getItem("aiStartDate");
    const endDate = localStorage.getItem("aiEndDate");

    const days =
      startDate && endDate
        ? Math.floor(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        : 1;

         
    const forceNew = localStorage.getItem("aiForceNew") === "true";
    if (!forceNew) {
      const { data: existing } = await supabase
        .from("manual_itineraries")
        .select("id")
        .eq("user_id", userId)
        .eq("start_date", startDate)
        .eq("end_date", endDate)
        .limit(1);

      if (existing && existing.length > 0) {
        navigate(`/ItineraryDetails?id=${existing[0].id}`);
        return;
      }
    }

    
    const defaultCities = [
      "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Taif",
      "AlUla", "Abha", "Tabuk", "Jazan", "Diriyah", "Al Jubail"
    ];
    const citiesToUse = prefData.preferred_cities.length > 0 ? prefData.preferred_cities : defaultCities;

    const placeTypes = ["restaurant", "tourist_attraction", "cafe", "mosque", "shopping_mall", "lodging"];
    const fetchAll = []; 


    
    for (const city of citiesToUse) {
      for (const type of placeTypes) {
        fetchAll.push(
          fetchPlacesByText(city, type as any).then((places) => ({
            city,
            type,
            places
          }))
        );
      }
    }
    
    const results = await Promise.all(fetchAll);

    const allPlaces: PlaceDetails[] = []; 
    for (const result of results) {
      allPlaces.push(
        ...result.places.map((p: any) => ({
          ...p,
          city: result.city,
          type: p.type.join(", "),
        }))
      );
    }

    
const trimmedPlaces = allPlaces.slice(0, 100);
const prompt = Prompt(prefData, days, trimmedPlaces);



const response = await axios.post("http://localhost:3001/generate-ai-itinerary", { prompt });


let itinerary: Record<string, AiPlace[]>;
try {
  if (!response.data || !response.data.result) {
    alert("Gemini didn't return a result.");
    return;
  }

  itinerary = response.data.result;

} catch (err) {
  console.error(" Failed to parse Gemini result:", response.data.result);
  alert("AI failed to generate a valid itinerary. Please try again.");
  return;
}
    
    const itineraryId = uuidv4();
    await supabase.from("manual_itineraries").insert({
      id: itineraryId,
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      type: "ai",
      ai_description: "", // Temp
    });
    
    const dayMap: Record<string, number> = {};
    Object.keys(itinerary).forEach((day, i) => (dayMap[day] = i + 1));
    const matchedItinerary: Record<string, AiPlace[]> = {};
    
    for (const [day, items] of Object.entries(itinerary)) {
      if (!items || items.length === 0) continue;

      const dayCity = items[0].city;
      const dailyPlanId = uuidv4();
      
      await supabase.from("daily_plans").insert({
        id: dailyPlanId,
        itinerary_id: itineraryId,
        day_number: dayMap[day],
        city: dayCity,
      });
      
      for (const item of items) {
        if (item.city !== dayCity) continue; 

        
        const match = allPlaces.find(
          (place) =>
            place.city.toLowerCase() === item.city.toLowerCase() &&
            (place.name.toLowerCase() === item.name.toLowerCase() ||
              place.name.toLowerCase().includes(item.name.toLowerCase()) ||
              item.name.toLowerCase().includes(place.name.toLowerCase()))
        );

        if (!match) {
          console.warn(`Skipped: No match for "${item.name}" in ${item.city}`);
          continue;
        }
        
        await supabase.from("selected_places").insert({
          id: uuidv4(),
          daily_plan_id: dailyPlanId,
          place_name: match.name,
          address: match.address,
          image_url: match.imageUrl,
          type: match.type,
          lat: match.lat,
          lng: match.lng,
        });

        if (!matchedItinerary[day]) matchedItinerary[day] = [];
        matchedItinerary[day].push(item); 
      }
    }
    
    const summaryRes = await axios.post("http://localhost:3001/generate-summary", {
      itinerary: matchedItinerary,
    });
    const summary = summaryRes.data.summary;
    
    await supabase
      .from("manual_itineraries")
      .update({ ai_description: summary })
      .eq("id", itineraryId);
    

    navigate(`/ItineraryDetails?id=${itineraryId}`);
  };
  
  useEffect(() => {
    if (!hasGenerated.current) {
      hasGenerated.current = true;
      generateAndSaveItinerary().finally(() => setLoading(false));
    }
  }, []);

  return (
    <div className="ai-page-container">
      <h1 className="ai-page-heading">Generating AI Itinerary</h1>
      <div className="spinner" />
    </div>
  );
};

export default AiItineraryPage;
