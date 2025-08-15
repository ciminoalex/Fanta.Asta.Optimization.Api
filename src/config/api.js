// Configuration file for external API integration
// Modify these values to connect to your Fanta Optimizer API

// Default configuration
const DEFAULT_CONFIG = {
  // Base URL for the Fanta Optimizer API
  baseUrl: 'http://localhost:3001',
  
  // API endpoints
  endpoints: {
    health: '/health',
    optimize: '/optimize'
  },
  
  // Request timeout in milliseconds
  timeout: 30000,
  
  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000
  },
  
  // Default optimization parameters
  defaultParams: {
    minStarterPct: 50,
    starterBoost: 5,
    preferBonus: 10
  }
};

// Load configuration from localStorage or use defaults
const loadConfig = () => {
  try {
    const saved = localStorage.getItem('fanta_optimizer_api_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load API config from localStorage:', error);
  }
  return DEFAULT_CONFIG;
};

// Save configuration to localStorage
const saveConfig = (config) => {
  try {
    localStorage.setItem('fanta_optimizer_api_config', JSON.stringify(config));
    // Update the current config
    Object.assign(API_CONFIG, config);
    return true;
  } catch (error) {
    console.error('Failed to save API config to localStorage:', error);
    return false;
  }
};

// Initialize configuration
export let API_CONFIG = loadConfig();

// Export save function
export const saveApiConfig = saveConfig;

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.baseUrl}${endpoint}`;
};

// Helper function to check if API is configured
export const isApiConfigured = () => {
  return API_CONFIG.baseUrl && API_CONFIG.baseUrl !== '';
};

// Helper function to reload configuration
export const reloadApiConfig = () => {
  API_CONFIG = loadConfig();
  return API_CONFIG;
};
