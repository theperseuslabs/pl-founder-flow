import { useEffect } from 'react';

declare global {
  interface Window {
    clarity: any;
  }
}

export const Clarity = () => {
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      // Add Clarity script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = 'https://www.clarity.ms/tag/rfokhtzge2';
      document.head.appendChild(script);

      // Initialize Clarity
      window.clarity = window.clarity || function() {
        (window.clarity.q = window.clarity.q || []).push(arguments);
      };
    }
  }, []);

  return null;
};

export default Clarity; 