import axios from "axios";
export async function fetchPlacesByText(
  city: string,
  type: "restaurant" | "tourist_attraction" | "hotel" | "cafe" | "mosque" | "shopping_mall"
) {
  try {
    // Call your backend API which internally connects to Google Places API
    const response = await axios.get("http://localhost:3001/api/places", {
      params: { city, type }, // send city and type as query parameters
    });

    // Return the fetched place data
    return response.data;
  } catch (error) {
    // Log and return an empty array on error
    console.error("Error fetching places from backend:", error);
    return [];
  }
}
