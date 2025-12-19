import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/lib/analytics';

export const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Track pageview on every route change
    analytics.trackPageView(location.pathname, document.title);
  }, [location.pathname]);

  return null;
};
