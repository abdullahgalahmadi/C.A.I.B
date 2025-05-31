import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../components/supabaseConfig";
import EditPlaceModal from "./EditPlaceModal";
import "./ItineraryDetails.css";

declare global {
  interface Window {
    google: any;
  }
}

type Place = {
  id?: string;
  name: string;
  city: string;
  day: number;
  lat: number;
  lng: number;
  image_url?: string;
  address?: string;
};

const ROUTES_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;


function useQuery() {
  return new URLSearchParams(window.location.search);
}

const ItineraryDetails: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comments, setComments] = useState<string>("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [editingFeedback, setEditingFeedback] = useState<boolean>(false);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [distanceText, setDistanceText] = useState<string | null>(null);
  const [totalDuration, setTotalDuration] = useState<string | null>(null);
  const [isDrawingRoute, setIsDrawingRoute] = useState<boolean>(false);
  const [tripLoaded, setTripLoaded] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [editingCity, setEditingCity] = useState<string>("");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);

    const previews = fileArray.map((file) => URL.createObjectURL(file));
    setPreviewUrls(previews);
  };



  const query = useQuery();
  const itineraryId = query.get("id");


  
  useEffect(() => {

    if (!window.google?.maps || !itineraryId) return;

    const fetchAndRenderMap = async () => {
      // Fetch existing feedback once map loads
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      if (userId) {
        const { data: feedback } = await supabase
          .from("itinerary_feedback")
          .select("*")
          .eq("user_id", userId)
          .eq("itinerary_id", itineraryId)
          .maybeSingle();

        if (feedback) {
          setRating(feedback.rating || 0);
          setComments(feedback.comments || "");
          setImageUrls(feedback.image_urls || []);
          setFeedbackId(feedback.id);
          setFeedbackSubmitted(true);
        }
      }

      const { Map } = (await window.google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
      const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker");

      await window.google.maps.importLibrary("geometry");

      // defining the borders of the map
      const map = new Map(mapRef.current!, {
        center: { lat: 23.8859, lng: 45.0792 },
        zoom: 5.8,
        mapId: "ROADMAP",
        restriction: {
          latLngBounds: {
            north: 38,
            south: 10,
            west: 25,
            east: 65,
          },
          strictBounds: true, 
        },
      });

      map.data.loadGeoJson("/saudi-provinces.geojson");

      map.data.setStyle({
        fillColor: "#A9CCE3",
        fillOpacity: 0.2,
        strokeColor: "#006C35", // green
        strokeWeight: 2,
      });

      const infoWindow = new window.google.maps.InfoWindow();


      map.data.addListener("mouseover", (event: any) => {
        const provinceName = event.feature.getProperty("NL_NAME_1");
        infoWindow.setContent(provinceName);
        infoWindow.setPosition(event.latLng);
        infoWindow.open(map);

        
        infoWindow.setContent(`
          <div style="
            background: #ffffffcc;
            border: 2px solid #2563eb;
            padding: 10px 16px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            color: #1e3a8a;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            text-align: center;
            font-family: 'Segoe UI', sans-serif;
          ">
            📍 ${provinceName}
          </div>
        `);
      });

      map.data.addListener("mouseout", () => {
        infoWindow.close();
      });



      const { data: itineraryData } = await supabase
        .from('manual_itineraries')
        .select('type, ai_description')
        .eq('id', itineraryId)
        .single();

      if (itineraryData?.type === 'ai') {
        setAiDescription(itineraryData.ai_description);
      }

      const { data: dailyPlans } = await supabase
        .from("daily_plans")
        .select("id, day_number, city")
        .eq("itinerary_id", itineraryId);

      const dailyPlanMap: Record<string, { day: number; city: string }> = {};
      dailyPlans?.forEach((plan) => {
        dailyPlanMap[plan.id] = { day: plan.day_number, city: plan.city };
      });

      const planIds = Object.keys(dailyPlanMap);
      if (planIds.length === 0) return;

      const { data: placesData } = await supabase
        .from("selected_places")
        .select("id, place_name, lat, lng, image_url, address, daily_plan_id")
        .in("daily_plan_id", planIds);

      const formatted: Place[] = placesData?.map((entry: any) => ({
        id: entry.id,
        name: entry.place_name,
        lat: entry.lat,
        lng: entry.lng,
        image_url: entry.image_url,
        address: entry.address,
        day: dailyPlanMap[entry.daily_plan_id]?.day,
        city: dailyPlanMap[entry.daily_plan_id]?.city,
      })) || [];

      setPlaces(formatted);

      const allLatLngs: google.maps.LatLngLiteral[] = [];
      formatted.forEach((place) => {
        const position = { lat: place.lat, lng: place.lng };
        allLatLngs.push(position);

        const imgDiv = document.createElement("div");
        imgDiv.style.width = "50px";
        imgDiv.style.height = "50px";
        imgDiv.style.borderRadius = "50%";
        imgDiv.style.overflow = "hidden";
        imgDiv.style.boxShadow = "0 0 5px rgba(0,0,0,0.3)";
        imgDiv.style.border = "2px solid white";

        const img = document.createElement("img");
        img.src = place.image_url || "";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";

        imgDiv.appendChild(img);

        // Now create the marker
        new AdvancedMarkerElement({
          map,
          position,
          content: imgDiv,
        });

      });

      if (allLatLngs.length > 1) {
        await drawAnimatedRoute(map, allLatLngs);
        await computeTotalTripDistanceTime(formatted); 
      }
    };

    fetchAndRenderMap();
  }, [itineraryId]);





  
  const drawAnimatedRoute = async (map: any, allLatLngs: google.maps.LatLngLiteral[]) => {
    setIsDrawingRoute(true);
    setTripLoaded(true);

    setTimeout(() => {
      setTripLoaded(false);
    }, 3000);

    const url = `https://routes.googleapis.com/directions/v2:computeRoutes`;

    const body = {
      origin: { location: { latLng: { latitude: allLatLngs[0].lat, longitude: allLatLngs[0].lng } } },
      destination: { location: { latLng: { latitude: allLatLngs[allLatLngs.length - 1].lat, longitude: allLatLngs[allLatLngs.length - 1].lng } } },
      intermediates: allLatLngs.slice(1, -1).map(p => ({ location: { latLng: { latitude: p.lat, longitude: p.lng } } })),
      travelMode: "DRIVE",
      languageCode: "en-US",
      units: "METRIC",
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": ROUTES_API_KEY,
        "X-Goog-FieldMask": "*",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (data.routes?.length) {
      const route = data.routes[0];
      const path = window.google.maps.geometry.encoding.decodePath(route.polyline.encodedPolyline);

      const animatedLine = new window.google.maps.Polyline({
        path: [],
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 4,
      });

      animatedLine.setMap(map);

      let step = 0;
      const skip = 30;
      const interval = setInterval(() => {
        if (step >= path.length) {
          clearInterval(interval);
          setIsDrawingRoute(false);
          setTripLoaded(true);
          return;
        }
        const currentPath = animatedLine.getPath();
        currentPath.push(path[step]);
        step += skip;
      }, 15);
    }
  };
  
  const computeTotalTripDistanceTime = async (places: Place[]) => {
    let totalDistance = 0;
    let totalDurationSeconds = 0;

    // Sort places by day and appearance order 
    const sorted = [...places].sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.name.localeCompare(b.name);
    });

    for (let i = 0; i < sorted.length - 1; i++) {
      const origin = sorted[i];
      const destination = sorted[i + 1];

      const body = {
        origins: [
          {
            waypoint: {
              location: {
                latLng: {
                  latitude: origin.lat,
                  longitude: origin.lng,
                },
              },
            },
          },
        ],
        destinations: [
          {
            waypoint: {
              location: {
                latLng: {
                  latitude: destination.lat,
                  longitude: destination.lng,
                },
              },
            },
          },
        ],
        travelMode: "DRIVE",
        units: "METRIC",
      };

      const response = await fetch("https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": ROUTES_API_KEY,
          "X-Goog-FieldMask": "*",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      const element = data[0];
      if (element?.distanceMeters && element?.duration) {
        totalDistance += element.distanceMeters;
        totalDurationSeconds += parseInt(element.duration.replace("s", ""));
      }
    }

    const km = (totalDistance / 1000).toFixed(1);
    const hrs = Math.floor(totalDurationSeconds / 3600);
    const mins = Math.floor((totalDurationSeconds % 3600) / 60);

    setDistanceText(`🛣️ Total Distance: ${km} km`);
    setTotalDuration(`🕑 Total Time: ${hrs} hrs ${mins} mins`);
  };



  
  const renderStars = () => (
    <div className="rating-container">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className={star <= (hoverRating || rating) ? "filled-star" : "empty-star"}
        >
          ★
        </span>
      ))}
    </div>
  );

 
  const handleSubmitFeedback = async () => {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId || !itineraryId || rating < 1) return;

    let uploadedImageUrls: string[] = [];

    if (selectedFiles.length > 0) {
      const uploadPromises = selectedFiles.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const filePath = `feedback-images/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("places-images") // Use your correct bucket name here
          .upload(filePath, file);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("places-images")
            .getPublicUrl(filePath);
          uploadedImageUrls.push(urlData.publicUrl);
        }
      });

      await Promise.all(uploadPromises);
    }

    if (editingFeedback && feedbackId) {
      await supabase
        .from("itinerary_feedback")
        .update({ rating, comments, image_urls: uploadedImageUrls })
        .eq("id", feedbackId);
    } else {
      const { data } = await supabase
        .from("itinerary_feedback")
        .insert({
          user_id: userId,
          itinerary_id: itineraryId,
          rating,
          comments,
          image_urls: uploadedImageUrls,
        })
        .select("id")
        .single();

      setFeedbackId(data?.id || null);
    }

    setImageUrls(uploadedImageUrls);

    setFeedbackSubmitted(true);
    setEditingFeedback(false);
    setSelectedFiles([]);
    setPreviewUrls([]);
  };




  return (


    <div className="itinerary-details-page">
      <div ref={mapRef} className="map-container" />

      {isDrawingRoute && (
        <div className="spinner-container">
          <div className="spinner" />
          <div className="spinner-text">Drawing your trip route...</div>
        </div>
      )}

      {tripLoaded && !isDrawingRoute && (
        <div className="trip-loaded-message">
          🎉 Done! Trip Loaded Successfully ✅
        </div>

      )}

      {distanceText && <div className="total-distance">{distanceText}</div>}
      {totalDuration && <div className="total-duration">{totalDuration}</div>}


      {aiDescription && (
        <div className="ai-summary">
          <h3 className="ai-summary-heading">💡 AI Trip Summary</h3>
          <p className="ai-summary-text">{aiDescription}</p>
        </div>
      )}

      <div className="trip-summary">
        <h2 className="trip-summary-heading">Trip Summary</h2>
        {Object.entries(
          places.reduce((acc: Record<number, { city: string; places: Place[] }>, place) => {
            if (!acc[place.day]) acc[place.day] = { city: place.city, places: [] };
            acc[place.day].places.push(place);
            return acc;
          }, {})
        ).map(([day, info]) => (
          <div key={day} className="daily-block">
            <h3 className="daily-heading">📅 Day {day} — {info.city}</h3>
            <ul className="place-list">
              {info.places.map((place, idx) => (
                <li key={idx} className="place-card">
                  <div className="place-header">
                    <span className="place-name">{place.name}</span>
                    <button
                      className="edit-btn"
                      onClick={() => {
                        setEditingPlace(place);
                        setEditingCity(place.city);
                        setShowEditModal(true);
                      }}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                  {place.image_url && (
                    <img src={place.image_url} alt={place.name} className="place-img" />
                  )}
                  <div className="address-and-link">
                    {place.address && (
                      <p className="place-address">📍 {place.address}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="feedback-container">
        <h3 className="feedback-heading">
          {feedbackSubmitted && !editingFeedback ? "Your Feedback" : "Leave Feedback"}
        </h3>

        {feedbackSubmitted && !editingFeedback ? (
          <>
            {renderStars()}
            <p><strong>Rating:</strong> {rating} / 5</p>
            <p><strong>Comments:</strong> {comments}</p>

            {/* Show uploaded images if available */}
            {feedbackSubmitted && imageUrls.length > 0 && (
              <div className="uploaded-images-container">
                <p><strong>Your Memories From The Trip: </strong></p>
                <div className="preview-container">
                  {imageUrls.map((url, idx) => (
                    <img key={idx} src={url} alt={`Uploaded ${idx}`} className="preview-img" />
                  ))}
                </div>
              </div>
            )}


            <button
              className="feedback-edit-btn"
              onClick={() => setEditingFeedback(true)}
            >
              ✏️ Edit Feedback
            </button>
          </>
        ) : (
          <>
            {renderStars()}
            <textarea
              className="feedback-textarea"
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Write your comments here..."
            />

            {/* Upload input */}
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="image-upload-input"
            />

            {/* Preview before submission */}
            {previewUrls.length > 0 && (
              <div className="preview-container">
                {previewUrls.map((url, idx) => (
                  <img key={idx} src={url} alt={`preview-${idx}`} className="preview-img" />
                ))}
              </div>
            )}

            <button
              className="feedback-submit-btn"
              onClick={handleSubmitFeedback}
            >
              Submit
            </button>
          </>
        )}
      </div>


      {editingPlace && (
        <EditPlaceModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentPlace={editingPlace}
          city={editingCity}
          onUpdate={async () => window.location.reload()}
        />
      )}
    </div>
  );
};

export default ItineraryDetails;
