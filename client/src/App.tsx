import React from 'react';
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { IndustryProvider } from "./context/IndustryContext";
import { GymProvider } from './context/GymContext';
import { ToastProvider } from './context/ToastContext';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

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
import WorkoutPlansPage from "./pages/workout-plans/WorkoutPlansPage";
import CreateWorkoutPlanPage from "./pages/workout-plans/CreateWorkoutPlanPage";
import EditWorkoutPlanPage from "./pages/workout-plans/EditWorkoutPlanPage";
import AssignWorkoutPlanPage from "./pages/workout-plans/AssignWorkoutPlanPage";
import AssignedWorkoutPlansPage from "./pages/workout-plans/AssignedWorkoutPlansPage";
import ServicesPage from "./pages/spa/ServicesPage";
import RoomManagementPage from "./pages/hotel/RoomManagementPage";
import MembershipsPage from "./pages/club/MembershipsPage";

// New Gym Module Pages
import GymMembersPage from "./pages/gym/MembersPage";
import GymLeadsPage from "./pages/gym/LeadsPage";
import GymStaffPage from "./pages/gym/StaffPage";
import GymFinancePage from "./pages/gym/FinancePage";
import GymAttendancePage from "./pages/gym/AttendancePage";
import TrainersPage from "./pages/gym/TrainersPage";
import CreateTrainerPage from "./pages/gym/CreateTrainerPage";
import ViewTrainerPage from "./pages/gym/ViewTrainerPage";
import EditTrainerPage from "./pages/gym/EditTrainerPage";
import ClassSchedulePage from './pages/gym/ClassSchedulePage';
import MembershipPlansPage from './pages/gym/MembershipPlansPage';
import NutritionPlansPage from './pages/gym/NutritionPlansPage';
import EventsWorkshopsPage from './pages/gym/EventsWorkshopsPage';
import WaiverFormsPage from './pages/gym/WaiverFormsPage';
import MemberCommunicationsPage from './pages/gym/MemberCommunicationsPage';
import HealthAssessmentsPage from '@/pages/gym/HealthAssessmentsPage';
import RetailSalesPage from './pages/gym/RetailSalesPage';
import ExpensesPage from './pages/gym/ExpensesPage';

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Protected route component
const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
  // AuthCheck is handled in the components with useRequireAuth
  return <>{element}</>;
};

import ViewWorkoutPlanPage from '@/pages/workout-plans/ViewWorkoutPlanPage';
import ViewBookingPage from "./pages/bookings/ViewBookingPage";

const App = () => (
  <LocalizationProvider dateAdapter={AdapterDateFns}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <IndustryProvider>
          <AuthProvider>
            <ToastProvider>
              <GymProvider>
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
                    
                    {/* Protected routes */}
                    <Route path="/setup" element={<ProtectedRoute element={<SetupPage />} />} />
                    <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
                    <Route path="/dashboard/customers" element={<ProtectedRoute element={<CustomersPage />} />} />
                    <Route path="/dashboard/bookings" element={<ProtectedRoute element={<BookingsPage />} />} />
                    <Route path="/dashboard/invoices" element={<ProtectedRoute element={<InvoicesPage />} />} />
                    <Route path="/dashboard/notifications" element={<ProtectedRoute element={<NotificationsPage />} />} />
                    <Route path="/dashboard/settings" element={<ProtectedRoute element={<SettingsPage />} />} />
                    
                    {/* Gym Module Routes */}
                    <Route path="/dashboard/gym/staff" element={<ProtectedRoute element={<GymStaffPage />} />} />
                    <Route path="/dashboard/gym/finance" element={<ProtectedRoute element={<GymFinancePage />} />} />
                    <Route path="/dashboard/gym/attendance" element={<ProtectedRoute element={<GymAttendancePage />} />} />
                    <Route path="/dashboard/gym/class-schedule" element={<ProtectedRoute element={<ClassSchedulePage />} />} />
                    <Route path="/dashboard/gym/membership-plans" element={<ProtectedRoute element={<MembershipPlansPage />} />} />
                    <Route path="/dashboard/gym/nutrition-plans" element={<ProtectedRoute element={<NutritionPlansPage />} />} />
                    <Route path="/dashboard/gym/events-workshops" element={<ProtectedRoute element={<EventsWorkshopsPage />} />} />
                    <Route path="/dashboard/gym/waiver-forms" element={<ProtectedRoute element={<WaiverFormsPage />} />} />
                    <Route path="/dashboard/gym/communications" element={<ProtectedRoute element={<MemberCommunicationsPage />} />} />
                    <Route path="/dashboard/gym/health-assessments" element={<ProtectedRoute element={<HealthAssessmentsPage />} />} />
                    <Route path="/dashboard/gym/expenses" element={<ProtectedRoute element={<ExpensesPage />} />} />
                    
                    {/* Existing Gym Routes */}
                    <Route path="/dashboard/gym/trainers" element={<ProtectedRoute element={<TrainersPage />} />} />
                    <Route path="/dashboard/gym/trainers/new" element={<ProtectedRoute element={<CreateTrainerPage />} />} />
                    <Route path="/dashboard/gym/trainers/:id/edit" element={<ProtectedRoute element={<EditTrainerPage />} />} />
                    <Route path="/dashboard/gym/trainers/:id" element={<ProtectedRoute element={<ViewTrainerPage />} />} />
                    <Route path="/dashboard/gym/workout-plans" element={<ProtectedRoute element={<WorkoutPlansPage />} />} />
                    <Route path="/dashboard/gym/workout-plans/create" element={<ProtectedRoute element={<CreateWorkoutPlanPage />} />} />
                    <Route path="/dashboard/gym/workout-plans/assigned" element={<ProtectedRoute element={<AssignedWorkoutPlansPage />} />} />
                    <Route path="/dashboard/gym/workout-plans/:id/edit" element={<ProtectedRoute element={<EditWorkoutPlanPage />} />} />
                    <Route path="/dashboard/gym/workout-plans/:id/assign" element={<ProtectedRoute element={<AssignWorkoutPlanPage />} />} />
                    <Route path="/dashboard/gym/workout-plans/:id" element={<ProtectedRoute element={<ViewWorkoutPlanPage />} />} />
                    <Route path="/dashboard/gym/retail-sales" element={<ProtectedRoute element={<RetailSalesPage />} />} />
                    <Route path="/dashboard/gym/leads" element={<ProtectedRoute element={<GymLeadsPage />} />} />
                    {/* Booking Routes */}
                    <Route path="/dashboard/bookings/:id" element={<ProtectedRoute element={<ViewBookingPage />} />} />
                    
                    {/* Catch-all route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </GymProvider>
            </ToastProvider>
          </AuthProvider>
        </IndustryProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </LocalizationProvider>
);

export default App;
