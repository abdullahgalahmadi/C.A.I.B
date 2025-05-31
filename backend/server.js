const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const { getRecommendations } = require('./recommend');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 3001;

app.use(express.json({ limit: "10mb" }));
app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

app.get('/api/places', async (req, res) => {
  const { city, type } = req.query;

  if (!city || !type) {
    return res.status(400).json({ error: "Missing city or type" });
  }

  let query;
  switch (type) {
    case "restaurant": query = `top restaurants in ${city} Saudi Arabia`; break;
    case "tourist_attraction": query = `top tourist attractions in ${city} Saudi Arabia`; break;
    case "hotel": query = `top hotels in ${city} Saudi Arabia`; break;
    case "cafe": query = `best cafes in ${city} Saudi Arabia`; break;
    case "mosque": query = `beautiful mosques in ${city} Saudi Arabia`; break;
    case "shopping_mall": query = `top shopping malls in ${city} Saudi Arabia`; break;
    default: query = `places in ${city} Saudi Arabia`;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
    const response = await axios.get(url, {
      params: {
        query,
        key: process.env.VITE_GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== "OK") {
      console.warn("Google API issue:", response.data.status, response.data.error_message);
      return res.json([]);
    }

    const results = response.data.results || [];
    const filteredResults = results.filter(place =>
      place.formatted_address?.toLowerCase().includes(city.toLowerCase())
    );

    const places = filteredResults
      .filter(place => place.photos?.[0]?.photo_reference)
      .slice(0, 10)
      .map(place => {
        const photoRef = place.photos[0].photo_reference;
        const imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`;

        let mappedType = [];
        if (place.types.includes("restaurant")) mappedType.push("restaurant");
        if (place.types.includes("tourist_attraction")) mappedType.push("tourist_attraction");
        if (place.types.includes("lodging")) mappedType.push("hotel");
        if (place.types.includes("cafe")) mappedType.push("cafe");
        if (place.types.includes("mosque")) mappedType.push("mosque");
        if (place.types.includes("shopping_mall")) mappedType.push("shopping_mall");
        if (mappedType.length === 0) mappedType = ["other"];

        return {
          name: place.name,
          address: place.formatted_address,
          stars: place.rating ?? null,
          type: mappedType,
          imageUrl,
          lat: place.geometry?.location?.lat ?? null,
          lng: place.geometry?.location?.lng ?? null,
        };
      });

    res.json(places);
  } catch (error) {
    console.error("❌ Google Places error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/generate-ai-itinerary", async (req, res) => {
  const { prompt } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const chat = model.startChat({
      generationConfig: {
        temperature: 1,
        topK: 64,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    const result = await chat.sendMessage(prompt);
    const responseText = result.response.text();

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (err) {
      return res.status(500).json({
        error: "Gemini returned invalid JSON",
        details: err.message,
        raw: responseText,
      });
    }

    return res.json({ result: parsed });

  } catch (err) {
    
    if (err?.response?.status) {
      return res.status(err.response.status).json({
        error: `Gemini API error: ${err.response.statusText}`,
        status: err.response.status,
      });
    } else if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: "Connection to Gemini API refused." });
    } else if (err instanceof SyntaxError) {
      return res.status(500).json({ error: "Syntax error in AI response", details: err.message });
    } else {
      return res.status(500).json({
        error: "Unexpected error while generating AI itinerary",
        message: err.message || err.toString(),
      });
    }
  }
});

app.post("/generate-summary", async (req, res) => {
  const { itinerary } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(`
      You are a helpful AI travel assistant. Convert this JSON into a fun and friendly paragraph about the trip, without saying "summary of your trip":

      ${JSON.stringify(itinerary, null, 2)}

      Use a tone like: "Get ready for an exciting three-day adventure through Saudi Arabia! You'll start in Riyadh..."
    `);

    const summary = result.response.text();
    res.json({ summary });

  } catch (err) {
    console.error("Gemini summary error:", err);
    res.status(500).json({ error: "Failed to generate summary." });
  }
});


app.post('/api/recommend', (req, res) => {
  const { vector } = req.body;

  if (!vector || !Array.isArray(vector) || vector.length !== 5) {
    return res.status(400).json({ error: "Invalid user vector" });
  }

  try {
    const recommendations = getRecommendations(vector, 12);
    res.json(recommendations);
  } catch (err) {
    console.error("📈 Recommendation error:", err);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
