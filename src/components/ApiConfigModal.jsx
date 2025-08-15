import React, { useState, useEffect } from 'react';
import { Settings, TestTube, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { API_CONFIG, getApiUrl } from '../config/api.js';
import { fantaOptimizerApi } from '../services/fantaOptimizerApi.js';

const ApiConfigModal = ({ isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState({
    baseUrl: API_CONFIG.baseUrl,
    timeout: API_CONFIG.timeout,
    minStarterPct: API_CONFIG.defaultParams.minStarterPct,
    starterBoost: API_CONFIG.defaultParams.starterBoost,
    preferBonus: API_CONFIG.defaultParams.preferBonus
  });
  
  const [testStatus, setTestStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig({
        baseUrl: API_CONFIG.baseUrl,
        timeout: API_CONFIG.timeout,
        minStarterPct: API_CONFIG.defaultParams.minStarterPct,
        starterBoost: API_CONFIG.defaultParams.starterBoost,
        preferBonus: API_CONFIG.defaultParams.preferBonus
      });
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const testApiConnection = async () => {
    setIsTesting(true);
    setTestStatus(null);
    
    try {
      // Temporarily update the config for testing
      const originalConfig = { ...API_CONFIG };
      API_CONFIG.baseUrl = config.baseUrl;
      API_CONFIG.timeout = config.timeout;
      
      const result = await fantaOptimizerApi.checkHealth();
      
      if (result.success) {
        setTestStatus({
          success: true,
          message: `API connessa con successo! Versione: ${result.data.version || 'N/A'}`
        });
      } else {
        setTestStatus({
          success: false,
          message: `Errore di connessione: ${result.error}`
        });
      }
      
      // Restore original config
      Object.assign(API_CONFIG, originalConfig);
    } catch (error) {
      setTestStatus({
        success: false,
        message: `Errore di connessione: ${error.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Update the configuration
      await onSave(config);
      onClose();
    } catch (error) {
      console.error('Errore nel salvataggio della configurazione:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Configurazione API Fanta Optimizer
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* API Connection Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Impostazioni di Connessione
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Base API
                </label>
                <input
                  type="url"
                  value={config.baseUrl}
                  onChange={(e) => handleInputChange('baseUrl', e.target.value)}
                  placeholder="http://localhost:3000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  URL del server API Fanta Optimizer
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeout (millisecondi)
                </label>
                <input
                  type="number"
                  value={config.timeout}
                  onChange={(e) => handleInputChange('timeout', parseInt(e.target.value))}
                  min="5000"
                  max="120000"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Tempo massimo di attesa per le richieste API
                </p>
              </div>
            </div>
          </div>

          {/* Optimization Parameters */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Parametri di Ottimizzazione
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  % Min. Titolari
                </label>
                <input
                  type="number"
                  value={config.minStarterPct}
                  onChange={(e) => handleInputChange('minStarterPct', parseInt(e.target.value))}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Percentuale minima di titolari per ruolo
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bonus Titolari
                </label>
                <input
                  type="number"
                  value={config.starterBoost}
                  onChange={(e) => handleInputChange('starterBoost', parseInt(e.target.value))}
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Bonus punti per giocatori titolari
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bonus Preferiti
                </label>
                <input
                  type="number"
                  value={config.preferBonus}
                  onChange={(e) => handleInputChange('preferBonus', parseInt(e.target.value))}
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Bonus per giocatori/squadre preferiti
                </p>
              </div>
            </div>
          </div>

          {/* Test Connection */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">
                Test Connessione API
              </h4>
              <button
                onClick={testApiConnection}
                disabled={isTesting}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <TestTube className="w-4 h-4" />
                <span>{isTesting ? 'Testando...' : 'Test Connessione'}</span>
              </button>
            </div>

            {testStatus && (
              <div className={`flex items-center space-x-2 p-3 rounded-md ${
                testStatus.success 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {testStatus.success ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{testStatus.message}</span>
              </div>
            )}

            <div className="text-sm text-gray-600">
              <p>Endpoint di test: <code className="bg-gray-200 px-2 py-1 rounded">{getApiUrl('/health')}</code></p>
            </div>
          </div>

          {/* API Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Informazioni API
            </h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• L'API ottimizza la rosa considerando budget per ruolo, titolarità e fasce</p>
              <p>• Supporta vincoli, preferenze e giocatori già acquisiti</p>
              <p>• Utilizza algoritmi avanzati per massimizzare il punteggio</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salva Configurazione'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiConfigModal;

