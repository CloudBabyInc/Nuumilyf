
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import React from "react";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Navbar from "./components/layout/Navbar";
import Marketplace from "./pages/Marketplace";
import CreatePost from "./pages/CreatePost";
import Chats from "./pages/Chats";
import Notifications from "./pages/Notifications";
import PostView from "./pages/PostView";
import MealPlanning from "./pages/MealPlanning";
import CreateMeal from "./pages/CreateMeal";
import ThemeProvider from "./components/theme/ThemeProvider";
import PresenceProvider from "./components/providers/PresenceProvider";
import { PageTransition } from "./components/ui/MotionWrapper";

// Import global CSS for comments
import "./components/comments/comments.css";

// Create a wrapper component that conditionally renders the Navbar
const ConditionalNavbar = () => {
  const location = useLocation();
  const pathname = location.pathname;

  // Only show navbar on these routes
  const showNavbarRoutes = ['/feed', '/chats', '/profile', '/marketplace', '/create', '/notifications', '/post', '/meal-planning', '/create-meal'];

  // Routes that should hide the navbar (like when in a specific conversation)
  const hideNavbarRoutes = ['/chats/'];

  // Check if the current route matches any of the routes that should hide the navbar
  const shouldHideNavbar = hideNavbarRoutes.some(route =>
    pathname.startsWith(route) && pathname.length > route.length
  );

  // Check if the current route should display navbar
  const shouldShowNavbar = !shouldHideNavbar && showNavbarRoutes.some(route =>
    pathname === route || (route !== '/' && pathname.startsWith(route + '/'))
  );

  return shouldShowNavbar ? <Navbar /> : null;
};

// Routes with conditional Navbar and page transitions
const AppRoutes = () => {
  const location = useLocation();

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Index /></PageTransition>} />
          <Route path="/feed" element={<PageTransition><Feed /></PageTransition>} />
          <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
          <Route path="/profile/:userId" element={<PageTransition><Profile /></PageTransition>} />
          <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
          <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
          <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
          <Route path="/onboarding" element={<PageTransition><Onboarding /></PageTransition>} />
          <Route path="/chats/*" element={<PageTransition><Chats /></PageTransition>} />
          <Route path="/create" element={<PageTransition><CreatePost /></PageTransition>} />
          <Route path="/marketplace" element={<PageTransition><Marketplace /></PageTransition>} />
          <Route path="/notifications" element={<PageTransition><Notifications /></PageTransition>} />
          <Route path="/post/:postId" element={<PageTransition><PostView /></PageTransition>} />
          <Route path="/meal-planning" element={<PageTransition><MealPlanning /></PageTransition>} />
          <Route path="/create-meal" element={<PageTransition><CreateMeal /></PageTransition>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
      <ConditionalNavbar />
    </>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <PresenceProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </PresenceProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
