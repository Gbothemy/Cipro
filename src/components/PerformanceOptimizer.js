import { useEffect } from 'react';
import { trackEvent } from '../utils/analytics';

// Performance optimization component
function PerformanceOptimizer() {
  useEffect(() => {
    // Preload critical resources
    const preloadCriticalResources = () => {
      // Preload important images
      const criticalImages = [
        '/logo192.png',
        '/logo512.png',
        '/favicon.ico'
      ];

      criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
      });

      // Preload critical fonts
      const fontLink = document.createElement('link');
      fontLink.rel = 'preload';
      fontLink.as = 'font';
      fontLink.type = 'font/woff2';
      fontLink.crossOrigin = 'anonymous';
      fontLink.href = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2';
      document.head.appendChild(fontLink);
    };

    // Optimize images with lazy loading
    const optimizeImages = () => {
      const images = document.querySelectorAll('img[data-src]');
      
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          });
        });

        images.forEach(img => imageObserver.observe(img));
      } else {
        // Fallback for browsers without IntersectionObserver
        images.forEach(img => {
          img.src = img.dataset.src;
          img.classList.remove('lazy');
        });
      }
    };

    // Service Worker registration for caching
    const registerServiceWorker = () => {
      // Disabled for now due to MIME type issues on Vercel
      console.log('Service Worker registration disabled');
    };

    // Critical CSS inlining
    const inlineCriticalCSS = () => {
      const criticalCSS = `
        /* Critical CSS for above-the-fold content */
        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 1.5rem;
        }
        
        .page-header {
          text-align: center;
          padding: 2rem 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .cta-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 25px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
      `;

      const style = document.createElement('style');
      style.textContent = criticalCSS;
      document.head.appendChild(style);
    };

    // Resource hints for external domains
    const addResourceHints = () => {
      const hints = [
        { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
        { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
        { rel: 'dns-prefetch', href: '//www.google-analytics.com' },
        { rel: 'dns-prefetch', href: '//pagead2.googlesyndication.com' },
        { rel: 'preconnect', href: 'https://yafswrgnzepfjtaeibep.supabase.co' }
      ];

      hints.forEach(hint => {
        const link = document.createElement('link');
        link.rel = hint.rel;
        link.href = hint.href;
        if (hint.rel === 'preconnect') {
          link.crossOrigin = 'anonymous';
        }
        document.head.appendChild(link);
      });
    };

    // Core Web Vitals optimization
    const optimizeCoreWebVitals = () => {
      // Largest Contentful Paint (LCP) optimization
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            trackEvent('lcp_measurement', {
              value: Math.round(entry.startTime),
              category: 'performance'
            });
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // Browser doesn't support this API
      }

      // First Input Delay (FID) optimization
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            trackEvent('fid_measurement', {
              value: Math.round(entry.processingStart - entry.startTime),
              category: 'performance'
            });
          }
        }
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // Browser doesn't support this API
      }
    };

    // Memory management
    const optimizeMemory = () => {
      // Clean up unused event listeners
      const cleanupEventListeners = () => {
        // Remove passive event listeners that are no longer needed
        const unusedElements = document.querySelectorAll('[data-cleanup]');
        unusedElements.forEach(element => {
          element.removeEventListener('click', () => {});
          element.removeEventListener('scroll', () => {});
        });
      };

      // Garbage collection hints
      if (window.gc && process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          window.gc();
        }, 5000);
      }

      // Clean up on page unload
      window.addEventListener('beforeunload', cleanupEventListeners);
    };

    // Initialize all optimizations
    preloadCriticalResources();
    optimizeImages();
    registerServiceWorker();
    inlineCriticalCSS();
    addResourceHints();
    optimizeCoreWebVitals();
    optimizeMemory();

    // Cleanup function
    return () => {
      // Clean up observers and event listeners
    };
  }, []);

  return null; // This component doesn't render anything
}

export default PerformanceOptimizer;