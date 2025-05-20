
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { IndustryProvider } from "@/context/IndustryContext";

// Pages
import Home from "./pages/Home";
import IndustryDetail from "./pages/IndustryDetail";
import SetupPage from "./pages/SetupPage";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Core CRM Pages
import CustomersPage from "./pages/customers/CustomersPage";
import BookingsPage from "./pages/bookings/BookingsPage";
import InvoicesPage from "./pages/invoices/InvoicesPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import SettingsPage from "./pages/settings/SettingsPage";

// Industry-specific Pages
import WorkoutPlansPage from "./pages/gym/WorkoutPlansPage";
import ServicesPage from "./pages/spa/ServicesPage";
import RoomManagementPage from "./pages/hotel/RoomManagementPage";
import MembershipsPage from "./pages/club/MembershipsPage";

// Create a React Query client
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <IndustryProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/industries/:industry" element={<IndustryDetail />} />
              <Route path="/setup" element={<SetupPage />} />
              
              {/* Dashboard and Core CRM Routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/customers" element={<CustomersPage />} />
              <Route path="/dashboard/bookings" element={<BookingsPage />} />
              <Route path="/dashboard/invoices" element={<InvoicesPage />} />
              <Route path="/dashboard/notifications" element={<NotificationsPage />} />
              <Route path="/dashboard/settings" element={<SettingsPage />} />
              
              {/* Industry-Specific Routes */}
              <Route path="/dashboard/workout-plans" element={<WorkoutPlansPage />} />
              <Route path="/dashboard/services" element={<ServicesPage />} />
              <Route path="/dashboard/room-management" element={<RoomManagementPage />} />
              <Route path="/dashboard/memberships" element={<MembershipsPage />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </IndustryProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
