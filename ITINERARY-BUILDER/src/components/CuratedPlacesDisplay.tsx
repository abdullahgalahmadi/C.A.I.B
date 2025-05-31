import React, { useState } from "react";
import placesJson from "../sample-places-clean.json"; 
import "./CuratedPlacesDisplay.css";

type Place = {
  name: string;
  stars: number | null;
  description: string;
  address_line: string;
  type: string[];
  url?: string | null;
  opening_hours?: Record<string, string[]>;
  imageUrl?: string;
  city: string;
};

type Props = {
  mode: "explore" | "manual";
};

const placesData: Place[] = placesJson as unknown as Place[];

const CuratedPlacesDisplay: React.FC<Props> = ({ mode }) => {
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const placesPerPage = 10;

  const allCities = ["All", ...Array.from(new Set(placesData.map((p) => p.city)))];
  const allCategories = ["All", "Attractions", "Restaurants"];

  const filterByType = (place: Place): boolean => {
    if (selectedCategory === "All") return true;
    const lowerTypes = place.type.map((t) => t.toLowerCase());
    const isRestaurant = ["restaurant", "diner", "steak", "shawarma", "burger", "pizza", "grill", "cafe"]
      .some((r) => lowerTypes.some((type) => type.includes(r)));
    return selectedCategory === "Restaurants" ? isRestaurant : !isRestaurant;
  };

  const filteredPlaces = placesData.filter((place) => {
    const cityMatch = selectedCity === "All" || place.city === selectedCity;
    const typeMatch = filterByType(place);
    const searchMatch = place.name.toLowerCase().includes(searchQuery.toLowerCase());
    return cityMatch && typeMatch && searchMatch;
  });

  const indexOfLastPlace = currentPage * placesPerPage;
  const indexOfFirstPlace = indexOfLastPlace - placesPerPage;
  const currentPlaces = filteredPlaces.slice(indexOfFirstPlace, indexOfLastPlace);

  const totalPages = Math.ceil(filteredPlaces.length / placesPerPage);

  return (
    <div className="curated-container">
      <h2 className="curated-header">Discover Curated Places</h2>

      <div className="curated-filters">
        <select
          className="filter-select"
          value={selectedCity}
          onChange={(e) => {
            setSelectedCity(e.target.value);
            setCurrentPage(1);
          }}
        >
          {allCities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setCurrentPage(1);
          }}
        >
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <input
          type="text"
          className="filter-input"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {currentPlaces.length === 0 ? (
        <p className="no-places">No places found.</p>
      ) : (
        <>
          <div className="places-grid">
            {currentPlaces.map((place, index) => (
              <div key={index} className="place-card">
                {place.imageUrl ? (
                  <img
                    src={place.imageUrl}
                    alt={place.name}
                    referrerPolicy="no-referrer"
                    className="place-image"
                  />
                ) : (
                  <div className="placeholder-img">No Image</div>
                )}

                <div className="card-content">
                  <h3 className="place-title">{place.name}</h3>
                  <p className="place-rating">⭐ <strong>{place.stars}</strong> stars</p>
                  <p className="place-description">
                    {place.description || "No description available"}
                  </p>
                  <p className="place-address">📍 {place.address_line}</p>
                  <p className="place-type">🏷️ {place.type.join(", ")}</p>

                  {place.url && (
                    <a
                      href={place.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="place-link"
                    >
                      🔗 Visit Website
                    </a>
                  )}

                  {place.opening_hours && (
                    <details className="opening-hours">
                      <summary>🕒 Opening Hours</summary>
                      <ul className="hours-list">
                        {Object.entries(place.opening_hours).map(([day, times]) => (
                          <li key={day}>
                            <strong>{day}:</strong> {times.join(", ")}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                </div>
              </div>
            ))}
          </div>

          {/* Pagination Buttons */}
          <div className="pagination">
            <button
              onClick={() => {
                setCurrentPage((prev) => Math.max(prev - 1, 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={currentPage === 1}
            >
              ⬅️ Previous
            </button>

            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => {
                setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={currentPage === totalPages}
            >
              Next ➡️
            </button>
          </div>

        </>
      )}
    </div>
  );
};

export default CuratedPlacesDisplay;
