import React, { useEffect, Suspense, lazy, useState } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { NavigationProvider } from '@/lib/NavigationContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { initAdMob } from '@/lib/admob';
import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home.jsx';

// Lazy load page components
const Result = lazy(() => import('@/pages/Result.jsx'));
const Gallery = lazy(() => import('@/pages/Gallery.jsx'));
const Community = lazy(() => import('@/pages/Community'));
const Settings = lazy(() => import('@/pages/Settings'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const FindTimeline = lazy(() => import('@/pages/FindTimeline'));
const EraPack = lazy(() => import('@/pages/EraPack.jsx'));
const Legal = lazy(() => import('@/pages/Legal'));
const MyCollection = lazy(() => import('@/pages/MyCollection'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/community" element={<Community />} />
          <Route path="/my-collection" element={<MyCollection />} />
          <Route path="/result/:id" element={<Result />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/find-timeline" element={<FindTimeline />} />
          <Route path="/era-pack" element={<EraPack />} />
          <Route path="/legal" element={<Legal />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


function App() {
  // Initialize AdMob on app load
  useEffect(() => {
    initAdMob();
  }, []);

  return (
    <AuthProvider>
      <NavigationProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </NavigationProvider>
    </AuthProvider>
  )
}

export default App