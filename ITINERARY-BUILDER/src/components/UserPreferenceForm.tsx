import React, { useState, useEffect } from "react";
import "./UserPreferenceForm.css";

interface Props {}

const UserPreferenceForm: React.FC<Props> = () => {
  const [outdoor, setOutdoor] = useState(false);
  const [culture, setCulture] = useState(false);
  const [family, setFamily] = useState(false);
  const [food, setFood] = useState(false);
  const [rating, setRating] = useState(3);
  const [results, setResults] = useState<any[]>([]);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

  useEffect(() => {
    const reason = localStorage.getItem("fallback_reason");
    if (reason) {
      setFallbackReason(reason);
      localStorage.removeItem("fallback_reason");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vector = [
      outdoor ? 1 : 0,
      culture ? 1 : 0,
      family ? 1 : 0,
      food ? 1 : 0,
      rating / 5,
    ];

    try {
      const response = await fetch("http://localhost:3001/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vector }),
      });

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
    }
  };

  return (
    <div className="preference-form-container">
      <h2>🧭 What kind of places do you like?</h2>

      {fallbackReason && (
        <p className="fallback-message">
          ⚠️ Gemini failed: {fallbackReason}. Showing recommendations instead.
        </p>
      )}

      <form onSubmit={handleSubmit} className="preference-form">
        <label>
          <input type="checkbox" checked={outdoor} onChange={() => setOutdoor(!outdoor)} />
          Outdoor / Nature
        </label>
        <label>
          <input type="checkbox" checked={culture} onChange={() => setCulture(!culture)} />
          Cultural / Heritage
        </label>
        <label>
          <input type="checkbox" checked={family} onChange={() => setFamily(!family)} />
          Family Friendly
        </label>
        <label>
          <input type="checkbox" checked={food} onChange={() => setFood(!food)} />
          Food / Restaurants
        </label>
        <label>
          Minimum Rating: {rating} / 4
          <input type="range" min={1} max={4} value={rating} onChange={(e) => setRating(Number(e.target.value))} />
        </label>

        <button type="submit">Find Places</button>
      </form>

      {results.length > 0 && (
        <div className="places-grid">
          {results.map((place, idx) => (
            <div key={idx} className="place-card">
              {place.imageUrl ? (
                <img
                  src={place.imageUrl}
                  alt={place.name}
                  referrerPolicy="no-referrer"
                  className="place-image"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x180?text=No+Image";
                  }}
                />
              ) : (
                <div className="placeholder-img">No Image</div>
              )}
              <div className="place-info">
                <h3>{place.name}</h3>
                <p>📍 {place.city}</p>
                <p>⭐ {place.stars ?? "N/A"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserPreferenceForm;
