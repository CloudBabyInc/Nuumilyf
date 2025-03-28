
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import React from "react";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Navbar from "./components/layout/Navbar";

// Create a wrapper component that conditionally renders the Navbar
const ConditionalNavbar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Only show navbar on these routes
  const showNavbarRoutes = ['/', '/feed', '/chats', '/create', '/profile'];
  
  // Check if the current route should display navbar
  const shouldShowNavbar = showNavbarRoutes.some(route => 
    pathname === route || (route !== '/' && pathname.startsWith(route + '/'))
  );
  
  return shouldShowNavbar ? <Navbar /> : null;
};

// Routes with conditional Navbar
const AppRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/chats" element={<Feed />} />
        <Route path="/create" element={<Feed />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ConditionalNavbar />
    </>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
