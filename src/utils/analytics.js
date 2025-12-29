// Advanced Analytics and Tracking System

// Google Analytics 4 Configuration
export const initializeGA4 = (measurementId) => {
  // Load Google Analytics 4
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', measurementId, {
    page_title: document.title,
    page_location: window.location.href,
    send_page_view: true,
    // Enhanced ecommerce for VIP subscriptions
    custom_map: {
      'custom_parameter_1': 'user_tier',
      'custom_parameter_2': 'crypto_earned'
    }
  });

  // Track initial page view
  gtag('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname
  });
};

// Facebook Pixel Configuration
export const initializeFacebookPixel = (pixelId) => {
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  
  fbq('init', pixelId);
  fbq('track', 'PageView');
};

// Custom Event Tracking
export const trackEvent = (eventName, parameters = {}) => {
  // Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, {
      event_category: parameters.category || 'engagement',
      event_label: parameters.label || '',
      value: parameters.value || 0,
      user_id: parameters.userId || null,
      custom_parameter_1: parameters.userTier || null,
      custom_parameter_2: parameters.cryptoEarned || null,
      ...parameters
    });
  }

  // Facebook Pixel
  if (typeof fbq !== 'undefined') {
    fbq('track', eventName, parameters);
  }

  // Custom analytics endpoint
  if (parameters.sendToCustom !== false) {
    sendToCustomAnalytics(eventName, parameters);
  }
};

// Crypto Gaming Specific Events
export const trackCryptoEvents = {
  // User Registration
  userRegistered: (userId, referralSource = null) => {
    trackEvent('sign_up', {
      method: 'email',
      user_id: userId,
      referral_source: referralSource,
      category: 'user_acquisition'
    });
  },

  // Game Events
  gameStarted: (gameType, userId, userTier) => {
    trackEvent('game_start', {
      game_type: gameType,
      user_id: userId,
      user_tier: userTier,
      category: 'gaming'
    });
  },

  gameCompleted: (gameType, score, pointsEarned, userId) => {
    trackEvent('game_complete', {
      game_type: gameType,
      score: score,
      points_earned: pointsEarned,
      user_id: userId,
      value: pointsEarned,
      category: 'gaming'
    });
  },

  // Crypto Earning Events
  cryptoEarned: (currency, amount, source, userId) => {
    trackEvent('crypto_earned', {
      currency: currency,
      value: amount,
      earning_source: source,
      user_id: userId,
      category: 'crypto_rewards'
    });
  },

  cryptoWithdrawn: (currency, amount, userId) => {
    trackEvent('crypto_withdrawal', {
      currency: currency,
      value: amount,
      user_id: userId,
      category: 'crypto_transactions'
    });
  },

  // VIP Subscription Events
  vipSubscriptionStarted: (tier, price, billingCycle, userId) => {
    trackEvent('purchase', {
      transaction_id: `vip_${Date.now()}`,
      value: price,
      currency: 'USD',
      items: [{
        item_id: `vip_${tier.toLowerCase()}`,
        item_name: `VIP ${tier}`,
        item_category: 'subscription',
        item_variant: billingCycle,
        price: price,
        quantity: 1
      }],
      user_id: userId,
      category: 'vip_subscription'
    });
  },

  vipSubscriptionCancelled: (tier, userId) => {
    trackEvent('subscription_cancelled', {
      subscription_tier: tier,
      user_id: userId,
      category: 'vip_subscription'
    });
  },

  // Referral Events
  referralShared: (userId, platform) => {
    trackEvent('share', {
      method: platform,
      content_type: 'referral_link',
      user_id: userId,
      category: 'referral'
    });
  },

  referralConverted: (referrerId, newUserId) => {
    trackEvent('referral_conversion', {
      referrer_id: referrerId,
      new_user_id: newUserId,
      category: 'referral'
    });
  },

  // Engagement Events
  dailyLoginStreak: (streakDays, userId) => {
    trackEvent('daily_streak', {
      streak_days: streakDays,
      user_id: userId,
      value: streakDays,
      category: 'engagement'
    });
  },

  taskCompleted: (taskType, pointsEarned, userId) => {
    trackEvent('task_completed', {
      task_type: taskType,
      points_earned: pointsEarned,
      user_id: userId,
      value: pointsEarned,
      category: 'engagement'
    });
  }
};

// Custom Analytics Endpoint
const sendToCustomAnalytics = async (eventName, parameters) => {
  // Disabled for now - no backend API endpoint
  console.log('Custom analytics:', eventName, parameters);
};

// Performance Monitoring
export const trackPerformance = () => {
  // Core Web Vitals
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        trackEvent('web_vital_lcp', {
          value: Math.round(entry.startTime),
          category: 'performance'
        });
      }
      
      if (entry.entryType === 'first-input') {
        trackEvent('web_vital_fid', {
          value: Math.round(entry.processingStart - entry.startTime),
          category: 'performance'
        });
      }
      
      if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
        trackEvent('web_vital_cls', {
          value: entry.value,
          category: 'performance'
        });
      }
    }
  });

  observer.observe({entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift']});

  // Page Load Performance
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0];
    trackEvent('page_load_time', {
      value: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
      category: 'performance'
    });
  });
};

// User Behavior Tracking
export const trackUserBehavior = () => {
  // Scroll depth tracking
  let maxScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
      maxScroll = scrollPercent;
      trackEvent('scroll_depth', {
        scroll_percent: scrollPercent,
        category: 'engagement'
      });
    }
  });

  // Time on page tracking
  let startTime = Date.now();
  window.addEventListener('beforeunload', () => {
    const timeOnPage = Math.round((Date.now() - startTime) / 1000);
    trackEvent('time_on_page', {
      value: timeOnPage,
      category: 'engagement'
    });
  });

  // Click tracking for important elements
  document.addEventListener('click', (event) => {
    const element = event.target;
    
    // Track CTA button clicks
    if (element.classList.contains('cta-btn') || element.classList.contains('action-btn')) {
      trackEvent('cta_click', {
        button_text: element.textContent.trim(),
        button_location: element.closest('section')?.className || 'unknown',
        category: 'engagement'
      });
    }
    
    // Track navigation clicks
    if (element.tagName === 'A' && element.href) {
      trackEvent('navigation_click', {
        link_url: element.href,
        link_text: element.textContent.trim(),
        category: 'navigation'
      });
    }
  });
};

// Error Tracking
export const trackErrors = () => {
  window.addEventListener('error', (event) => {
    trackEvent('javascript_error', {
      error_message: event.message,
      error_filename: event.filename,
      error_line: event.lineno,
      error_column: event.colno,
      category: 'error'
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    trackEvent('promise_rejection', {
      error_message: event.reason?.message || 'Unknown promise rejection',
      category: 'error'
    });
  });
};

// Initialize all analytics
export const initializeAnalytics = (config = {}) => {
  // Initialize Google Analytics 4
  if (config.ga4MeasurementId) {
    initializeGA4(config.ga4MeasurementId);
  }

  // Initialize Facebook Pixel
  if (config.facebookPixelId) {
    initializeFacebookPixel(config.facebookPixelId);
  }

  // Start performance monitoring
  trackPerformance();

  // Start user behavior tracking
  trackUserBehavior();

  // Start error tracking
  trackErrors();

  console.log('🔍 Analytics initialized successfully');
};