import mixpanel from 'mixpanel-browser';

// Generate a unique user ID
const generateUserId = () => {
  // Try to get existing ID from localStorage
  const existingId = localStorage.getItem('ff_user_id');
  if (existingId) return existingId;

  // Generate new ID if none exists
  const newId = 'ff_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  localStorage.setItem('ff_user_id', newId);
  return newId;
};

// Initialize Mixpanel
mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '', {
  debug: process.env.NODE_ENV === 'development',
  track_pageview: true,
  persistence: 'localStorage'
});

// Get or create user ID
export const getUserId = () => {
  const userId = generateUserId();
  return userId;
};

// Identify user
export const identify = (userId?: string) => {
  const id = userId || getUserId();
  mixpanel.identify(id);
  
  // Set user properties
  mixpanel.people.set({
    $last_seen: new Date().toISOString(),
    $created: new Date().toISOString(),
    $browser: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
  });
};

// Set user properties
export const setUserProperties = (properties: Record<string, any>) => {
  mixpanel.people.set(properties);
};

// Track event with user identification
export const track = (eventName: string, properties?: Record<string, any>) => {
  // Ensure user is identified before tracking
  identify();
  
  // Add user ID to all events
  const eventProperties = {
    ...properties,
    user_id: getUserId(),
    timestamp: new Date().toISOString(),
  };
  
  mixpanel.track(eventName, eventProperties);
};

// Reset user
export const reset = () => {
  mixpanel.reset();
  localStorage.removeItem('ff_user_id');
};

export default mixpanel; 