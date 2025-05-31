// ManualPlaceSelection.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { fetchPlacesByText } from "../lib/google/fetchPlaces";
import { supabase } from "../components/supabaseConfig";
import { v4 as uuidv4 } from "uuid";
import "./ManualPlaceSelection.css";

import abhaImg from "../assets/AbhaClean.jpg";
import alulaImg from "../assets/AlUlaClean.jpg";
import dammamImg from "../assets/dammam1.jpg";
import diriyahImg from "../assets/diriyah1.jpg";
import jazanImg from "../assets/jazan1.jpg";
import jeddahImg from "../assets/jeddahClean.jpg";
import jubailImg from "../assets/jubail1.jpg";
import madinahImg from "../assets/madinahClean.jpg";
import makkahImg from "../assets/MakkahClean.jpg";
import riyadhImg from "../assets/riyadh1.jpg";
import tabukImg from "../assets/tabuk1.jpg";
import taifImg from "../assets/taif1.jpg";
import khobarImg from "../assets/Khobar.jpg";
import hailimage from "../assets/hailimag.png"

const cityBackgrounds: Record<string, string> = {
  "Riyadh": riyadhImg,
  "Jeddah": jeddahImg,
  "Makkah": makkahImg,
  "Medinah": madinahImg,
  "Dammam": dammamImg,
  "Al Khobar": khobarImg,
  "Abha": abhaImg,
  "Taif": taifImg,
  "AlUla": alulaImg,
  "Jazan": jazanImg,
  "Tabuk": tabukImg,
  "Diriyah": diriyahImg,
  "Al Jubail": jubailImg,
  "Hail": hailimage,
};


const allCities = [
  "Riyadh", "Jeddah", "Makkah", "Madinah", "Dammam",
  "Al Khobar", "Abha", "Taif", "AlUla", "Jazan", "Tabuk", "Diriyah", "Al Jubail", "Hail"
];

type Place = {
  name: string;
  address: string;
  stars: number | null;
  imageUrl: string | null;
  type: string[];
  lat: number;
  lng: number;
};


type PlaceType = "restaurant" | "tourist_attraction" | "hotel" | "cafe" | "mosque" | "shopping_mall";


function useQuery() {
  return new URLSearchParams(window.location.search);
}


