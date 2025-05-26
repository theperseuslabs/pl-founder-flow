import mixpanel from 'mixpanel-browser';

// Generate a unique user ID
const generateUserId = () => {
  if (typeof window === 'undefined') return null;
  
  // Try to get existing ID from localStorage
  const existingId = localStorage.getItem('ff_user_id');
  if (existingId) return existingId;

  // Generate new ID if none exists
  const newId = 'ff_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  localStorage.setItem('ff_user_id', newId);
  return newId;
};

let isInitialized = false;

// Initialize Mixpanel
const initializeMixpanel = () => {
  if (isInitialized) return;
  
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) {
    console.warn('Mixpanel token not found');
    return;
  }

  try {
    mixpanel.init(token, {
      debug: process.env.NODE_ENV === 'development',
      track_pageview: true,
      persistence: 'localStorage'
    });
    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Mixpanel:', error);
  }
};

// Get or create user ID
export const getUserId = () => {
  if (typeof window === 'undefined') return null;
  return generateUserId();
};

// Identify user
export const identify = (userId?: string) => {
  if (typeof window === 'undefined') return;
  
  initializeMixpanel();
  if (!isInitialized) return;

  const id = userId || getUserId();
  if (!id) return;

  try {
    mixpanel.identify(id);
    
    // Set user properties
    mixpanel.people.set({
      $last_seen: new Date().toISOString(),
      $created: new Date().toISOString(),
      $browser: window.navigator.userAgent,
    });
  } catch (error) {
    console.error('Failed to identify user in Mixpanel:', error);
  }
};

// Set user properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window === 'undefined' || !isInitialized) return;
  
  try {
    mixpanel.people.set(properties);
  } catch (error) {
    console.error('Failed to set user properties in Mixpanel:', error);
  }
};

// Track event with user identification
export const track = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window === 'undefined') return;
  
  initializeMixpanel();
  if (!isInitialized) return;

  try {
    // Ensure user is identified before tracking
    identify();
    
    // Add user ID to all events
    const eventProperties = {
      ...properties,
      user_id: getUserId(),
      timestamp: new Date().toISOString(),
    };
    
    mixpanel.track(eventName, eventProperties);
  } catch (error) {
    console.error('Failed to track event in Mixpanel:', error);
  }
};

// Reset user
export const reset = () => {
  if (typeof window === 'undefined' || !isInitialized) return;
  
  try {
    mixpanel.reset();
    localStorage.removeItem('ff_user_id');
  } catch (error) {
    console.error('Failed to reset Mixpanel:', error);
  }
};

export default mixpanel; 