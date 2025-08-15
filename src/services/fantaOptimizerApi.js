import { API_CONFIG, getApiUrl, isApiConfigured } from '../config/api.js';

/**
 * Service class for interacting with the Fanta Optimizer API
 */
class FantaOptimizerApiService {
  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.timeout = API_CONFIG.timeout;
  }

  /**
   * Check if the API is available and responding
   */
  async checkHealth() {
    try {
      const response = await fetch(getApiUrl(API_CONFIG.endpoints.health), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
        status: response.status
      };
    } catch (error) {
      console.error('API Health Check failed:', error);
      return {
        success: false,
        error: error.message,
        status: error.status || 0
      };
    }
  }

  /**
   * Transform local player data to API format
   */
  transformPlayersForApi(players, budget) {
    return players
      .map(player => ({
        id: String(player.id),
        name: player.name,
        team: player.team,
        role: player.role,
        cost: Math.round(budget / 100 *player.budgetPercentage), // Use QUO as cost, fallback to 1
        rating: player.quo, // Convert QUO to 0-100 rating
        starter: (player.titolarita || 0) >= 4 // Consider players with titolarita >= 4 as starters
      }));
  }

  /**
   * Transform local team data to API format
   */
  transformTeamForApi(team) {
    return team.map(player => ({
      id: String(player.id),
      price: player.paidPrice || 0
    }));
  }

  /**
   * Build configuration for the API request
   */
  buildConfigForApi(formation, totalBudget, minStarterPct = 50) {
    const rolePercentages = {};
    const roleCounts = {};

    Object.entries(formation).forEach(([role, config]) => {
      rolePercentages[role] = config.percentage;
      roleCounts[role] = config.max;
    });

    return {
      totalBudget,
      rolePercentages,
      roleCounts,
      minStarterPct,
      starterBoost: API_CONFIG.defaultParams.starterBoost,
      constraints: {
        locks: [],
        excludes: [],
        preferIds: [],
        preferTeams: [],
        preferBonus: API_CONFIG.defaultParams.preferBonus
      }
    };
  }

  /**
   * Optimize team using the external API
   */
  async optimizeTeam(players, formation, totalBudget, myTeam = [], options = {}) {
    if (!isApiConfigured()) {
      throw new Error('API non configurata. Controlla il file di configurazione.');
    }


    console.log('players', players);
    try {
      // Transform data for API
      const apiPlayers = this.transformPlayersForApi(
        players.filter(p => !p.isUnavailable),
        totalBudget
      );
      const apiConfig = this.buildConfigForApi(formation, totalBudget, options.minStarterPct);
      const apiAcquired = this.transformTeamForApi(myTeam);

      // Prepare request payload
      const payload = {
        players: apiPlayers,
        config: apiConfig,
        acquired: apiAcquired
      };

      console.log('Sending optimization request to API:', payload);

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.optimize), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      
      // Transform API result back to local format
      return this.transformApiResultToLocal(result, players);
    } catch (error) {
      console.error('Team optimization failed:', error);
      throw error;
    }
  }

  /**
   * Transform API result back to local player format
   */
  transformApiResultToLocal(apiResult, originalPlayers) {
    const transformed = {
      byRole: {},
      totalCost: apiResult.totalCost || 0,
      totalScore: apiResult.totalScore || 0,
      budgets: apiResult.budgets || {},
      initialBudgets: apiResult.initialBudgets || {}
    };

    // Transform each role solution
    Object.entries(apiResult.byRole || {}).forEach(([role, roleSolution]) => {
      transformed.byRole[role] = {
        chosen: roleSolution.chosen.map(apiPlayer => {
          // Find original player data
          const originalPlayer = originalPlayers.find(p => String(p.id) === apiPlayer.id);
          return {
            ...originalPlayer,
            proposedPrice: apiPlayer.cost,
            isSelected: true
          };
        }),
        totalCost: roleSolution.totalCost || 0,
        totalScore: roleSolution.totalScore || 0,
        startersCount: roleSolution.startersCount || 0
      };
    });

    return transformed;
  }

  /**
   * Retry mechanism for failed requests
   */
  async retryRequest(requestFn, maxAttempts = API_CONFIG.retry.attempts) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        console.warn(`API request attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, API_CONFIG.retry.delay));
        }
      }
    }
    
    throw lastError;
  }
}

// Export singleton instance
export const fantaOptimizerApi = new FantaOptimizerApiService();
export default fantaOptimizerApi;
