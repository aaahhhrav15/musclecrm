import * as React from 'react';
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
import ScrollToTop from './components/common/ScrollToTop';

// Pages
import Home from "./pages/Home";
import IndustryDetail from "./pages/IndustryDetail";
import SetupPage from "./pages/SetupPage";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import ContactPage from "./pages/ContactPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import BlogsPage from "./pages/Blogs";
import AboutPage from "./pages/About";
import TermsAndConditions from "./pages/TermsAndConditions";

// Core CRM Pages
import CustomersPage from "./pages/customers/CustomersPage";
import BookingsPage from "./pages/bookings/BookingsPage";
import InvoicesPage from "./pages/invoices/InvoicesPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import SettingsPage from "./pages/settings/SettingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";

// Industry-specific Pages
import WorkoutPlansPage from "./pages/workout-plans/WorkoutPlansPage";
import CreateWorkoutPlanPage from "./pages/workout-plans/CreateWorkoutPlanPage";
import EditWorkoutPlanPage from "./pages/workout-plans/EditWorkoutPlanPage";
import AssignWorkoutPlanPage from "./pages/workout-plans/AssignWorkoutPlanPage";
import AssignedWorkoutPlansPage from "./pages/workout-plans/AssignedWorkoutPlansPage";
// Removed unused imports for non-existent demo pages

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
import PersonalTrainingPage from './pages/gym/PersonalTrainingPage';
import ProductsPage from './pages/gym/ProductsPage';
import ViewProductPage from './pages/gym/ViewProductPage';
import AccountabilitiesPage from './pages/gym/AccountabilitiesPage';
import ResultsPage from './pages/gym/ResultsPage';

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

import ProtectedSubscriptionRoute from './components/ProtectedSubscriptionRoute';
import ViewWorkoutPlanPage from '@/pages/workout-plans/ViewWorkoutPlanPage';
import ViewBookingPage from "./pages/bookings/ViewBookingPage";

const App = () => (
  <LocalizationProvider dateAdapter={AdapterDateFns}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <IndustryProvider>
            <AuthProvider>
              <ToastProvider>
                <GymProvider>
                  <Toaster />
                  <Sonner />
                  <ScrollToTop />
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/industries/:industry" element={<IndustryDetail />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/subscriptions" element={<SubscriptionsPage />} />
                    <Route path="/terms" element={<TermsAndConditions />} />
                    <Route path="/blogs" element={<BlogsPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    
                    {/* Protected routes */}
                    <Route path="/setup" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><SetupPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><Dashboard /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/customers" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><CustomersPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/bookings" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><BookingsPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/invoices" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><InvoicesPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/notifications" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><NotificationsPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/analytics" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><AnalyticsPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/settings" element={<ProtectedRoute element={<SettingsPage />} />} />
                    
                    {/* Gym Module Routes */}
                    <Route path="/dashboard/gym/staff" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><GymStaffPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/finance" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><GymFinancePage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/attendance" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><GymAttendancePage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/class-schedule" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><ClassSchedulePage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/membership-plans" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><MembershipPlansPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/nutrition-plans" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><NutritionPlansPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/events-workshops" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><EventsWorkshopsPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/waiver-forms" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><WaiverFormsPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/communications" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><MemberCommunicationsPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/health-assessments" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><HealthAssessmentsPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/expenses" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><ExpensesPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/personal-training" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><PersonalTrainingPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/products" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><ProductsPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/products/:id" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><ViewProductPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/accountabilities" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><AccountabilitiesPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/results" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><ResultsPage /></ProtectedSubscriptionRoute>} />} />
                    
                    {/* Existing Gym Routes */}
                    <Route path="/dashboard/gym/trainers" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><TrainersPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/trainers/new" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><CreateTrainerPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/trainers/:id/edit" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><EditTrainerPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/trainers/:id" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><ViewTrainerPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/workout-plans" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><WorkoutPlansPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/workout-plans/create" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><CreateWorkoutPlanPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/workout-plans/assigned" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><AssignedWorkoutPlansPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/workout-plans/:id/edit" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><EditWorkoutPlanPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/workout-plans/:id/assign" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><AssignWorkoutPlanPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/workout-plans/:id" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><ViewWorkoutPlanPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/retail-sales" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><RetailSalesPage /></ProtectedSubscriptionRoute>} />} />
                    <Route path="/dashboard/gym/leads" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><GymLeadsPage /></ProtectedSubscriptionRoute>} />} />
                    {/* Booking Routes */}
                    <Route path="/dashboard/bookings/:id" element={<ProtectedRoute element={<ProtectedSubscriptionRoute><ViewBookingPage /></ProtectedSubscriptionRoute>} />} />
                    
                    {/* Catch-all route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </GymProvider>
              </ToastProvider>
            </AuthProvider>
          </IndustryProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </LocalizationProvider>
);

export default App;
