import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/lib/analytics';

export const RouteTracker = () => {
  const location = useLocation();
  const startTimeRef = useRef<number>(Date.now());
  const maxScrollDepthRef = useRef<number>(0);
  const scrollMilestonesRef = useRef<Set<number>>(new Set());

  // Track scroll depth
  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
    
    // Track milestones: 25%, 50%, 75%, 100%
    const milestones = [25, 50, 75, 100];
    milestones.forEach((milestone) => {
      if (scrollPercent >= milestone && !scrollMilestonesRef.current.has(milestone)) {
        scrollMilestonesRef.current.add(milestone);
        analytics.trackScrollDepth(milestone, location.pathname);
      }
    });

    if (scrollPercent > maxScrollDepthRef.current) {
      maxScrollDepthRef.current = scrollPercent;
    }
  }, [location.pathname]);

  // Track time on page when leaving
  const trackTimeOnPage = useCallback(() => {
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (timeSpent > 5) { // Only track if more than 5 seconds
      analytics.trackTimeOnPage(timeSpent, location.pathname);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Track pageview on every route change
    analytics.trackPageView(location.pathname, document.title);
    
    // Reset trackers for new page
    startTimeRef.current = Date.now();
    maxScrollDepthRef.current = 0;
    scrollMilestonesRef.current = new Set();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Track time on page before leaving
    const handleBeforeUnload = () => trackTimeOnPage();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      trackTimeOnPage();
    };
  }, [location.pathname, handleScroll, trackTimeOnPage]);

  // Track external link clicks globally
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href) {
        const isExternal = link.hostname !== window.location.hostname;
        
        if (isExternal) {
          analytics.trackExternalLinkClick(
            link.href,
            link.textContent?.trim() || link.href,
            location.pathname
          );
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [location.pathname]);

  return null;
};