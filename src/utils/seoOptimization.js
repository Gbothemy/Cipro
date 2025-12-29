// SEO Optimization Utilities

// Generate dynamic meta descriptions based on user data
export const generateDynamicDescription = (page, userData = null) => {
  const baseDescriptions = {
    home: "🚀 Join 15,000+ players earning real cryptocurrency daily! Play fun games, complete tasks & earn SOL, ETH, USDT, USDC. Free to start, VIP tiers available. Start earning crypto now!",
    game: "🎮 Play exciting games and earn real cryptocurrency! Choose from Trivia, Memory, Puzzle & Spin Wheel games. Earn SOL, ETH, USDT & USDC rewards daily. Start playing now!",
    vip: "💎 Upgrade to VIP and earn more cryptocurrency! Choose from Silver, Gold, Platinum & Diamond tiers. Get higher rewards, more games, lower fees & exclusive benefits. Subscribe now!",
    leaderboard: "🏆 Check the top crypto earners! See who's leading in points, earnings, and streaks. Compete with 15,000+ players and climb the cryptocurrency gaming leaderboard!",
    airdrop: "🎁 Claim your daily cryptocurrency airdrops! Get free SOL, ETH, USDT & USDC rewards every day. Build your streak for bigger rewards. Claim your free crypto now!",
    referral: "👥 Earn crypto by referring friends! Get 10% of your referrals' earnings forever. Share your link and build passive cryptocurrency income. Start referring now!",
    convert: "💱 Convert your points to real cryptocurrency! Exchange Cipro points for SOL, ETH, USDT & USDC. Secure withdrawals to your wallet. Convert and withdraw now!",
    tasks: "📋 Complete tasks and earn cryptocurrency! Daily, weekly & monthly challenges with crypto rewards. Boost your earnings with bonus tasks. Start completing now!",
    achievements: "🏆 Unlock achievements and earn crypto rewards! Complete gaming milestones for bonus cryptocurrency. Track your progress and earn more. View achievements now!",
    about: "Learn about Cipro's mission to democratize cryptocurrency through gaming. Discover our story, team, and vision for the future of crypto gaming. Join 15,000+ players worldwide!",
    support: "Get help with your Cipro account, games, and cryptocurrency rewards. Find answers to common questions or contact our support team. We're here to help 24/7!"
  };

  let description = baseDescriptions[page] || baseDescriptions.home;

  // Add user-specific data if available
  if (userData) {
    if (userData.points) {
      description = description.replace('Start earning', `You have ${userData.points} points! Keep earning`);
    }
    if (userData.vipLevel > 1) {
      description = description.replace('Free to start', `VIP Level ${userData.vipLevel} member`);
    }
  }

  return description;
};

// Generate structured data for different page types
export const generateStructuredData = (type, data = {}) => {
  const baseData = {
    "@context": "https://schema.org",
    "@type": type
  };

  switch (type) {
    case 'WebApplication':
      return {
        ...baseData,
        "name": "Cipro",
        "description": "Play games and earn real cryptocurrency rewards",
        "url": "https://www.ciprohub.site",
        "applicationCategory": "GameApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "description": "Free to play with premium VIP options"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "2150",
          "bestRating": "5",
          "worstRating": "1"
        },
        ...data
      };

    case 'Game':
      return {
        ...baseData,
        "name": data.name || "Cipro Games",
        "description": data.description || "Cryptocurrency earning games",
        "genre": "Puzzle, Trivia, Memory, Casino",
        "gamePlatform": "Web Browser",
        "applicationCategory": "Game",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        ...data
      };

    case 'Organization':
      return {
        ...baseData,
        "name": "Cipro",
        "description": "Leading cryptocurrency gaming platform",
        "url": "https://www.ciprohub.site",
        "logo": "https://www.ciprohub.site/logo512.png",
        "sameAs": [
          "https://twitter.com/CiproGaming",
          "https://facebook.com/CiproGaming",
          "https://instagram.com/CiproGaming"
        ],
        ...data
      };

    case 'FAQPage':
      return {
        ...baseData,
        "mainEntity": data.faqs || []
      };

    default:
      return baseData;
  }
};

// SEO-friendly URL generation
export const generateSEOUrl = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

// Generate breadcrumb structured data
export const generateBreadcrumbData = (breadcrumbs) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
};

// Performance optimization for images
export const optimizeImageForSEO = (src, alt, width = null, height = null) => {
  return {
    src,
    alt,
    loading: "lazy",
    decoding: "async",
    ...(width && { width }),
    ...(height && { height })
  };
};

// Generate social media sharing URLs
export const generateSocialShareUrls = (url, title, description) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
  };
};

// Track SEO events for analytics
export const trackSEOEvent = (eventName, data = {}) => {
  // Google Analytics 4 event tracking
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, {
      event_category: 'SEO',
      event_label: data.label || '',
      value: data.value || 0,
      ...data
    });
  }

  // Custom analytics tracking
  if (window.analytics) {
    window.analytics.track(eventName, {
      category: 'SEO',
      ...data
    });
  }
};

// Generate rich snippets for search results
export const generateRichSnippets = (type, data) => {
  switch (type) {
    case 'review':
      return {
        "@context": "https://schema.org",
        "@type": "Review",
        "itemReviewed": {
          "@type": "WebApplication",
          "name": "Cipro"
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": data.rating || "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": data.author || "Anonymous"
        },
        "reviewBody": data.review || "Great platform for earning cryptocurrency through gaming!"
      };

    case 'howto':
      return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": data.name || "How to Earn Cryptocurrency with Cipro",
        "description": data.description || "Step-by-step guide to earning crypto through gaming",
        "step": data.steps || [
          {
            "@type": "HowToStep",
            "name": "Sign Up",
            "text": "Create your free Cipro account"
          },
          {
            "@type": "HowToStep",
            "name": "Play Games",
            "text": "Choose from our selection of fun games"
          },
          {
            "@type": "HowToStep",
            "name": "Earn Rewards",
            "text": "Collect cryptocurrency rewards for playing"
          }
        ]
      };

    default:
      return null;
  }
};

// SEO performance monitoring
export const monitorSEOPerformance = () => {
  // Page load performance
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        trackSEOEvent('page_load_performance', {
          load_time: perfData.loadEventEnd - perfData.loadEventStart,
          dom_content_loaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          first_paint: performance.getEntriesByType('paint')[0]?.startTime || 0
        });
      }
    });
  }
};

// Initialize SEO optimizations
export const initializeSEO = () => {
  // Add structured data to head if not present
  if (!document.querySelector('script[type="application/ld+json"]')) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(generateStructuredData('WebApplication'));
    document.head.appendChild(script);
  }

  // Monitor performance
  monitorSEOPerformance();

  // Track initial page view
  trackSEOEvent('page_view', {
    page: window.location.pathname,
    title: document.title
  });
};