const ManualPlaceSelection: React.FC = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const dayIndex = parseInt(query.get("dayIndex") || "0", 10);

  
  const [selectedCity, setSelectedCity] = useState<string>(query.get("city") || "");
  const [selectedType, setSelectedType] = useState<PlaceType>("restaurant");
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceNames, setSelectedPlaceNames] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const itineraryId = localStorage.getItem("itineraryId");

  // Load itinerary start/end dates from localStorage on initial load
  useEffect(() => {
    const storedStart = localStorage.getItem("itineraryStartDate");
    const storedEnd = localStorage.getItem("itineraryEndDate");
    if (storedStart) setStartDate(dayjs(storedStart));
    if (storedEnd) setEndDate(dayjs(storedEnd));
  }, []);

  
  useEffect(() => {
    if (!selectedCity || !selectedType) return;
    fetchPlacesByText(selectedCity, selectedType).then(setPlaces);
  }, [selectedCity, selectedType]);

  
  const selectedBackground = selectedCity && cityBackgrounds[selectedCity];

  useEffect(() => {
    const root = document.querySelector('.manual-place-page') as HTMLElement;
    if (root) {
      if (selectedBackground) {
        root.style.setProperty('--background-image', `url(${selectedBackground})`);
      } else {
        root.style.setProperty('--background-image', `url(/src/assets/MainPic.jpg)`);
      }
    }
  }, [selectedBackground]);

  
  const togglePlace = async (place: Place) => {
    if (!itineraryId || !selectedCity) return;
    const isSelected = selectedPlaceNames.includes(place.name);

    
    const { data: dailyPlans } = await supabase
      .from("daily_plans")
      .select("id")
      .eq("itinerary_id", itineraryId)
      .eq("day_number", dayIndex + 1)
      .eq("city", selectedCity)
      .limit(1);

    let dailyPlanId = dailyPlans?.[0]?.id;
    if (!dailyPlanId) {
      dailyPlanId = uuidv4();
      await supabase.from("daily_plans").insert({
        id: dailyPlanId,
        itinerary_id: itineraryId,
        day_number: dayIndex + 1,
        city: selectedCity,
      });
    }

    
    if (isSelected) {
      await supabase
        .from("selected_places")
        .delete()
        .match({ daily_plan_id: dailyPlanId, place_name: place.name });
    } else {
      await supabase.from("selected_places").insert({
        id: uuidv4(),
        daily_plan_id: dailyPlanId,
        place_name: place.name,
        address: place.address,
        image_url: place.imageUrl,
        type: place.type.join(", "),
        lat: place.lat,
        lng: place.lng,
      });
    }

    
    setSelectedPlaceNames((prev) =>
      isSelected ? prev.filter((p) => p !== place.name) : [...prev, place.name]
    );
  };

  
  const goToNextDay = () => {
    const totalDays = startDate && endDate ? endDate.diff(startDate, "day") + 1 : 1;
    if (dayIndex + 1 >= totalDays) {
      setShowSummary(true);
    } else {
      navigate(`/ManualPlaceSelection?dayIndex=${dayIndex + 1}`);
      setSelectedCity("");
      setPlaces([]);
    }
  };

  
  const goToPreviousDay = () => {
    if (dayIndex > 0) {
      navigate(`/ManualPlaceSelection?dayIndex=${dayIndex - 1}&city=${selectedCity}`);
    }
  };

  
  const getTypeIcon = (place: Place) => {
    if (place.type.includes("restaurant")) return "🍽️";
    if (place.type.includes("tourist_attraction")) return "🏜️";
    if (place.type.includes("hotel")) return "🏨";
    if (place.type.includes("cafe")) return "☕";
    if (place.type.includes("mosque")) return "🕌";
    if (place.type.includes("shopping_mall")) return "🛍️";
    return "📍";
  };

  return (
    <div className="manual-place-page">
      <h1 className="selection-heading">
        Select Places for Day {dayIndex + 1}{selectedCity && ` in ${selectedCity}`}
      </h1>

      <Box className="selection-controls">
      <FormControl variant="outlined" className="control">
  <InputLabel id="select-city-label">Select City</InputLabel>
  <Select
    labelId="select-city-label"
    value={selectedCity}
    label="Select City"
    onChange={(e) => {
      setSelectedCity(e.target.value);
      navigate(`/ManualPlaceSelection?dayIndex=${dayIndex}&city=${e.target.value}`);
    }}
  >
    {allCities.map((city) => (
      <MenuItem key={city} value={city}>{city}</MenuItem>
    ))}
  </Select>
</FormControl>

<FormControl variant="outlined" className="control">
  <InputLabel id="select-type-label">Type</InputLabel>
  <Select
    labelId="select-type-label"
    value={selectedType}
    label="Type"
    onChange={(e) => setSelectedType(e.target.value as PlaceType)}
  >
    <MenuItem value="restaurant">Restaurants</MenuItem>
    <MenuItem value="tourist_attraction">Tourist Attractions</MenuItem>
    <MenuItem value="hotel">Hotels</MenuItem>
    <MenuItem value="cafe">Cafes</MenuItem>
    <MenuItem value="mosque">Mosques</MenuItem>
    <MenuItem value="shopping_mall">Shopping Malls</MenuItem>
  </Select>
</FormControl>
      </Box>

      {selectedCity && places.length > 0 && (
        <div className="places-grid">
          {places.map((place, idx) => {
            const isSelected = selectedPlaceNames.includes(place.name);
            return (
              <div key={idx} className="place-card">
                {place.imageUrl ? (
                  <img src={place.imageUrl} alt={place.name} className="place-img" />
                ) : (
                  <div className="placeholder-img">No Image</div>
                )}
                <div className="place-details">
                  <h3 className="place-title">
                    {getTypeIcon(place)} {place.name}
                  </h3>
                  <p className="place-address">📍 {place.address}</p>
                  <p className="place-stars">⭐ {place.stars ?? "N/A"} stars</p>
                  <Button
                    onClick={() => togglePlace(place)}
                    className={isSelected ? "toggle-btn remove" : "toggle-btn add"}
                  >
                    {isSelected ? "Remove" : "Add to Itinerary"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Box className="nav-buttons">
        <Button
          variant="contained"
          disabled={dayIndex === 0}
          onClick={goToPreviousDay}
          className="nav-btn prev-btn"
          href="#top"
        >
          Previous Day
        </Button>
        <Button
          variant="contained"
          onClick={goToNextDay}
          className="nav-btn next-btn"
          href="#top"
        >
          Next Day
        </Button>
      </Box>

      <Dialog open={showSummary} onClose={() => setShowSummary(false)}>
        <DialogTitle>Itinerary Completed</DialogTitle>
        <DialogContent>
          <Typography>🎉 You’ve completed your itinerary selection for all days!</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate(`/ItineraryDetails?id=${itineraryId}`)}>View on Map</Button>
          <Button onClick={() => setShowSummary(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ManualPlaceSelection;
