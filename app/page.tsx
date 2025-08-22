'use client';

import { useEffect } from 'react';
import { SlideInput } from '../components/SlideInput/SlideInput';

export default function HomePage() {
  useEffect(() => {
    // Check if we're coming from a slides presentation
    // If remark.js elements exist in the DOM, refresh to clean up
    const hasRemarkElements = document.querySelectorAll('[class*="remark"]').length > 0;
    
    if (hasRemarkElements) {
      // Small delay to ensure smooth navigation, then refresh
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }, []);

  return (
    <>
      <SlideInput />
    </>
  );
}
