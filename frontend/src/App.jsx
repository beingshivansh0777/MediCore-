import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/HomePage.jsx";
import Doctor from "./pages/DoctorPage.jsx";
import DoctorDetails from "./pages/DoctorDetails.jsx";
import AppointmentPaymentSuccess from "./pages/AppointmentPaymentSuccess.jsx";
import AppointmentPaymentFailed from "./pages/AppointmentPaymentFailed.jsx";
import Service from "./pages/ServicePage.jsx";
import ServiceDetail from "./pages/ServiceDetail.jsx";
import ServicePaymentSuccess from "./pages/ServicePaymentSuccess.jsx";
import ServicePaymentCancel from "./pages/ServicePaymentCancel.jsx";
import Contact from "./pages/ContactPage.jsx";
import Login from "./pages/LoginPage.jsx";
import DoctorHome from "./pages/DoctorHomePage.jsx";
import ListPage from "./components/ListPage.jsx";
import EditProfilePage from "./pages/EditProfilePage.jsx";
import AppointmentPage from "./pages/AppointmentPage.jsx";
import ScrollTop from "./components/UI/ScrollTop.jsx";
import ScrollButton from "./components/UI/ScrollButton.jsx";

const App = () => {
  useEffect(() => {
    document.body.style.overflowX = "hidden";
    document.documentElement.style.overflowX = "hidden";

    return () => {
      document.body.style.overflowX = "auto";
      document.documentElement.style.overflowX = "auto";
    };
  }, []);
  return (
    <div className="min-h-screen">
      <ScrollTop />
      <ScrollButton />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/doctors" element={<Doctor />} />
        <Route path="/doctors/:id" element={<DoctorDetails />} />

        {/* Appointment */}
        <Route
          path="/payment-success"
          element={<AppointmentPaymentSuccess />}
        />
        <Route path="/payment-failed" element={<AppointmentPaymentFailed />} />

        <Route path="/services" element={<Service />} />
        <Route path="/services/:id" element={<ServiceDetail />} />

        {/*   Service Payment */}
        <Route
          path="/service-appointment/success"
          element={<ServicePaymentSuccess />}
        />
        <Route
          path="/service-appointment/cancel"
          element={<ServicePaymentCancel />}
        />

        <Route path="/contact" element={<Contact />} />

        {/* Doctor */}
        <Route path="/doctor-admin/login" element={<Login />} />
        <Route path="/doctor-admin/:id" element={<DoctorHome />} />
        <Route path="/doctor-admin/:id/appointments" element={<ListPage />} />
        <Route
          path="/doctor-admin/:id/profile/edit"
          element={<EditProfilePage />}
        />

        <Route path="/appointments" element={<AppointmentPage />} />
      </Routes>
    </div>
  );
};

export default App;
