import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./ItinerarySelectionPage.css";

const ItinerarySelection = () => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<"ai" | "manual" | null>(null); 

  return (
    <div className="itinerary-page">
      
      <div className="background default-bg" style={{ opacity: hovered === null ? 1 : 0 }} />
      <div className="background ai-bg" style={{ opacity: hovered === "ai" ? 1 : 0 }} />
      <div className="background manual-bg" style={{ opacity: hovered === "manual" ? 1 : 0 }} />

      {/* Animated Main Card */}
      <motion.div
        className="itinerary-box"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.h2
          className="title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          How Would You Like to Plan Your Trip?
        </motion.h2>

        <motion.p
          className="subtitle"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Plan your perfect trip effortlessly with AI, or customize it your way!
        </motion.p>

        {/* Buttons */}
        <motion.div
          className="button-group"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* AI Itinerary */}
          <div
            className="button-wrapper ai-button-wrapper"
            onMouseEnter={() => setHovered("ai")} 
            onMouseLeave={() => setHovered(null)} 
          >
            <button
              className="select-button ai"
              onClick={() => navigate("/AiPreferences")}
            >
              🤖 AI Itinerary
            </button>
            <p className="button-description">Fast, smart, auto-generated</p>
            {hovered === "ai" && (
              <>
                <span className="bit">0</span>
                <span className="bit">1</span>
                <span className="bit">0</span>
                <span className="bit">1</span>
              </>
            )}
          </div>

         
          <div
            className="button-wrapper"
            onMouseEnter={() => setHovered("manual")}
            onMouseLeave={() => setHovered(null)}
          >
            <button
              className="select-button manual"
              onClick={() => navigate("/ManualItineraryPage")}
            >
              📝 Manual Itinerary
            </button>
            <p className="button-description">Full control, customize daily</p>
            {hovered === "manual" && ( //Show paper animation on hover
              <>
                <span className="paper"></span>
                <span className="paper"></span>
                <span className="paper"></span>
                <span className="paper"></span>
              </>
            )}
          </div>
        </motion.div>

        
        <motion.div
          className="quote"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          ✈️ "Travel is the only thing you buy that makes you richer."
        </motion.div>

       
        {hovered === "ai" && (
          <motion.p
            className="hover-info ai-info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            ✨ Generate your itinerary with the help of smart AI!
          </motion.p>
        )}
        
        {hovered === "manual" && (
          <motion.p
            className="hover-info manual-info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            📝 Manually customize every detail of your journey!
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default ItinerarySelection;
