import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import HomePage from './components/HomePage';
import AuthPage from "./components/AuthForm";
import ItinerarySelectionPage from "./components/ItinerarySelectionPage";
import AiPreferences from "./components/AiPreferences";
import AiItineraryPage from "./components/AiItineraryPage";
import ManualItineraryPage from "./components/ManualItineraryPage";
import ManualPlaceSelection from "./components/ManualPlaceSelection";
import ItineraryDetails from "./components/ItineraryDetails";
import CuratedOnlySelection from "./components/CuratedOnlySelection"; 
import UserPreferenceForm from "./components/UserPreferenceForm";



import PrivateRoute from "./components/PrivateRoute"; // ✅
import AuthFormSignUp from "./components/AuthFormSignUp";
import UserItineraries from "./components/UserItineraries";
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <NavBar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/LoginPage" element={<AuthPage />} />
            <Route path="/SignUpPage" element={<AuthFormSignUp />} />
            {/* ✅ Protected Routes */}
            <Route
              path="/ItinerarySelectionPage"
              element={<PrivateRoute><ItinerarySelectionPage /></PrivateRoute>}
            />
            <Route
              path="/AiPreferences"
              element={<PrivateRoute><AiPreferences /></PrivateRoute>}
            />
            <Route
              path="/AiItineraryPage"
              element={<PrivateRoute><AiItineraryPage /></PrivateRoute>}
            />
            <Route
              path="/ManualItineraryPage"
              element={<PrivateRoute><ManualItineraryPage /></PrivateRoute>}
            />
            <Route
              path="/ManualPlaceSelection"
              element={<PrivateRoute><ManualPlaceSelection /></PrivateRoute>}
            />
            
            <Route
              path="/ItineraryDetails"
              element={<PrivateRoute><ItineraryDetails /></PrivateRoute>}
            />
            <Route
              path="/UserItineraries"
              element={<PrivateRoute><UserItineraries /></PrivateRoute>}
            />
            <Route 
              path="/CuratedOnlySelection" 
              element={<CuratedOnlySelection />} />

            <Route
              path="/UserPreferenceForm"
              element={<PrivateRoute><UserPreferenceForm /></PrivateRoute>}
            />

          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
