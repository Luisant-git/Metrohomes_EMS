import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { DataProvider } from "./context/DataContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import WebLayout from "./layouts/WebLayout.jsx";
import PWALayout from "./layouts/PWALayout.jsx";

// Web pages
import WebDashboard from "./pages/web/Dashboard.jsx";
import UserManagement from "./pages/web/UserManagement.jsx";
import SiteManagement from "./pages/web/SiteManagement.jsx";
import BookingManagement from "./pages/web/BookingManagement.jsx";
import BookingReport from "./pages/web/BookingReport.jsx";
import CommissionManagement from "./pages/web/CommissionManagement.jsx";
import AchieversReport from "./pages/web/AchieversReport.jsx";
import WebProfile from "./pages/web/Profile.jsx";
import WebCustomers from "./pages/web/Customers.jsx";
import CustomerRegistration from "./pages/web/CustomerRegistration.jsx";

// PWA pages (shared across all PWA roles)
import PWADashboard from "./pages/pwa/Dashboard.jsx";
import TeamPage from "./pages/pwa/Team.jsx";
import PMSites from "./pages/pwa/Sites.jsx";
import PMSiteDetail from "./pages/pwa/SiteDetail.jsx";
import PMCustomers from "./pages/pwa/PMCustomers.jsx";
import PMVisits from "./pages/pwa/PMVisits.jsx";
import PMBookings from "./pages/pwa/PMBookings.jsx";
import PMSReport from "./pages/pwa/PMSReport.jsx";
import PMPerf from "./pages/pwa/PMPerf.jsx";
import PMNotif from "./pages/pwa/PMNotif.jsx";
import PWASites from "./pages/pwa/Sites.jsx";
import PWASiteDetail from "./pages/pwa/SiteDetail.jsx";
import PWACustomers from "./pages/pwa/Customers.jsx";
import PWAVisitRegistration from "./pages/pwa/VisitRegistration.jsx";
import PWAVisits from "./pages/pwa/Visits.jsx";
import PWAProfile from "./pages/pwa/Profile.jsx";

function AppRoutes() {
  const { user } = useAuth();

  if (!user) return <LoginPage />;

  if (user.role === "Admin" || user.role === "Director") {
    return (
      <WebLayout>
        <Routes>
          <Route path="/" element={<WebDashboard />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/sites" element={<SiteManagement />} />
          <Route path="/bookings" element={<BookingManagement />} />
          <Route path="/customers" element={<WebCustomers />} />
          <Route path="/sales-report" element={<BookingReport />} />
          <Route path="/achievers" element={<AchieversReport />} />
          <Route path="/commission" element={<CommissionManagement />} />
          <Route path="/profile" element={<WebProfile />} />
          <Route path="/customer-registration" element={<CustomerRegistration />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </WebLayout>
    );
  }

  // Regional Manager, Branch Manager, BDM - use PM (Regional Manager) pages
  if (user.role === "Regional Manager" || user.role === "Branch Manager" || user.role === "BDM") {
    return (
      <PWALayout>
        <Routes>
          <Route path="/" element={<PWADashboard />} />
          <Route path="/my-team" element={<TeamPage />} />
          <Route path="/customers" element={<PMCustomers />} />
          <Route path="/visits" element={<PMVisits />} />
          <Route path="/bookings" element={<PMBookings />} />
          <Route path="/sales-report" element={<PMSReport />} />
          <Route path="/performance" element={<PMPerf />} />
          <Route path="/notifications" element={<PMNotif />} />
          <Route path="/sites" element={<PMSites />} />
          <Route path="/sites/:id" element={<PMSiteDetail />} />
          <Route path="/profile" element={<PWAProfile />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </PWALayout>
    );
  }

  // Sales Manager - uses dedicated SM pages + Customer Registration
  return (
    <PWALayout>
      <Routes>
        <Route path="/" element={<PWADashboard />} />
        <Route path="/sites" element={<PWASites />} />
        <Route path="/sites/:id" element={<PWASiteDetail />} />
        <Route path="/customers" element={<PWACustomers />} />
        <Route path="/visits" element={<PWAVisits />} />
        <Route path="/profile" element={<PWAProfile />} />
        <Route path="/customer-registration" element={<PWAVisitRegistration />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </PWALayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            toastStyle={{ borderRadius: "12px", fontSize: "14px" }}
          />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}