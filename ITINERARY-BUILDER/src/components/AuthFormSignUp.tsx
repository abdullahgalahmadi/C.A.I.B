// SignUpPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseConfig";
import "./AuthFormSignUp.css";

const AuthFormSignUp: React.FC = () => {
  const navigate = useNavigate();
  const [fullName, setFullName]     = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [error, setError]           = useState<string | null>(null);

  const handleSignUp = async () => {
    setError(null);
    if (!fullName.trim() || !email.trim() || !password) {
      setError("All fields are required.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: {
          full_name: fullName
        }
      }
    });
    if (error) {
      setError(error.message);
    } else {
      navigate("/ItinerarySelectionPage");
    }
  };

  return (
    <div className="signup-container">
      <h2 className="signup-heading">Create Your Account</h2>
      {error && <p className="signup-error">{error}</p>}

      <label>Full Name</label>
      <input
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="signup-input"
      />

      <label>Email</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="signup-input"
      />

      <label>Password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="signup-input"
      />

      <label>Confirm Password</label>
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="signup-input"
      />

      <button onClick={handleSignUp} className="signup-button">
        Sign Up
      </button>

      <p className="signup-footer">
        Already have an account?{" "}
        <span onClick={() => navigate("/LoginPage")} className="signup-link">
          Sign In
        </span>
      </p>
    </div>
  );
};

export default AuthFormSignUp;
