import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseConfig';
import './NavBar.css';
import saudiFlag from "../assets/saudi.png";

const NavBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
   
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          C.A.I.B
          <img src={saudiFlag} alt="Saudi Arabia Flag" style={{ width: "50px", height: "32px" }} />
        </Link>
      </div>
      <div className="nav-links">

        {isAuthenticated && (
          <>
            <Link
              to="/"
              onClick={() => window.scrollTo(0, 0)}
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
            >
              Home
            </Link>
            <Link
              to="/ItinerarySelectionPage"
              onClick={() => window.scrollTo(0, 0)}
              className={`nav-link ${isActive('/ItinerarySelectionPage') ? 'active' : ''}`}
            >
              Create Itinerary
            </Link>
            <Link
              to="/UserItineraries"
              onClick={() => window.scrollTo(0, 0)}
              className={`nav-link ${isActive('/UserItineraries') ? 'active' : ''}`}
            >
              My Itineraries
            </Link>

          </>
        )}
      </div>
      <div className="nav-auth">
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="nav-link logout-btn"
          >
            Logout
          </button>
        ) : (
          <>
            <Link
              to="/LoginPage"
              className={`nav-link ${isActive('/LoginPage') ? 'active' : ''}`}
            >
              Login
            </Link>
            <Link
              to="/SignUpPage"
              className={`nav-link ${isActive('/SignUpPage') ? 'active' : ''}`}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default NavBar; 