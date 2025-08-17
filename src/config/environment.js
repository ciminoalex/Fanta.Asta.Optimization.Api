// Configurazione ambiente per l'app Fantacalcio
export const ENV_CONFIG = {
  // Ambiente corrente
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  
  // Configurazione dati
  DATA_SOURCES: {
    // Priorità di caricamento dati
    PRIORITY: [
      'production-players.json',       // 1. Dati di produzione (priorità massima)
      'sample-players.json',           // 2. Dati di test (fallback)
      'fallback'                       // 3. Dati minimi hardcoded
    ],
    
    // File di produzione
    PRODUCTION_FILE: '/production-players.json',
    
    // File di test
    TEST_FILE: '/sample-players.json',
    
    // Backup automatici
    BACKUP_PREFIX: 'production-players-',
    BACKUP_SUFFIX: '.json'
  },
  
  // Configurazione API
  API: {
    DEFAULT_BASE_URL: 'https://fcapi.mtf-factory.com/proxy.php/api',
    DEFAULT_TIMEOUT: 30000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
  },
  
  // Configurazione app
  APP: {
    NAME: 'Fantacalcio Asta App',
    VERSION: '1.0.0',
    DEFAULT_BUDGET: 500,
    MAX_PLAYERS: 25,
    MIN_PLAYERS: 25
  },
  
  // Configurazione formazione
  FORMATION: {
    DEFAULT: {
      'P': { min: 3, max: 3, percentage: 10 },
      'D': { min: 8, max: 8, percentage: 20 },
      'C': { min: 8, max: 8, percentage: 30 },
      'A': { min: 6, max: 6, percentage: 40 }
    }
  },
  
  // Configurazione fasce
  FASCE: {
    AVAILABLE: ['Top', 'Semi-Top', 'Terza', 'Quarta', 'Scomm.', 'Outsider', 'Titolare "Scarso"', 'Non Impostata'],
    
    COLORS: {
      'Top': 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-600',
      'Semi-Top': 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-600',
      'Terza': 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-600',
      'Quarta': 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-600',
      'Scomm.': 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600',
      'Outsider': 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-600',
      'Titolare "Scarso"': 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-600',
      'Non Impostata': 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-gray-500'
    }
  },
  
  // Configurazione ruoli
  ROLES: {
    LABELS: {
      'P': 'Porta',
      'D': 'Difesa', 
      'C': 'Centroc.',
      'A': 'Attacco'
    },
    
    COLORS: {
      'P': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-blue-100 text-blue-800',
      'C': 'bg-green-100 text-green-800', 
      'A': 'bg-red-100 text-red-800'
    }
  }
};

// Funzioni helper
export const isProduction = () => ENV_CONFIG.ENVIRONMENT === 'production';
export const isDevelopment = () => ENV_CONFIG.ENVIRONMENT === 'development';
export const isTest = () => ENV_CONFIG.ENVIRONMENT === 'test';

// Funzione per ottenere il file dati corretto
export const getDataFile = () => {
  if (isProduction()) {
    return ENV_CONFIG.DATA_SOURCES.PRODUCTION_FILE;
  }
  return ENV_CONFIG.DATA_SOURCES.TEST_FILE;
};

// Funzione per log con prefisso ambiente
export const log = (level, message, ...args) => {
  const prefix = `[${ENV_CONFIG.ENVIRONMENT.toUpperCase()}]`;
  
  switch (level) {
    case 'info':
      console.log(prefix, message, ...args);
      break;
    case 'warn':
      console.warn(prefix, message, ...args);
      break;
    case 'error':
      console.error(prefix, message, ...args);
      break;
    case 'debug':
      if (isDevelopment()) {
        console.log(prefix, '[DEBUG]', message, ...args);
      }
      break;
    default:
      console.log(prefix, message, ...args);
  }
};
