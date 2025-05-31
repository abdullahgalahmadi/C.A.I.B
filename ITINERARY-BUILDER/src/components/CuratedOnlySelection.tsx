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
import placesJson from "../sample-places-clean.json";
import dayjs from "dayjs";
import { supabase } from "./supabaseConfig";
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

// Hook to read query params
function useQuery() {
  return new URLSearchParams(window.location.search);
}

type Place = {
  name: string;
  stars: number | null;
  description: string;
  address_line: string;
  type: string[];
  imageUrl?: string;
  city: string;
};

const CuratedOnlySelection: React.FC = () => {
  const query = useQuery();
  const dayIndex = parseInt(query.get("dayIndex") || "0", 10);
  const navigate = useNavigate();
  const itineraryId = localStorage.getItem("itineraryId");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedType, setSelectedType] = useState<"Restaurants" | "Attractions">("Restaurants");
  const [selectedPlaceNames, setSelectedPlaceNames] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const curatedCities = Array.from(
    new Set((placesJson as Place[]).map((p) => p.city))
  ).sort();

  useEffect(() => {
    const storedStart = localStorage.getItem("itineraryStartDate");
    const storedEnd = localStorage.getItem("itineraryEndDate");
    if (storedStart) setStartDate(dayjs(storedStart));
    if (storedEnd) setEndDate(dayjs(storedEnd));
  }, []);

  const selectedBackground = selectedCity && cityBackgrounds[selectedCity];
  useEffect(() => {
    const root = document.querySelector('.manual-place-page') as HTMLElement;
    if (root) {
      root.style.setProperty(
        '--background-image',
        selectedBackground ? `url(${selectedBackground})` : `url(/src/assets/MainPic.jpg)`
      );
    }
  }, [selectedBackground]);

  const visitDate = startDate?.add(dayIndex, "day").format("YYYY-MM-DD");

  const filteredPlaces = (placesJson as Place[]).filter((p) => {
    if (selectedCity && p.city !== selectedCity) return false;

    const lowerTypes = p.type.map((t) => t.toLowerCase());
    const isRestaurant = ["restaurant", "diner", "steak", "shawarma", "burger", "pizza", "grill", "cafe"]
      .some((r) => lowerTypes.some((type) => type.includes(r)));

    return selectedType === "Restaurants" ? isRestaurant : !isRestaurant;
  });

  const handleTogglePlace = async (place: Place) => {
    if (!itineraryId || !visitDate) return;

    const { data: dailyPlans } = await supabase
      .from("daily_plans")
      .select("id")
      .eq("itinerary_id", itineraryId)
      .eq("day_number", dayIndex + 1)
      .eq("city", place.city)
      .limit(1);

    let dailyPlanId = dailyPlans?.[0]?.id;
    if (!dailyPlanId) {
      const { data } = await supabase.from("daily_plans").insert({
        id: uuidv4(),
        itinerary_id: itineraryId,
        day_number: dayIndex + 1,
        city: place.city,
      }).select();
      dailyPlanId = data?.[0]?.id;
    }

    const isSelected = selectedPlaceNames.includes(place.name);

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
        address: place.address_line,
        image_url: place.imageUrl,
        type: place.type.join(", "),
        lat: null,
        lng: null,
      });
    }

    setSelectedPlaceNames((prev) =>
      isSelected ? prev.filter((n) => n !== place.name) : [...prev, place.name]
    );
  };

  const totalDays = startDate && endDate ? endDate.diff(startDate, "day") + 1 : 1;

  const handleNext = () => {
    if (dayIndex + 1 >= totalDays) {
      setShowSummary(true);
    } else {
      navigate(`/CuratedOnlySelection?dayIndex=${dayIndex + 1}`);
    }
  };

  const handlePrevious = () => {
    if (dayIndex > 0) {
      navigate(`/CuratedOnlySelection?dayIndex=${dayIndex - 1}`);
    }
  };

  return (
    <div className="manual-place-page">
      <h1 className="selection-heading">
        Select Curated Places for Day {dayIndex + 1}{selectedCity && ` in ${selectedCity}`}
      </h1>

      <Box className="selection-controls">
        <FormControl variant="outlined" className="control">
          <InputLabel id="select-city-label">Select City</InputLabel>
          <Select
            labelId="select-city-label"
            value={selectedCity}
            label="Select City"
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            {curatedCities.map((city) => (
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
            onChange={(e) => setSelectedType(e.target.value as "Restaurants" | "Attractions")}
          >
            <MenuItem value="Restaurants">Restaurants</MenuItem>
            <MenuItem value="Attractions">Attractions</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {filteredPlaces.length > 0 ? (
        <div className="places-grid">
          {filteredPlaces.map((place, idx) => {
            const isSelected = selectedPlaceNames.includes(place.name);
            return (
              <div key={idx} className="place-card">
                {place.imageUrl ? (
                  <img src={place.imageUrl} alt={place.name} className="place-img" />
                ) : (
                  <div className="placeholder-img">No Image</div>
                )}
                <div className="place-details">
                  <h3 className="place-title">{place.name}</h3>
                  <p className="place-address">📍 {place.address_line}</p>
                  <p className="place-stars">⭐ {place.stars ?? "N/A"} stars</p>
                  <Button
                    onClick={() => handleTogglePlace(place)}
                    className={isSelected ? "toggle-btn remove" : "toggle-btn add"}
                  >
                    {isSelected ? "Remove" : "Add to Itinerary"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Typography align="center" color="textSecondary" mt={4}>
          No curated places match your selection.
        </Typography>
      )}

      <Box className="nav-buttons">
        <Button
          variant="contained"
          disabled={dayIndex === 0}
          onClick={handlePrevious}
          className="nav-btn prev-btn"
        >
          Previous Day
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          className="nav-btn next-btn"
        >
          {dayIndex + 1 >= totalDays ? "Finish Planning" : "Next Day"}
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

export default CuratedOnlySelection;
