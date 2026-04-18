import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import AuthorsPage from "./pages/public/AuthorsPage";
import ReviewersPage from "./pages/public/ReviewersPage";
import PublicationsPage from "./pages/public/PublicationsPage";
import PublicationDetail from "./pages/public/PublicationDetail";
import DigitalLibraryPublic from "./pages/public/DigitalLibraryPublic";
import About from "./pages/public/About";
import MembershipPage from "./pages/public/MembershipPage";
import StandardsPage from "./pages/public/StandardsPage";
import SupportPage from "./pages/public/SupportPage";
import PolicyPage from "./pages/public/PolicyPage";

// Portal pages
import PortalDashboard from "./pages/portal/PortalDashboard";
import PortalProfile from "./pages/portal/PortalProfile";
import PortalMembership from "./pages/portal/PortalMembership";
import PortalLibrary from "./pages/portal/PortalLibrary";
import PendingVerification from "./pages/portal/PendingVerification";

// Admin pages
import AdminPortal from "./pages/AdminPortal";

// Author + reviewer pages
import AuthorDashboard from "./pages/AuthorDashboard";
import SubmitPaper from "./pages/SubmitPaper";
import ReviewerPortal from "./pages/ReviewerPortal";
import SubAdminReview from "./pages/SubAdminReview";
import SubAdminPortal from "./pages/SubAdminPortal";
import SubAdminSettings from "./pages/SubAdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/membership" element={<MembershipPage />} />
            <Route path="/standards" element={<StandardsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/policy/:type" element={<PolicyPage />} />
            <Route path="/authors" element={<AuthorsPage />} />
            <Route path="/reviewers" element={<ReviewersPage />} />
            <Route path="/publications" element={<PublicationsPage />} />
            <Route path="/publications/:slug" element={<PublicationDetail />} />
            <Route path="/library" element={<DigitalLibraryPublic />} />

            {/* Auth routes - redirect if already logged in */}
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

            {/* Portal routes - any authenticated user */}
            <Route path="/portal/dashboard" element={<ProtectedRoute><PortalDashboard /></ProtectedRoute>} />
            <Route path="/portal/profile" element={<ProtectedRoute><PortalProfile /></ProtectedRoute>} />
            <Route path="/portal/membership" element={<ProtectedRoute><PortalMembership /></ProtectedRoute>} />
            <Route path="/portal/library" element={<ProtectedRoute><PortalLibrary /></ProtectedRoute>} />
            <Route path="/portal/pending" element={<ProtectedRoute><PendingVerification /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin/*" element={
              <ProtectedRoute requiredRoles={["super_admin","content_admin","editor"]}>
                <AdminPortal />
              </ProtectedRoute>
            } />

            {/* Author routes — any logged-in user can submit journals */}
            <Route path="/author" element={<ProtectedRoute requiredRoles={["registered_user","member","subscriber","author","sub_admin","reviewer","editor","content_admin","super_admin"]}><AuthorDashboard /></ProtectedRoute>} />
            <Route path="/submit-paper" element={<ProtectedRoute requiredRoles={["registered_user","member","subscriber","author","sub_admin","reviewer","editor","content_admin","super_admin"]}><SubmitPaper /></ProtectedRoute>} />

            {/* Reviewer routes */}
            <Route path="/reviewer/*" element={
              <ProtectedRoute requiredRoles={["reviewer","editor","super_admin"]}>
                <ReviewerPortal />
              </ProtectedRoute>
            } />

            {/* Sub-admin portal + stage review */}
            <Route path="/sub-admin" element={
              <ProtectedRoute requiredRoles={["sub_admin","super_admin"]}>
                <SubAdminPortal />
              </ProtectedRoute>
            } />
            <Route path="/sub-admin/settings" element={
              <ProtectedRoute requiredRoles={["sub_admin","super_admin"]}>
                <SubAdminSettings />
              </ProtectedRoute>
            } />
            <Route path="/reviewer/stage" element={
              <ProtectedRoute requiredRoles={["sub_admin","super_admin","editor"]}>
                <SubAdminReview />
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
