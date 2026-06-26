import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
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

// PWA pages (role-specific)
import PMDashboard from "./pages/pwa/PMDashboard.jsx";
import PMTeam from "./pages/pwa/PMTeam.jsx";
import PMTargets from "./pages/pwa/PMTargets.jsx";
import PMCustomers from "./pages/pwa/PMCustomers.jsx";
import PMVisits from "./pages/pwa/PMVisits.jsx";
import PMBookings from "./pages/pwa/PMBookings.jsx";
import PMSReport from "./pages/pwa/PMSReport.jsx";
import PMPerf from "./pages/pwa/PMPerf.jsx";
import PMNotif from "./pages/pwa/PMNotif.jsx";

import BMDashboard from "./pages/pwa/BMDashboard.jsx";
import BMTeam from "./pages/pwa/BMTeam.jsx";
import BMTargets from "./pages/pwa/BMTargets.jsx";
import BMCustomers from "./pages/pwa/BMCustomers.jsx";
import BMVisits from "./pages/pwa/BMVisits.jsx";
import BMBookings from "./pages/pwa/BMBookings.jsx";
import BMSReport from "./pages/pwa/BMSReport.jsx";
import BMPerf from "./pages/pwa/BMPerf.jsx";
import BMNotif from "./pages/pwa/BMNotif.jsx";

import BDMDashboard from "./pages/pwa/BDMDashboard.jsx";
import BDMTeam from "./pages/pwa/BDMTeam.jsx";
import BDMTargets from "./pages/pwa/BDMTargets.jsx";
import BDMCustomers from "./pages/pwa/BDMCustomers.jsx";
import BDMVisits from "./pages/pwa/BDMVisits.jsx";
import BDMBookings from "./pages/pwa/BDMBookings.jsx";
import BDMPerf from "./pages/pwa/BDMPerf.jsx";
import BDMNotif from "./pages/pwa/BDMNotif.jsx";

import AddBranchManager from "./pages/pwa/AddBranchManager.jsx";
import AddBDM from "./pages/pwa/AddBDM.jsx";
import AddSalesManager from "./pages/pwa/AddSalesManager.jsx";

import PWADashboard from "./pages/pwa/Dashboard.jsx";
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

  // Regional Manager routes
  if (user.role === "Regional Manager") {
    return (
      <PWALayout>
        <Routes>
          <Route path="/" element={<PMDashboard />} />
          <Route path="/my-team" element={<PMTeam />} />
          <Route path="/targets" element={<PMTargets />} />
          <Route path="/customers" element={<PMCustomers />} />
          <Route path="/visits" element={<PMVisits />} />
          <Route path="/bookings" element={<PMBookings />} />
          <Route path="/sales-report" element={<PMSReport />} />
          <Route path="/performance" element={<PMPerf />} />
          <Route path="/notifications" element={<PMNotif />} />
          <Route path="/sites" element={<PWASites />} />
          <Route path="/sites/:id" element={<PWASiteDetail />} />
          <Route path="/customers/register" element={<PWAVisitRegistration />} />
          <Route path="/profile" element={<PWAProfile />} />
          <Route path="/add-branch-manager" element={<AddBranchManager />} />
          <Route path="/add-bdm" element={<AddBDM />} />
          <Route path="/add-sales-manager" element={<AddSalesManager />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </PWALayout>
    );
  }

  // Branch Manager routes
  if (user.role === "Branch Manager") {
    return (
      <PWALayout>
        <Routes>
          <Route path="/" element={<BMDashboard />} />
          <Route path="/my-team" element={<BMTeam />} />
          <Route path="/assign-targets" element={<BMTargets />} />
          <Route path="/customers" element={<BMCustomers />} />
          <Route path="/visits" element={<BMVisits />} />
          <Route path="/bookings" element={<BMBookings />} />
          <Route path="/sales-report" element={<BMSReport />} />
          <Route path="/performance" element={<BMPerf />} />
          <Route path="/notifications" element={<BMNotif />} />
          <Route path="/sites" element={<PWASites />} />
          <Route path="/sites/:id" element={<PWASiteDetail />} />
          <Route path="/customers/register" element={<PWAVisitRegistration />} />
          <Route path="/profile" element={<PWAProfile />} />
          <Route path="/add-bdm" element={<AddBDM />} />
          <Route path="/add-sales-manager" element={<AddSalesManager />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </PWALayout>
    );
  }

  // BDM routes
  if (user.role === "BDM") {
    return (
      <PWALayout>
        <Routes>
          <Route path="/" element={<BDMDashboard />} />
          <Route path="/my-team" element={<BDMTeam />} />
          <Route path="/sales-targets" element={<BDMTargets />} />
          <Route path="/customers" element={<BDMCustomers />} />
          <Route path="/visits" element={<BDMVisits />} />
          <Route path="/bookings" element={<BDMBookings />} />
          <Route path="/performance" element={<BDMPerf />} />
          <Route path="/notifications" element={<BDMNotif />} />
          <Route path="/sites" element={<PWASites />} />
          <Route path="/sites/:id" element={<PWASiteDetail />} />
          <Route path="/customers/register" element={<PWAVisitRegistration />} />
          <Route path="/profile" element={<PWAProfile />} />
          <Route path="/add-sales-manager" element={<AddSalesManager />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </PWALayout>
    );
  }

  // Sales Manager routes (unchanged original)
  return (
    <PWALayout>
      <Routes>
        <Route path="/" element={<PWADashboard />} />
        <Route path="/sites" element={<PWASites />} />
        <Route path="/sites/:id" element={<PWASiteDetail />} />
        <Route path="/customers" element={<PWACustomers />} />
        <Route path="/customers/register" element={<PWAVisitRegistration />} />
        <Route path="/visits" element={<PWAVisits />} />
        <Route path="/profile" element={<PWAProfile />} />
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
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { borderRadius: "12px", fontSize: "14px" },
            }}
          />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
