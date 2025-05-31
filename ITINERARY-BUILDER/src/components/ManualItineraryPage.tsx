// ManualItineraryScheduler.tsx
import React, { useState, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs"; 
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"; 
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"; 
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker"; 
import { Box, Typography, Button } from "@mui/material"; 
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseConfig";
import "./ManualItineraryPage.css";
import { fetchPlacesByText } from "../lib/google/fetchPlaces"; 


const ManualItineraryPage: React.FC = () => {
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs()); 
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().add(1, "day")); 
  const navigate = useNavigate();
  
  useEffect(() => {
    if (startDate && endDate) {
      localStorage.setItem("itineraryStartDate", startDate.toISOString());
      localStorage.setItem("itineraryEndDate", endDate.toISOString());
    }
  }, [startDate, endDate]);

  const confirmDates = async () => {
    if (!startDate || !endDate) return;
  
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
  
    if (userError || !user) {
      alert("User not authenticated.");
      return;
    }
    // Save itinerary to Supabase database
    const { data: itinerary, error: itineraryError } = await supabase
      .from("manual_itineraries")
      .insert([
        {
          user_id: user.id,
          start_date: startDate.format("YYYY-MM-DD"),
          end_date: endDate.format("YYYY-MM-DD"),
        },
      ])
      .select()
      .single(); // get the inserted row
  
    if (itineraryError || !itinerary) {
      console.error("Error saving itinerary:", itineraryError);
      alert("Failed to create itinerary.");
      return;
    }
    
    localStorage.setItem("itineraryId", itinerary.id);
    localStorage.setItem("itineraryStartDate", startDate.toISOString());
    localStorage.setItem("itineraryEndDate", endDate.toISOString());
    localStorage.removeItem("itinerarySelections");
  
    try {
      const response = await fetch("http://localhost:3001/api/places?city=Riyadh&type=restaurant");
      const result = await response.json();
      // If real results found move ti manual place selection
      if (Array.isArray(result) && result.length > 0) {
        navigate("/ManualPlaceSelection?dayIndex=0");
      } else { // move to curatedOnlySelection
        navigate("/CuratedOnlySelection?dayIndex=0");
      }
    } catch (err) {
      console.error("Google Places API failed, redirecting to curated:", err);
      navigate("/CuratedOnlySelection?dayIndex=0");
    }
    
    
  };
  

  return (
    <div className="scheduler-container">
      <h1 className="scheduler-heading">
        Select Your Trip Duration
      </h1>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box display="flex" justifyContent="center" gap={4} flexWrap="wrap">
          <Box>
            <Typography variant="h6" align="center">Start Date</Typography>
            <StaticDatePicker
              displayStaticWrapperAs="desktop"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
            />
          </Box>
          <Box>
            <Typography variant="h6" align="center">End Date</Typography>
            <StaticDatePicker
              displayStaticWrapperAs="desktop"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              minDate={startDate || undefined} 
            />
          </Box>
        </Box>
      </LocalizationProvider>

      <Box mt={4} textAlign="center">
        <Typography variant="subtitle1" className="duration-text">
          Trip Duration: <strong>{startDate?.format("MMM D, YYYY")}</strong> to{" "}
          <strong>{endDate?.format("MMM D, YYYY")}</strong>
        </Typography>
        <br />
        <Button
          variant="contained"
          color="primary"
          onClick={confirmDates}
          className="confirm-btn"
        >
          Confirm Dates & Start Planning
        </Button>
      </Box>
    </div>
  );
};

export default ManualItineraryPage;
