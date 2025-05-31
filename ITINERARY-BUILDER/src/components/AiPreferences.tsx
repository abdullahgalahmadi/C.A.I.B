import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseConfig";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "./AiPreferences.css";

const travelStyles = ["Adventure", "Relaxation", "Cultural", "Nature", "Luxury"];
const interestOptions = ["Museums", "Beaches", "Mountains", "Historical sites", "Shopping"];
const foodOptions = ["Saudi", "Italian", "Seafood", "Street Food", "Vegetarian"];
const budgetRanges = ["Low", "Medium", "High"];
const cityOptions = ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Taif", "AlUla", "Abha", "Tabuk", "Jazan", "Diriyah", "Al Jubail"];

const AiPreferences: React.FC = () => {
  const navigate = useNavigate();

  const [travelStyle, setTravelStyle] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [favoriteFood, setFavoriteFood] = useState<string[]>([]);
  const [preferredCities, setPreferredCities] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [existingPlanId, setExistingPlanId] = useState<string | null>(null);

  
  useEffect(() => {
    const checkGemini = async () => {
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: "gemini-2.0-flash" });
        await model.generateContent("ping");
      } catch (err) { 
        console.error("Gemini check failed:", err);
        localStorage.setItem("fallback_reason", "Gemini is unavailable");
        navigate("/UserPreferenceForm"); 
      }
    };

    checkGemini();
  }, []);

  const handleToggle = (value: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    setError("");
    
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    
    if (!userId || !travelStyle || !budget || !startDate || !endDate) {
      setError("Please fill in all required fields.");
      return;
    }
    
    const { data: existingPlan, error: existingError } = await supabase
      .from("manual_itineraries")
      .select("id")
      .eq("user_id", userId)
      .eq("start_date", startDate)
      .eq("end_date", endDate)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing plan:", existingError.message);
      setError("Failed to check existing plans. Please try again.");
      return;
    }
    
    if (existingPlan) {
      setExistingPlanId(existingPlan.id);
      setShowModal(true);
      return;
    }
    
    await savePreferencesAndContinue();
  };

  const savePreferencesAndContinue = async () => {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    
    const { error: insertError } = await supabase.from("user_preferences").insert({
      user_id: userId,
      travel_style: travelStyle,
      interests,
      favorite_food: favoriteFood,
      preferred_cities: preferredCities,
      budget_range: budget,
    });

    if (insertError) {
      setError("Failed to save preferences: " + insertError.message);
      return;
    }
    
    localStorage.setItem("aiStartDate", startDate);
    localStorage.setItem("aiEndDate", endDate);

    navigate("/AiItineraryPage");
  };
  
  const handleUseExisting = () => {
    if (existingPlanId) {
      navigate(`/ItineraryDetails?id=${existingPlanId}`);
    }
  };
  
  const handleCreateNew = async () => {
    localStorage.setItem("aiForceNew", "true");  
    setShowModal(false);
    await savePreferencesAndContinue();
  };

  return (
    <div className="ai-form-container">
      <h1>AI Itinerary Preferences</h1>

      <label>Travel Style:</label>
      <select value={travelStyle} onChange={(e) => setTravelStyle(e.target.value)}>
        <option value="">Select</option>
        {travelStyles.map((style) => (
          <option key={style} value={style}>{style}</option>
        ))}
      </select>

      <label>Interests:</label>
      <div className="multi-select-box">
        {interestOptions.map((interest) => (
          <label key={interest}>
            <input
              type="checkbox"
              checked={interests.includes(interest)}
              onChange={() => handleToggle(interest, interests, setInterests)}
            />
            {interest}
          </label>
        ))}
      </div>

      <label>Favorite Food:</label>
      <div className="multi-select-box">
        {foodOptions.map((food) => (
          <label key={food}>
            <input
              type="checkbox"
              checked={favoriteFood.includes(food)}
              onChange={() => handleToggle(food, favoriteFood, setFavoriteFood)}
            />
            {food}
          </label>
        ))}
      </div>

      <label>Preferred Cities:</label>
      <div className="multi-select-box">
        {cityOptions.map((city) => (
          <label key={city}>
            <input
              type="checkbox"
              checked={preferredCities.includes(city)}
              onChange={() => handleToggle(city, preferredCities, setPreferredCities)}
            />
            {city}
          </label>
        ))}
      </div>

      <label>Budget Range:</label>
      <select value={budget} onChange={(e) => setBudget(e.target.value)}>
        <option value="">Select</option>
        {budgetRanges.map((range) => (
          <option key={range} value={range}>{range}</option>
        ))}
      </select>

      <label>Start Date:</label>
      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

      <label>End Date:</label>
      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

      {error && <p className="error-text">{error}</p>}

      <button className="generate-btn" onClick={handleSubmit}>
        Generate AI Itinerary
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Itinerary Already Exists</h2>
            <p>You already have an itinerary for these dates. What would you like to do?</p>
            <div className="modal-buttons">
              <button className="use-old-btn" onClick={handleUseExisting}>Use Existing</button>
              <button className="create-new-btn" onClick={handleCreateNew}>Create New</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiPreferences;

