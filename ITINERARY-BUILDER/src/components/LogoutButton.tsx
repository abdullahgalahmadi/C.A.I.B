// LogoutButton.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./LogoutButton.css";

const LogoutButton: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/"); 
  };

  return (
    <button onClick={handleLogout} className="logout-button">
      🔓 Log Out
    </button>
  );
};

export default LogoutButton;
