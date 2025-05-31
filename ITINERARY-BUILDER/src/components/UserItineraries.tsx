import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseConfig';
import { motion } from 'framer-motion';
import './UserItineraries.css';


interface DailyPlan {
  id: string;
  day_number: number;
  city: string;
  selected_places: {
    id: string;
    place_name: string;
    address: string;
    type: string;
  }[];
}

interface Itinerary {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  type: string;
  ai_description?: string;
  cities: string[];
  places: string[];
  daily_plans?: DailyPlan[];
}


const UserItineraries: React.FC = () => {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  
  useEffect(() => {
    const fetchItineraries = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: itinerariesData, error } = await supabase
        .from('manual_itineraries')
        .select(`
          *,
          daily_plans (
            id,
            day_number,
            city,
            selected_places (
              id,
              place_name,
              address,
              type
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching itineraries:', error);
        return;
      }

      
      if (itinerariesData) {
        const formattedItineraries = itinerariesData.map(itinerary => {
          const cities = new Set<string>();
          const places = new Set<string>();
          
          itinerary.daily_plans?.forEach((plan: DailyPlan) => {
            if (plan.city) cities.add(plan.city);
            plan.selected_places?.forEach((place: DailyPlan['selected_places'][0]) => {
              if (place.place_name) places.add(place.place_name);
            });
          });

          return {
            ...itinerary,
            cities: Array.from(cities),
            places: Array.from(places)
          };
        });

        setItineraries(formattedItineraries);
      }
      setLoading(false);
    };

    fetchItineraries();
  }, []);

  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this itinerary?')) return;

    const { error } = await supabase
      .from('manual_itineraries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting itinerary:', error);
      return;
    }

    setItineraries(prev => prev.filter(itinerary => itinerary.id !== id));
  };

  
  if (loading) {
    return (
      <div className="user-itineraries-page">
        <div className="loading-spinner">Loading your itineraries...</div>
      </div>
    );
  }

  // Show fallback message if user has no itineraries
  if (itineraries.length === 0) {
    return (
      <div className="user-itineraries-page">
        <h1 className="page-title">Your Itineraries</h1>
        <div className="no-itineraries-text">No itineraries found. Create one to get started!</div>
      </div>
    );
  }

  // Display all user itineraries with cities, places, and action buttons
  return (
    <div className="user-itineraries-page">
      <h1 className="page-title">Your Itineraries</h1>
      <div className="itineraries-grid">
        {itineraries.map((itinerary, index) => (
          <motion.div
            key={itinerary.id}
            className="itinerary-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
          >
            {/* Header shows type and date range */}
            <div className="card-header">
              <h3>{itinerary.type === 'ai' ? 'AI-Generated Itinerary' : 'Manual Itinerary'}</h3>
              <div className="date-range">
                {new Date(itinerary.start_date).toLocaleDateString()} - {new Date(itinerary.end_date).toLocaleDateString()}
              </div>
            </div>

            {/* Shows summary of cities and total places */}
            <div className="itinerary-details">
              <p><strong>Cities:</strong> {itinerary.cities.length > 0 ? itinerary.cities.join(', ') : 'No cities available'}</p>
              <p><strong>Places:</strong> {itinerary.places.length > 0 ? itinerary.places.slice(0, 3).join(', ') : 'No places available'}{itinerary.places.length > 3 ? '...' : ''}</p>
              <p><strong>Total Places:</strong> {itinerary.places.length}</p>
            </div>

            {/* Action buttons: View Details or Delete */}
            <div className="card-actions">
              <button
                className="view-btn"
                onClick={() => navigate(`/ItineraryDetails?id=${itinerary.id}`)}
              >
                View Details
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDelete(itinerary.id)}
              >
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default UserItineraries;
