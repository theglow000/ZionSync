"use client";

import { useState, useEffect } from 'react';
import useMediaQuery from './useMediaQuery';

/**
 * Custom hook that provides boolean values for common screen sizes
 * @returns {Object} Object containing boolean values for different screen sizes
 */
const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Add event listener
    window.addEventListener("resize", handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1280px)');

  return {
    width: windowSize.width,
    height: windowSize.height,
    isMobile: windowSize.width < 768, // Assumes mobile is less than 768px width
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
    isLargeDesktop,
    // Helper for "is at least this size"
    atLeastTablet: !isMobile,
    atLeastDesktop: isDesktop || isLargeDesktop,
  };
};

export default useResponsive;