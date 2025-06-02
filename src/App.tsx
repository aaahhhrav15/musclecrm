
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import ContactPage from "./pages/ContactPage";

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

// New Gym Module Pages
import GymMembersPage from "./pages/gym/MembersPage";
import GymLeadsPage from "./pages/gym/LeadsPage";
import GymStaffPage from "./pages/gym/StaffPage";
import GymFinancePage from "./pages/gym/FinancePage";
import GymAttendancePage from "./pages/gym/AttendancePage";

// Profile Pages
import ProfilePage from "./pages/profile/ProfilePage";
import BillingPage from "./pages/profile/BillingPage";

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// COMMENTED OUT Protected route component for testing - now all routes are accessible
const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
  // AuthCheck is bypassed for testing
  return <>{element}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <IndustryProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/industries/:industry" element={<IndustryDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/contact" element={<ContactPage />} />
              
              {/* All routes now accessible without authentication for testing */}
              <Route path="/setup" element={<ProtectedRoute element={<SetupPage />} />} />
              <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
              <Route path="/dashboard/customers" element={<ProtectedRoute element={<CustomersPage />} />} />
              <Route path="/dashboard/bookings" element={<ProtectedRoute element={<BookingsPage />} />} />
              <Route path="/dashboard/invoices" element={<ProtectedRoute element={<InvoicesPage />} />} />
              <Route path="/dashboard/notifications" element={<ProtectedRoute element={<NotificationsPage />} />} />
              <Route path="/dashboard/settings" element={<ProtectedRoute element={<SettingsPage />} />} />
              
              {/* Industry-Specific Routes */}
              <Route path="/dashboard/workout-plans" element={<ProtectedRoute element={<WorkoutPlansPage />} />} />
              <Route path="/dashboard/services" element={<ProtectedRoute element={<ServicesPage />} />} />
              <Route path="/dashboard/room-management" element={<ProtectedRoute element={<RoomManagementPage />} />} />
              <Route path="/dashboard/memberships" element={<ProtectedRoute element={<MembershipsPage />} />} />
              
              {/* New Gym Module Routes */}
              <Route path="/dashboard/gym/members" element={<ProtectedRoute element={<GymMembersPage />} />} />
              <Route path="/dashboard/gym/leads" element={<ProtectedRoute element={<GymLeadsPage />} />} />
              <Route path="/dashboard/gym/staff" element={<ProtectedRoute element={<GymStaffPage />} />} />
              <Route path="/dashboard/gym/finance" element={<ProtectedRoute element={<GymFinancePage />} />} />
              <Route path="/dashboard/gym/attendance" element={<ProtectedRoute element={<GymAttendancePage />} />} />
              
              {/* Profile Routes */}
              <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
              <Route path="/profile/billing" element={<ProtectedRoute element={<BillingPage />} />} />
              
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
