// Traffic and Revenue Tracking System
import { db } from '../db/supabase';

class TrafficTracker {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.pageViews = 0;
    this.adImpressions = 0;
    this.adClicks = 0;
    this.startTime = Date.now();
    this.lastActivity = Date.now();
    
    // Initialize session tracking
    this.initSession();
    
    // Track page visibility changes
    this.setupVisibilityTracking();
    
    // Track initial page view
    this.trackPageView();
    
    // Setup periodic revenue recording
    this.setupPeriodicTracking();
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }

  async initSession() {
    try {
      // Get user info if available
      const userId = localStorage.getItem('user_id') || null;
      
      // Record session start
      await db.recordUserSession({
        sessionId: this.sessionId,
        userId: userId,
        userAgent: navigator.userAgent,
        ipAddress: await this.getClientIP()
      });
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  }

  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  trackPageView() {
    this.pageViews++;
    this.lastActivity = Date.now();
    
    // Simulate ad impression (every page view shows ads)
    this.trackAdImpression();
    
    // Update session data
    this.updateSession();
  }

  trackAdImpression() {
    this.adImpressions++;
    
    // Calculate revenue (CPM model: $2 per 1000 impressions)
    const revenuePerImpression = 2.00 / 1000; // $0.002 per impression
    this.recordAdRevenue(revenuePerImpression);
  }

  trackAdClick() {
    this.adClicks++;
    
    // Calculate revenue (CPC model: $0.50 per click)
    const revenuePerClick = 0.50;
    this.recordAdRevenue(revenuePerClick);
    
    // Update session data
    this.updateSession();
  }

  async recordAdRevenue(amount) {
    try {
      await db.recordTrafficRevenue({
        pageViews: 1,
        uniqueVisitors: this.pageViews === 1 ? 1 : 0, // Only count first page view as unique
        adImpressions: 1,
        adClicks: 0,
        revenue: amount
      });
    } catch (error) {
      console.error('Error recording ad revenue:', error);
    }
  }

  async updateSession() {
    try {
      const duration = Math.floor((Date.now() - this.startTime) / 1000);
      const revenueGenerated = (this.adImpressions * 0.002) + (this.adClicks * 0.50);
      
      await db.updateUserSession(this.sessionId, {
        pageViews: this.pageViews,
        duration: duration,
        adImpressions: this.adImpressions,
        adClicks: this.adClicks,
        revenueGenerated: revenueGenerated
      });
    } catch (error) {
      console.error('Error updating session:', error);
    }
  }

  setupVisibilityTracking() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, update session
        this.updateSession();
      } else {
        // Page is visible again, track as activity
        this.lastActivity = Date.now();
      }
    });

    // Track when user leaves the page
    window.addEventListener('beforeunload', () => {
      this.updateSession();
    });
  }

  setupPeriodicTracking() {
    // Update session every 30 seconds
    setInterval(() => {
      this.updateSession();
    }, 30000);
  }

  // Method to be called when user navigates to new page
  onPageChange() {
    this.trackPageView();
  }

  // Method to be called when ad is clicked
  onAdClick() {
    this.trackAdClick();
  }

  // Get current session stats
  getSessionStats() {
    const duration = Math.floor((Date.now() - this.startTime) / 1000);
    const revenueGenerated = (this.adImpressions * 0.002) + (this.adClicks * 0.50);
    
    return {
      sessionId: this.sessionId,
      pageViews: this.pageViews,
      duration: duration,
      adImpressions: this.adImpressions,
      adClicks: this.adClicks,
      revenueGenerated: revenueGenerated
    };
  }
}

// Create global instance
const trafficTracker = new TrafficTracker();

export default trafficTracker;
