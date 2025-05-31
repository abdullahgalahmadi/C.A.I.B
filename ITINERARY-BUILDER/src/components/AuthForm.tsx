import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseConfig";
import "./AuthForm.css";

const AuthForm: React.FC = () => {
  const [email, setEmail]       = useState(""); 
  const [password, setPassword] = useState("");  
  const [error, setError]       = useState<string | null>(null);  
  const [loading, setLoading]   = useState(true); 
  const navigate = useNavigate();

  useEffect(() => {
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/ItinerarySelectionPage");  
      setLoading(false);
    });
  }, [navigate]);

  const handleSignIn = async () => {
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message); // If there's an error show it
    else navigate("/ItinerarySelectionPage");
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) setError(error.message);
  };

  if (loading) return <p className="auth-loading">Loading...</p>;

  return (
      <div className="auth-container">
      <h2 className="auth-heading">Welcome Back</h2>
      {error && <p className="auth-error">{error}</p>}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="auth-input"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="auth-input"
      />

      <button onClick={handleSignIn} className="auth-btn action-btn">
        Sign In
      </button>

      <hr className="auth-divider" />

      <button onClick={handleGoogleSignIn} className="auth-btn google-btn">
        Sign in with Google
      </button>

      <p className="auth-footer">
        Don’t have an account?{" "}
        <span onClick={() => navigate("/SignUpPage")} className="auth-link">
          Sign Up
        </span>
      </p>
    </div>
    





  );
};

export default AuthForm;
