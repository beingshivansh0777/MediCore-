import React from "react";
import { Route, Routes } from "react-router-dom";
import Hero from "./pages/HeroPage.jsx";
import { useUser, useClerk } from "@clerk/react";
import { Link } from "react-router-dom";
import Home from "./pages/HomePage.jsx";
import AddPage from "./pages/AddPage.jsx";
import ListPage from "./pages/ListPage.jsx";
import AppointmentPage from "./pages/AppointmentPage.jsx";
import ServiceDashboardPage from "./pages/ServiceDashboardPage.jsx";
import AddservicePage from "./pages/AddservicePage.jsx";
import ListServicePage from "./pages/ListServicePage.jsx";
import ServiceAppointmentPage from "./pages/ServiceAppointmentPage.jsx";






function RequireAuth({ children }) {
  const { isLoaded, isSignedIn } = useUser();
  const { openSignIn } = useClerk();


  if (!isLoaded) return null;
  if (!isSignedIn) {
    return (
      <div className="min-h-screen font-mono flex items-center justify-center bg-linear-to-b from-emerald-50 via-green-50 to-emerald-100 px-4">
        <div className="text-center">
          <p className="text-emerald-800 font-semibold text-lg sm:text-2xl mb-4 animate-fade-in">
            Please sign in to view this page.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/"
              className="px-4 py-2 text-sm rounded-full bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all duration-300 ease-in-out animate-bounce-subtle"
            >
              Home
            </Link> 
            <button
              onClick={() => openSignIn()}
              className="px-4 py-2 text-sm rounded-full bg-white text-emerald-600 border border-emerald-600 shadow-sm hover:bg-emerald-50 hover:shadow-md transition-all duration-300 ease-in-out"
            >
              Login
            </button>
          </div>
          
        </div>
      </div>
    );
  }
  return children;
}

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Hero />} />
      <Route
        path="/h"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      />
     <Route
     path="/add"
     element= {
      <RequireAuth>
        <AddPage/>
      </RequireAuth>
     }/>

      <Route 
      path="/list"
      element = {
        <RequireAuth>
          <ListPage/>
        </RequireAuth>
      }
      />
      <Route 
      path="/appointments"
      element= {
        <RequireAuth>
          <AppointmentPage/>
        </RequireAuth>
      }/>
      <Route
      path="/service-dashboard"
      element={
        <RequireAuth>
          <ServiceDashboardPage/>
        </RequireAuth>
      }/> 
      <Route
      path="/add-service"
      element={
        <RequireAuth>
          <AddservicePage/>
        </RequireAuth>
      }/>
      <Route
      path="/list-service"
      element={
        <RequireAuth>
          <ListServicePage/>
        </RequireAuth>
      }/>
      <Route
      path="service-appointments"
      element={
        <RequireAuth>
          <ServiceAppointmentPage/>
        </RequireAuth>
      }/>

    </Routes>
    
  );
};

export default App;
