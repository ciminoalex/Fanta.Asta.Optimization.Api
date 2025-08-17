import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Users, TrendingUp, Calculator, Award, Trash2, ArrowUp, Crown, Star, Medal, Trophy, Zap, Target, AlertTriangle, HelpCircle, X, Settings, Zap as ZapIcon } from 'lucide-react';
import { fantaOptimizerApi } from '../services/fantaOptimizerApi.js';
import { isApiConfigured, saveApiConfig } from '../config/api.js';
import ApiConfigModal from './ApiConfigModal.jsx';
import { ENV_CONFIG, log } from '../config/environment.js';

// Funzione per caricare i dati dal JSON
const loadPlayersFromJson = async () => {
  try {
    log('info', 'Caricamento dati secondo la priorità configurata...');
    
    // Carica direttamente i dati di produzione (priorità massima)
    return await loadProductionPlayersData();
  } catch (error) {
    log('error', 'Errore nel caricamento dei dati:', error);
    return await loadProductionPlayersData();
  }
};

// Funzione per caricare i dati di produzione dal file JSON
const loadProductionPlayersData = async () => {
  try {
    log('info', 'Tentativo di caricamento dati di produzione...');
    
    // Prima prova a caricare i dati di produzione
    const productionResponse = await fetch(ENV_CONFIG.DATA_SOURCES.PRODUCTION_FILE);
    if (productionResponse.ok) {
      const productionData = await productionResponse.json();
      log('info', `✅ Dati di produzione caricati con successo: ${productionData.length} giocatori`);
      return productionData;
    }
    
    // Fallback sui dati di esempio se quelli di produzione non esistono
    log('warn', '⚠️ Dati di produzione non trovati, uso dati di esempio');
    const sampleResponse = await fetch(ENV_CONFIG.DATA_SOURCES.TEST_FILE);
    if (sampleResponse.ok) {
      const sampleData = await sampleResponse.json();
      log('info', `📋 Dati di esempio caricati: ${sampleData.length} giocatori`);
      return sampleData;
    }
    throw new Error('Impossibile caricare i dati');
  } catch (error) {
    log('error', 'Errore nel caricamento dei dati:', error);
    // Fallback con dati minimi se i file JSON non sono disponibili
    log('warn', '🔄 Utilizzo dati minimi di fallback');
    return [
      {"id":1,"name":"KEAN","team":"FIO","role":"A","fascia":"Top","budgetPercentage":30,"fmv":5.93,"gol":14,"assist":0,"presenze":19,"notes":"titolarissimo • tanti gol"},
      {"id":2,"name":"MARTINEZ L.","team":"INT","role":"A","fascia":"Top","budgetPercentage":30,"fmv":8.73,"gol":24,"assist":3,"presenze":33,"notes":"titolarissimo • tanti gol"}
    ];
  }
};

const roleLabels = {
  'P': 'Porta',
  'D': 'Difesa', 
  'C': 'Centroc.',
  'A': 'Attacco'
};

const roleColors = {
  'P': 'bg-yellow-100 text-yellow-800',
  'D': 'bg-blue-100 text-blue-800',
  'C': 'bg-green-100 text-green-800', 
  'A': 'bg-red-100 text-red-800'
};

const defaultFormation = {
  'P': { min: 3, max: 3, percentage: 10 },
  'D': { min: 8, max: 8, percentage: 20 },
  'C': { min: 8, max: 8, percentage: 30 },
  'A': { min: 6, max: 6, percentage: 40 }
};

const fasciaConfig = {
  'Top': { 
    icon: Crown, 
    colors: 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-600'
  },
  'Semi-Top': { 
    icon: Star, 
    colors: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-600'
  },
  'Terza': { 
    icon: Medal, 
    colors: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-600'
  },
  'Quarta': { 
    icon: Trophy, 
    colors: 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-600'
  },
  'Scomm.': { 
    icon: Zap, 
    colors: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600'
  },
  'Outsider': { 
    icon: Target, 
    colors: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-600'
  },
  'Titolare "Scarso"': { 
    icon: AlertTriangle, 
    colors: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-600'
  },
  'Non Impostata': { 
    icon: HelpCircle, 
    colors: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-gray-500'
  }
};

const AVAILABLE_FASCE = ['Top', 'Semi-Top', 'Terza', 'Quarta', 'Scomm.', 'Outsider', 'Titolare "Scarso"', 'Non Impostata'];

// Configurazione colori squadre per tag bicolore
const squadraColors = {
  'Atalanta': { colore1: 'bg-black', colore2: 'bg-blue-500' },
  'Bologna': { colore1: 'bg-red-600', colore2: 'bg-blue-600' },
  'Cagliari': { colore1: 'bg-red-600', colore2: 'bg-blue-600' },
  'Como': { colore1: 'bg-blue-600', colore2: 'bg-white' },
  'Cremonese': { colore1: 'bg-gray-500', colore2: 'bg-red-600' },
  'Fiorentina': { colore1: 'bg-purple-600', colore2: 'bg-white' },
  'Genoa': { colore1: 'bg-red-600', colore2: 'bg-blue-600' },
  'Inter': { colore1: 'bg-black', colore2: 'bg-blue-500' },
  'Juventus': { colore1: 'bg-white', colore2: 'bg-black' },
  'Lazio': { colore1: 'bg-white', colore2: 'bg-sky-400' },
  'Lecce': { colore1: 'bg-yellow-400', colore2: 'bg-red-600' },
  'Milan': { colore1: 'bg-red-600', colore2: 'bg-black' },
  'Napoli': { colore1: 'bg-blue-500', colore2: 'bg-white' },
  'Parma': { colore1: 'bg-yellow-400', colore2: 'bg-blue-600' },
  'Pisa': { colore1: 'bg-black', colore2: 'bg-blue-500' },
  'Roma': { colore1: 'bg-red-600', colore2: 'bg-yellow-400' },
  'Sassuolo': { colore1: 'bg-black', colore2: 'bg-green-500' },
  'Torino': { colore1: 'bg-red-800', colore2: 'bg-white' },
  'Udinese': { colore1: 'bg-white', colore2: 'bg-black' },
  'Verona': { colore1: 'bg-yellow-400', colore2: 'bg-blue-600' }
};

// Mapping tra abbreviazioni e nomi completi delle squadre
const squadraAbbreviazioni = {
  'ATA': 'Atalanta',
  'BOL': 'Bologna',
  'CAG': 'Cagliari',
  'COM': 'Como',
  'CRE': 'Cremonese',
  'FIO': 'Fiorentina',
  'GEN': 'Genoa',
  'INT': 'Inter',
  'JUV': 'Juventus',
  'LAZ': 'Lazio',
  'LEC': 'Lecce',
  'MIL': 'Milan',
  'NAP': 'Napoli',
  'PAR': 'Parma',
  'PIS': 'Pisa',
  'ROM': 'Roma',
  'SAS': 'Sassuolo',
  'TOR': 'Torino',
  'UDI': 'Udinese',
  'VER': 'Verona'
};

// ===== NUOVO ALGORITMO OTTIMIZZATO PER ROSA IDEALE =====

// Interfacce TypeScript per il nuovo algoritmo
/**
 * @typedef {Object} Player
 * @property {string} id - Identificativo univoco
 * @property {string} name - Nome giocatore
 * @property {string} team - Nome squadra (abbreviazione)
 * @property {string} role - Ruolo: 'P', 'D', 'C', 'A'
 * @property {number} cost - Costo in crediti
 * @property {number} rating - Valutazione in % (0..100)
 * @property {boolean} starter - True se titolare, false altrimenti
 */

/**
 * @typedef {Object} BuildConfig
 * @property {number} totalBudget - Budget totale (es. 500)
 * @property {Object} rolePercentages - Percentuali budget per reparto {P, D, C, A}
 * @property {Object} roleCounts - Numero giocatori per reparto {P, D, C, A}
 * @property {number} minStarterPct - Percentuale minima titolari per reparto (es. 70)
 * @property {number} [starterBoost] - Bonus per titolari (opzionale, default 0)
 */

/**
 * @typedef {Object} RoleSolution
 * @property {Array} chosen - Giocatori selezionati per il ruolo
 * @property {number} totalCost - Costo totale per il ruolo
 * @property {number} totalScore - Punteggio totale per il ruolo
 * @property {number} startersCount - Numero di titolari selezionati
 */

/**
 * @typedef {Object} BuildResult
 * @property {Object} byRole - Soluzioni per ogni ruolo {P, D, C, A}
 * @property {number} totalCost - Costo totale della rosa
 * @property {number} totalScore - Punteggio totale della rosa
 */

// Funzioni helper per il nuovo algoritmo
const calculateRoleBudget = (totalBudget, rolePercentage) => {
  return Math.floor(totalBudget * rolePercentage / 100);
};


const distributeRemainingBudget = (totalBudget, roleBudgets, rolePercentages) => {
  const totalAllocated = Object.values(roleBudgets).reduce((sum, budget) => sum + budget, 0);
  const remaining = totalBudget - totalAllocated;
  
  if (remaining <= 0) return roleBudgets;
  
  // Trova i ruoli con la parte decimale maggiore
  const roleDecimals = Object.entries(rolePercentages).map(([role, pct]) => ({
    role,
    decimal: (pct / 100) - Math.floor(pct / 100)
  })).sort((a, b) => b.decimal - a.decimal);
  
  // Distribuisci il resto ai ruoli con decimali maggiori
  let remainingToDistribute = remaining;
  for (const { role } of roleDecimals) {
    if (remainingToDistribute > 0) {
      roleBudgets[role]++;
      remainingToDistribute--;
    }
  }
  
  return roleBudgets;
};

const solveKnapsackExact = (players, targetCount, maxBudget, starterBoost = 0) => {
  if (players.length === 0 || targetCount === 0) {
    return { chosen: [], totalCost: 0, totalScore: 0 };
  }
  
  // DP bidimensionale: dp[c][b] = miglior punteggio con esattamente c giocatori e costo totale b
  const dp = Array(targetCount + 1).fill().map(() => Array(maxBudget + 1).fill(-Infinity));
  const chosen = Array(targetCount + 1).fill().map(() => Array(maxBudget + 1).fill(null));
  
  // Base case: 0 giocatori, 0 costo
  dp[0][0] = 0;
  
  // Per ogni giocatore
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const playerScore = player.rating + (player.starter ? starterBoost : 0);
    
    // Per ogni numero di giocatori (dal target verso il basso per evitare sovrapposizioni)
    for (let c = targetCount; c >= 1; c--) {
      // Per ogni budget (dal massimo verso il basso)
      for (let b = maxBudget; b >= player.cost; b--) {
        const prevScore = dp[c - 1][b - player.cost];
        if (prevScore !== -Infinity) {
          const newScore = prevScore + playerScore;
          if (newScore > dp[c][b]) {
            dp[c][b] = newScore;
            chosen[c][b] = { player, prevC: c - 1, prevB: b - player.cost };
          }
        }
      }
    }
  }
  
  // Trova la soluzione ottimale
  let bestScore = -Infinity;
  let bestCost = 0;
  
  for (let b = 0; b <= maxBudget; b++) {
    if (dp[targetCount][b] > bestScore) {
      bestScore = dp[targetCount][b];
      bestCost = b;
    }
  }
  
  if (bestScore === -Infinity) {
    return null; // Nessuna soluzione valida
  }
  
  // Ricostruisci i giocatori scelti
  const chosenPlayers = [];
  let currentC = targetCount;
  let currentB = bestCost;
  
  while (currentC > 0 && chosen[currentC][currentB]) {
    const choice = chosen[currentC][currentB];
    chosenPlayers.unshift(choice.player);
    currentC = choice.prevC;
    currentB = choice.prevB;
  }
  
  return {
    chosen: chosenPlayers,
    totalCost: bestCost,
    totalScore: bestScore
  };
};

const solveRoleWithStarterConstraint = (players, targetCount, maxBudget, minStarterReq, starterBoost = 0) => {
  // Dividi i candidati in starters e nonStarters
  const starters = players.filter(p => p.starter);
  const nonStarters = players.filter(p => !p.starter);
  
  let bestSolution = null;
  let bestScore = -Infinity;
  
  // Itera sul numero di titolari da minStarterReq a min(targetCount, starters.length)
  const maxStarters = Math.min(targetCount, starters.length);
  
  for (let s = minStarterReq; s <= maxStarters; s++) {
    const nonStartersNeeded = targetCount - s;
    
    // Seleziona s titolari
    const starterSolution = solveKnapsackExact(starters, s, maxBudget, starterBoost);
    if (!starterSolution) continue;
    
    // Con il budget residuo, seleziona i non-titolari rimanenti
    const remainingBudget = maxBudget - starterSolution.totalCost;
    const nonStarterSolution = solveKnapsackExact(nonStarters, nonStartersNeeded, remainingBudget, starterBoost);
    
    if (nonStarterSolution) {
      const totalScore = starterSolution.totalScore + nonStarterSolution.totalScore;
      const totalCost = starterSolution.totalCost + nonStarterSolution.totalCost;
      
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestSolution = {
          chosen: [...starterSolution.chosen, ...nonStarterSolution.chosen],
          totalCost,
          totalScore,
          startersCount: s
        };
      }
    }
  }
  
  return bestSolution;
};

/**
 * Funzione principale per costruire la rosa ottimale con vincoli sui titolari
 * @param {Array} players - Array di giocatori disponibili
 * @param {Object} cfg - Configurazione per la costruzione
 * @returns {Object} BuildResult con la rosa ottimale
 */
const buildBestSquadWithStarterConstraint = (players, cfg) => {
  const {
    totalBudget,
    rolePercentages,
    roleCounts,
    minStarterPct = 50,
    starterBoost = 0
  } = cfg;
  
  // Validazione input
  if (!players || players.length === 0) {
    throw new Error('Array giocatori vuoto o non valido');
  }
  
  if (totalBudget <= 0) {
    throw new Error('Budget totale deve essere positivo');
  }
  
  // Calcola budget per reparto
  const roleBudgets = {};
  Object.keys(rolePercentages).forEach(role => {
    roleBudgets[role] = calculateRoleBudget(totalBudget, rolePercentages[role]);
  });
  
  // Distribuisci eventuale resto
  const finalRoleBudgets = distributeRemainingBudget(totalBudget, roleBudgets, rolePercentages);
  
  // Suddividi i giocatori per ruolo
  const playersByRole = {};
  Object.keys(roleCounts).forEach(role => {
    playersByRole[role] = players.filter(p => p.role === role);
  });
  
  // Risolvi per ogni ruolo
  const roleSolutions = {};
  let totalCost = 0;
  let totalScore = 0;
  
  for (const role of Object.keys(roleCounts)) {
    const targetCount = roleCounts[role];
    const maxBudget = finalRoleBudgets[role];
    const minStarterReq = Math.ceil(targetCount * minStarterPct / 100);
    
    log('debug', `🔍 Risolvendo ruolo ${role}: ${targetCount} giocatori, budget €${maxBudget}, titolari min: ${minStarterReq}`);
    
    // Verifica che ci siano abbastanza giocatori
    if (playersByRole[role].length < targetCount) {
      throw new Error(`Ruolo ${role}: insufficienti giocatori disponibili (${playersByRole[role].length}/${targetCount})`);
    }
    
    // Verifica che ci siano abbastanza titolari
    const startersCount = playersByRole[role].filter(p => p.starter).length;
    if (startersCount < minStarterReq) {
      throw new Error(`Ruolo ${role}: insufficienti titolari disponibili (${startersCount}/${minStarterReq})`);
    }
    
    // Risolvi il ruolo con vincoli sui titolari
    const solution = solveRoleWithStarterConstraint(
      playersByRole[role],
      targetCount,
      maxBudget,
      minStarterReq,
      starterBoost
    );
    
    if (!solution) {
      throw new Error(`Ruolo ${role}: impossibile soddisfare i vincoli con il budget disponibile (€${maxBudget})`);
    }
    
    roleSolutions[role] = solution;
    totalCost += solution.totalCost;
    totalScore += solution.totalScore;
    
    log('info', `✅ Ruolo ${role} completato: ${solution.chosen.length} giocatori, costo €${solution.totalCost}, punteggio ${solution.totalScore}, titolari ${solution.startersCount}`);
  }
  
  return {
    byRole: roleSolutions,
    totalCost,
    totalScore
  };
};

/**
 * Adatta i dati dei giocatori esistenti al formato richiesto dal nuovo algoritmo
 * @param {Array} availablePlayers - Giocatori disponibili nel formato attuale
 * @param {Array} myTeam - Giocatori già posseduti
 * @param {Object} formation - Formazione richiesta
 * @param {number} totalBudget - Budget totale
 * @returns {Object} Configurazione per il nuovo algoritmo
 */
const createBuildConfigFromCurrentData = (availablePlayers, myTeam, formation, totalBudget) => {
  // Calcola i ruoli rimanenti
  const current = { P: 0, D: 0, C: 0, A: 0 };
  myTeam.forEach(player => current[player.role]++);
  
  const remainingByRole = {};
  Object.keys(formation).forEach(role => {
    remainingByRole[role] = Math.max(0, formation[role].min - current[role]);
  });
  
  // Converti i giocatori disponibili al formato richiesto
  const convertedPlayers = availablePlayers.map(player => ({
    id: player.id,
    name: player.name,
    team: player.team,
    role: player.role,
    cost: calculatePlayerValue(player.budgetPercentage),
    rating: player.fmv * 20, // Converti FMV (0-10) in rating (0-100)
    starter: (player.titolarita || 0) >= 4 // Considera titolare se titolarità >= 4
  }));
  
  // Configurazione per il nuovo algoritmo
  const buildConfig = {
    totalBudget: totalBudget - myTeam.reduce((sum, p) => sum + (p.paidPrice || 0), 0),
    rolePercentages: Object.fromEntries(
      Object.keys(formation).map(role => [
        role, 
        formation[role].percentage
      ])
    ),
    roleCounts: remainingByRole,
    minStarterPct: 50, // 50% di titolari per reparto
    starterBoost: 5 // Bonus di 5 punti per i titolari
  };
  
  return { convertedPlayers, buildConfig };
};

// Componente per il badge della fascia
const FasciaBadge = ({ fascia, size = 'sm' }) => {
  const config = fasciaConfig[fascia] || fasciaConfig['Non Impostata'];
  const Icon = config.icon;
  
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };
  
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3 h-3', 
    md: 'w-4 h-4'
  };
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium shadow-sm border ${config.colors} ${sizeClasses[size]}`}>
      <Icon className={iconSizes[size]} />
      <span>{fascia}</span>
    </span>
  );
};

// Componente per il badge bicolore della squadra
const SquadraBadge = ({ squadra, size = 'sm' }) => {
  // Normalizza il nome della squadra per la ricerca
  const normalizedSquadra = squadra?.trim();
  
  // Cerca i colori con fallback per variazioni del nome
  let colors = squadraColors[normalizedSquadra];
  
  if (!colors) {
    // Fallback: cerca per nomi simili
    const squadraKeys = Object.keys(squadraColors);
    const similarSquadra = squadraKeys.find(key => 
      key.toLowerCase().includes(normalizedSquadra?.toLowerCase()) ||
      normalizedSquadra?.toLowerCase().includes(key.toLowerCase())
    );
    
    if (similarSquadra) {
      colors = squadraColors[similarSquadra];
      //console.log(`Squadra "${normalizedSquadra}" mappata a "${similarSquadra}"`);
    } else {
      colors = { colore1: 'bg-gray-400', colore2: 'bg-gray-500' };
      //console.warn(`Squadra "${normalizedSquadra}" non trovata, usando colori default`);
    }
  }
  
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1 text-sm'
  };
  
  // Debug: log per verificare i colori
  //console.log(`Squadra: "${normalizedSquadra}", Colori:`, colors);
  
  // Funzione per convertire le classi CSS in colori esatti
  const getColorValue = (cssClass) => {
    switch (cssClass) {
      case 'bg-black': return '#000000';
      case 'bg-white': return '#ffffff';
      case 'bg-red-600': return '#dc2626';
      case 'bg-red-800': return '#991b1b';
      case 'bg-blue-500': return '#3b82f6';
      case 'bg-blue-600': return '#2563eb';
      case 'bg-yellow-400': return '#facc15';
      case 'bg-purple-600': return '#9333ea';
      case 'bg-gray-500': return '#6b7280';
      case 'bg-sky-400': return '#38bdf8';
      case 'bg-green-500': return '#10b981';
      default: return '#9ca3af';
    }
  };
  
  const color1 = getColorValue(colors.colore1);
  const color2 = getColorValue(colors.colore2);
  
  return (
    <span 
      className={`inline-flex items-center justify-center rounded-full font-bold shadow-sm border border-gray-300 ${sizeClasses[size]}`}
      style={{
        background: `linear-gradient(to right, ${color1} 50%, ${color2} 50%)`,
        color: '#ffffff',
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
      }}
      title={`${normalizedSquadra} - ${colors.colore1} / ${colors.colore2}`}
    >
      {normalizedSquadra}
    </span>
  );
};

function FantacalcioAuction() {
  const [totalBudget, setTotalBudget] = useState(() => {
    const saved = localStorage.getItem('fantacalcio_budget');
    return saved ? parseInt(saved) : 500;
  });
  
  const [formation, setFormation] = useState(() => {
    const saved = localStorage.getItem('fantacalcio_formation');
    return saved ? JSON.parse(saved) : defaultFormation;
  });

  // Funzione wrapper per aggiornare la formazione
  const updateFormation = (newFormation) => {
    setFormation(newFormation);
  };
  
  const [availablePlayers, setAvailablePlayers] = useState(() => {
    const saved = localStorage.getItem('fantacalcio_availablePlayers');
    return saved ? JSON.parse(saved) : [];
  });
  const [myTeam, setMyTeam] = useState(() => {
    const saved = localStorage.getItem('fantacalcio_myTeam');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState(new Set());
  const [selectedFasce, setSelectedFasce] = useState(new Set());
  const [selectedSquadre, setSelectedSquadre] = useState(new Set());
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('');
  const [showUnavailable, setShowUnavailable] = useState(false);
  
  // API Configuration state
  const [showApiConfigModal, setShowApiConfigModal] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    isConfigured: false,
    isAvailable: false,
    lastCheck: null
  });
  const [useApiOptimization, setUseApiOptimization] = useState(true); // Sempre attivo per API

  const playerDetailsRef = useRef(null);
  const playersListRef = useRef(null);

  // Funzione per calcolare il valore suggerito del giocatore
  const calculatePlayerValue = (budgetPercentage) => {
    return Math.round((budgetPercentage * totalBudget) / 100);
  };

  // Carica i dati all'avvio
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Controlla se ci sono dati salvati nel localStorage
        const savedAvailablePlayers = localStorage.getItem('fantacalcio_availablePlayers');
        
        if (savedAvailablePlayers) {
          // Usa i dati salvati se disponibili
          const parsedPlayers = JSON.parse(savedAvailablePlayers);
          
          // Sincronizza i flag isOwned con myTeam attuale
          const playersWithUpdatedFlags = parsedPlayers.map(player => ({
            ...player,
            isOwned: myTeam.some(ownedPlayer => ownedPlayer.id === player.id)
          }));
          
          setAvailablePlayers(playersWithUpdatedFlags);
          
          // Determina la fonte dei dati
          const dataSource = parsedPlayers.length > 0 ? 
            `Dati caricati (${parsedPlayers.length} giocatori) - Dati salvati` :
            `Dati di esempio (${parsedPlayers.length} giocatori) - Dati salvati`;
          setDataSource(dataSource);
        } else {
          // Carica i dati dal JSON se non ci sono dati salvati
          const players = await loadPlayersFromJson();
          
          // Imposta i flag isOwned e isUnavailable sui giocatori
          const playersWithFlags = players.map(player => ({
            ...player,
            isOwned: myTeam.some(ownedPlayer => ownedPlayer.id === player.id),
            isUnavailable: player.isUnavailable || false
          }));
          
          setAvailablePlayers(playersWithFlags);
          
          // Determina la fonte dei dati
          const dataSource = `Dati caricati (${players.length} giocatori)`;
          setDataSource(dataSource);
        }
      } catch (error) {
        log('error', 'Errore nel caricamento:', error);
        const samplePlayers = await loadProductionPlayersData();
        
        // Imposta i flag anche sui dati di esempio
        const samplePlayersWithFlags = samplePlayers.map(player => ({
          ...player,
          isOwned: myTeam.some(ownedPlayer => ownedPlayer.id === player.id),
          isUnavailable: player.isUnavailable || false
        }));
        
        setAvailablePlayers(samplePlayersWithFlags);
        setDataSource('Dati di fallback (errore nel caricamento)');
      }
      setLoading(false);
    };
    
    loadData();
  }, [myTeam]); // Aggiungi myTeam come dipendenza

  // Salva il budget nel localStorage quando cambia
  useEffect(() => {
    localStorage.setItem('fantacalcio_budget', totalBudget.toString());
  }, [totalBudget]);

  // Salva la formazione nel localStorage quando cambia
  useEffect(() => {
    localStorage.setItem('fantacalcio_formation', JSON.stringify(formation));
  }, [formation]);

  // Salva la mia rosa nel localStorage quando cambia
  useEffect(() => {
    localStorage.setItem('fantacalcio_myTeam', JSON.stringify(myTeam));
  }, [myTeam]);

  // Salva availablePlayers nel localStorage quando cambia
  useEffect(() => {
    if (availablePlayers.length > 0) {
      localStorage.setItem('fantacalcio_availablePlayers', JSON.stringify(availablePlayers));
    }
  }, [availablePlayers]);

  // Aggiorna il flag isOwned sui giocatori disponibili quando myTeam cambia
  useEffect(() => {
    setAvailablePlayers(prev => prev.map(player => ({
      ...player,
      isOwned: myTeam.some(ownedPlayer => ownedPlayer.id === player.id)
    })));
  }, [myTeam]);

  // Check API status on component mount
  useEffect(() => {
    const checkApiStatus = async () => {
      const configured = isApiConfigured();
      setApiStatus(prev => ({ ...prev, isConfigured: configured }));
      
      if (configured) {
        try {
          const healthCheck = await fantaOptimizerApi.checkHealth();
          setApiStatus(prev => ({
            ...prev,
            isAvailable: healthCheck.success,
            lastCheck: new Date().toISOString()
          }));
        } catch (error) {
          log('warn', 'API health check failed:', error);
          setApiStatus(prev => ({
            ...prev,
            isAvailable: false,
            lastCheck: new Date().toISOString()
          }));
        }
      }
    };
    
    checkApiStatus();
  }, []);

  // API Configuration functions
  const handleApiConfigSave = async (config) => {
    try {
      // Save configuration
      const success = saveApiConfig(config);
      if (success) {
        // Recheck API status
        const healthCheck = await fantaOptimizerApi.checkHealth();
        setApiStatus(prev => ({
          ...prev,
          isConfigured: true,
          isAvailable: healthCheck.success,
          lastCheck: new Date().toISOString()
        }));
      }
    } catch (error) {
      log('error', 'Failed to save API configuration:', error);
    }
  };

  const toggleApiOptimization = () => {
    setUseApiOptimization(prev => !prev);
  };

  // Funzione per ricaricare i dati
  const reloadData = async () => {
    setLoading(true);
    try {
      // Controlla se ci sono dati salvati nel localStorage
      const savedAvailablePlayers = localStorage.getItem('fantacalcio_availablePlayers');
      
      if (savedAvailablePlayers) {
        // Usa i dati salvati se disponibili
        const parsedPlayers = JSON.parse(savedAvailablePlayers);
        
        // Sincronizza i flag isOwned con myTeam attuale
        const playersWithUpdatedFlags = parsedPlayers.map(player => ({
          ...player,
          isOwned: myTeam.some(ownedPlayer => ownedPlayer.id === player.id)
        }));
        
        setAvailablePlayers(playersWithUpdatedFlags);
        
        // Determina la fonte dei dati
        const dataSource = parsedPlayers.length > 0 ? 
          `Dati caricati (${parsedPlayers.length} giocatori) - Dati salvati` :
          `Dati di esempio (${parsedPlayers.length} giocatori) - Dati salvati`;
        setDataSource(dataSource);
      } else {
        // Carica i dati dal JSON se non ci sono dati salvati
        const players = await loadPlayersFromJson();
        
        // Imposta i flag isOwned e isUnavailable sui giocatori
        const playersWithFlags = players.map(player => ({
          ...player,
          isOwned: myTeam.some(ownedPlayer => ownedPlayer.id === player.id),
          isUnavailable: player.isUnavailable || false
        }));
        
        setAvailablePlayers(playersWithFlags);
        
        // Determina la fonte dei dati
        const dataSource = `Dati caricati (${players.length} giocatori)`;
        setDataSource(dataSource);
      }
    } catch (error) {
      log('error', 'Errore nel ricaricamento:', error);
      const samplePlayers = await loadProductionPlayersData();
      
      // Imposta i flag anche sui dati di esempio
      const samplePlayersWithFlags = samplePlayers.map(player => ({
        ...player,
        isOwned: myTeam.some(ownedPlayer => ownedPlayer.id === player.id),
        isUnavailable: player.isUnavailable || false
      }));
      
      setAvailablePlayers(samplePlayersWithFlags);
      setDataSource('Dati di fallback (errore nel caricamento)');
    }
    setLoading(false);
  };

  // Funzione per resettare tutto e ripartire da capo
  const resetAll = () => {
    if (window.confirm('Sei sicuro di voler resettare tutto? Questa azione cancellerà tutti i giocatori acquistati e le impostazioni.')) {
      // Reset della mia rosa
      setMyTeam([]);
      
      // Reset del budget e formazione
      setTotalBudget(500);
      updateFormation(defaultFormation);
      
      // Ricarica i dati disponibili
      reloadData();
      
      // Pulisce il localStorage
      localStorage.removeItem('fantacalcio_myTeam');
      localStorage.removeItem('fantacalcio_budget');
      localStorage.removeItem('fantacalcio_formation');
      localStorage.removeItem('fantacalcio_availablePlayers');
      
      // Reset dello stato corrente
      setCurrentPlayer(null);
      setBidAmount('');
      setSearchTerm('');
      setSelectedRoles(new Set());
      setSelectedFasce(new Set());
      setSelectedSquadre(new Set());
      setShowUnavailable(false);
      
      alert('Reset completato! L\'app è tornata alle impostazioni iniziali.');
    }
  };

  // Scroll automatico ai dettagli quando si seleziona un giocatore
  useEffect(() => {
    if (currentPlayer && playerDetailsRef.current) {
      playerDetailsRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [currentPlayer]);

  const scrollToPlayersList = () => {
    if (playersListRef.current) {
      playersListRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  // Calcola budget utilizzato e rimanente
  const usedBudget = useMemo(() => {
    if (!myTeam || myTeam.length === 0) return 0;
    return myTeam.reduce((sum, player) => sum + (player.paidPrice || 0), 0);
  }, [myTeam]);
  
  const remainingBudget = useMemo(() => totalBudget - usedBudget, [totalBudget, usedBudget]);

  // Calcola giocatori rimanenti per ruolo
  const remainingByRole = useMemo(() => {
    const current = { P: 0, D: 0, C: 0, A: 0 };
    myTeam.forEach(player => current[player.role]++);
    
    return {
      P: Math.max(0, formation.P.min - current.P),
      D: Math.max(0, formation.D.min - current.D), 
      C: Math.max(0, formation.C.min - current.C),
      A: Math.max(0, formation.A.min - current.A)
    };
  }, [myTeam, formation]);

  const totalRemainingPlayers = useMemo(() => Object.values(remainingByRole).reduce((a, b) => a + b, 0), [remainingByRole]);

  const calculateMaxBid = useMemo(() => {
    return (playerRole) => {
      if (totalRemainingPlayers === 0) return 0;
      
      const roleRemaining = remainingByRole[playerRole];
      if (roleRemaining === 0) return 1;
      
      const otherPlayersNeeded = totalRemainingPlayers - 1;
      const minimumForOthers = otherPlayersNeeded;
      
      return Math.max(1, remainingBudget - minimumForOthers);
    };
  }, [totalRemainingPlayers, remainingByRole, remainingBudget]);

  const handleRoleToggle = (role) => {
    const newSelectedRoles = new Set(selectedRoles);
    if (newSelectedRoles.has(role)) {
      newSelectedRoles.delete(role);
    } else {
      newSelectedRoles.add(role);
    }
    setSelectedRoles(newSelectedRoles);
  };

  const handleFasciaToggle = (fascia) => {
    const newSelectedFasce = new Set(selectedFasce);
    if (newSelectedFasce.has(fascia)) {
      newSelectedFasce.delete(fascia);
    } else {
      newSelectedFasce.add(fascia);
    }
    setSelectedFasce(newSelectedFasce);
  };

  const handleSquadraToggle = (squadra) => {
    const newSelectedSquadre = new Set(selectedSquadre);
    if (newSelectedSquadre.has(squadra)) {
      newSelectedSquadre.delete(squadra);
    } else {
      newSelectedSquadre.add(squadra);
    }
    setSelectedSquadre(newSelectedSquadre);
  };

  const filteredPlayers = useMemo(() => {
    // Evita ricalcoli se non ci sono cambiamenti significativi
    if (!availablePlayers || availablePlayers.length === 0) return [];
    
    return availablePlayers.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           player.team.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRoles.size === 0 || selectedRoles.has(player.role);
      const matchesFascia = selectedFasce.size === 0 || selectedFascia.has(player.fascia);
      const matchesSquadra = selectedSquadre.size === 0 || 
      Array.from(selectedSquadre).some(squadraNome => {
        // Se la squadra selezionata è un nome completo, cerca l'abbreviazione corrispondente
        const abbreviazione = Object.keys(squadraAbbreviazioni).find(abb => 
          squadraAbbreviazioni[abb] === squadraNome
        );
        // Confronta con l'abbreviazione del giocatore o con il nome completo
        return abbreviazione === player.team || squadraNome === player.team;
      });
      
      // Filtro per giocatori non disponibili
      const matchesAvailability = showUnavailable ? (player.isUnavailable || player.isOwned) : (!player.isUnavailable && !player.isOwned);
      
      return matchesSearch && matchesRole && matchesFascia && matchesSquadra && matchesAvailability;
    });
  }, [availablePlayers, searchTerm, selectedRoles, selectedFasce, selectedSquadre, showUnavailable]);

  const handlePlayerWon = () => {
    if (!currentPlayer || !bidAmount) return;
    
    const paidPrice = parseInt(bidAmount);
    const playerWithPrice = { ...currentPlayer, paidPrice };
    
    setMyTeam(prev => [...prev, playerWithPrice]);
    
    // Aggiorna il flag isOwned invece di rimuovere il giocatore
    setAvailablePlayers(prev => prev.map(p => 
      p.id === currentPlayer.id 
        ? { ...p, isOwned: true }
        : p
    ));
    
    setCurrentPlayer(null);
    setBidAmount('');
    
    // Scroll automatico alla barra di ricerca
    setTimeout(() => {
      scrollToPlayersList();
    }, 100);
  };

  const handlePlayerLost = () => {
    if (!currentPlayer) return;
    
    // Marca il giocatore come non disponibile invece di rimuoverlo
    setAvailablePlayers(prev => prev.map(p => 
      p.id === currentPlayer.id 
        ? { ...p, isUnavailable: true }
        : p
    ));
    setCurrentPlayer(null);
    setBidAmount('');
    
    // Scroll automatico alla barra di ricerca
    setTimeout(() => {
      scrollToPlayersList();
    }, 100);
  };

  const removeFromTeam = (playerId) => {
    const player = myTeam.find(p => p.id === playerId);
    if (player) {
      setMyTeam(prev => prev.filter(p => p.id !== playerId));
      
      // Aggiorna il flag isOwned ma mantieni isUnavailable se era già impostato
      setAvailablePlayers(prev => prev.map(p => 
        p.id === playerId 
          ? { ...p, isOwned: false }
          : p
      ));
    }
  };

  // Funzione per ripristinare un giocatore non disponibile
  const restorePlayer = (playerId) => {
    const player = availablePlayers.find(p => p.id === playerId);
    if (player) {
      // Rimuovi il flag di indisponibilità
      setAvailablePlayers(prev => prev.map(p => 
        p.id === playerId 
          ? { ...p, isUnavailable: false }
          : p
      ));
    }
  };

  // Funzione per resettare tutti i dati salvati nel localStorage
  const resetSavedData = async () => {
    if (window.confirm('Sei sicuro di voler resettare tutti i dati salvati? Questo ripristinerà tutti i giocatori come disponibili.')) {
      // Rimuovi i dati salvati dal localStorage
      localStorage.removeItem('fantacalcio_availablePlayers');
      
      // Ricarica i dati dal JSON originale
      const players = await loadPlayersFromJson();
      
      // Imposta i flag isOwned e isUnavailable sui giocatori
      const playersWithFlags = players.map(player => ({
        ...player,
        isOwned: myTeam.some(ownedPlayer => ownedPlayer.id === player.id),
        isUnavailable: false
      }));
      
      setAvailablePlayers(playersWithFlags);
      
      // Determina la fonte dei dati
      const dataSource = `Dati caricati (${players.length} giocatori) - Reset effettuato`;
      setDataSource(dataSource);
      
      // Reset dei filtri
      setSelectedRoles(new Set());
      setSelectedFasce(new Set());
      setSelectedSquadre(new Set());
      setSearchTerm('');
      setShowUnavailable(false);
    }
  };

  // Calcola rosa ideale dinamica rispettando i vincoli di budget per reparto
  const getIdealTeam = () => {
    const ideal = [];
    
    // Aggiungi i giocatori già posseduti
    const playersAlreadyOwned = myTeam.map(player => ({
      ...player,
      isOwned: true,
      displayPrice: player.paidPrice
    }));
    
    ideal.push(...playersAlreadyOwned);
    
    // Calcola il budget rimanente per ogni ruolo
    const budgetByRole = {};
    const spentByRole = {};
    
    // Inizializza i budget per ruolo
    Object.keys(formation).forEach(role => {
      const roleBudget = Math.round((formation[role].percentage * totalBudget) / 100);
      budgetByRole[role] = roleBudget;
      spentByRole[role] = 0;
    });
    
    // Sottrai quanto già speso per ruolo
    myTeam.forEach(player => {
      if (spentByRole[player.role] !== undefined) {
        spentByRole[player.role] += player.paidPrice || 0;
      }
    });
    
    // Calcola il budget disponibile per ogni ruolo
    const availableBudgetByRole = {};
    Object.keys(budgetByRole).forEach(role => {
      availableBudgetByRole[role] = Math.max(0, budgetByRole[role] - spentByRole[role]);
    });
    
    // Per ogni ruolo, seleziona i migliori giocatori rispettando il budget
    Object.keys(remainingByRole).forEach(role => {
      const needed = remainingByRole[role];
      const availableBudget = availableBudgetByRole[role];
      
      if (needed > 0) {
        // Filtra i giocatori disponibili per questo ruolo (titolarità minima 4)
        const rolePlayers = availablePlayers
          .filter(p => p.role === role)
          .filter(p => (p.titolarita || 0) >= 4)  // Solo giocatori con titolarità >= 4
          .sort((a, b) => {
            // Prima priorità: fascia (Top > Semi-Top > Terza > Quarta > Scomm. > Outsider)
            const fasciaPriority = {
              'Top': 6,
              'Semi-Top': 5,
              'Terza': 4,
              'Quarta': 3,
              'Scomm.': 2,
              'Outsider': 1,
              'Titolare "Scarso"': 0,
              'Non Impostata': 0
            };
            
            const priorityA = fasciaPriority[a.fascia] || 0;
            const priorityB = fasciaPriority[b.fascia] || 0;
            
            if (priorityA !== priorityB) {
              return priorityB - priorityA;
            }
            
            // Seconda priorità: FMV (più alto = migliore)
            if (a.fmv !== b.fmv) {
              return b.fmv - a.fmv;
            }
            
            // Terza priorità: percentuale budget (più alta = migliore)
            return b.budgetPercentage - a.budgetPercentage;
          });
        
        let selectedPlayers = [];
        let totalCost = 0;
        let budgetUtilization = 0; // Percentuale di budget utilizzato
        
        // Prima fase: seleziona i migliori giocatori rispettando STRICTAMENTE il budget (max 110% per ruolo)
        for (let i = 0; i < rolePlayers.length && selectedPlayers.length < needed; i++) {
          const player = rolePlayers[i];
          const playerCost = calculatePlayerValue(player.budgetPercentage);
          
          // Controlla se il giocatore rientra nel budget rimanente (max 110% del budget del ruolo)
          const maxAllowedCost = availableBudget * 1.1; // 110% del budget
          
          if (totalCost + playerCost <= maxAllowedCost) {
            // Il budgetWarning viene calcolato dopo aver completato la selezione per il ruolo
            // Per ora impostiamo false, verrà aggiornato alla fine
            
            selectedPlayers.push({
              ...player,
              isOwned: false,
              displayPrice: playerCost,
              selectionPhase: 'optimal',
              budgetWarning: false, // Verrà aggiornato alla fine
              priceWarning: false
            });
            
            // Debug: log per confrontare con le altre fasi
            log('debug', `🔍 Optimal - ${player.name}: budgetPercentage=${player.budgetPercentage}%, totalBudget=${totalBudget}, playerCost=${playerCost}`);
            totalCost += playerCost;
            budgetUtilization = (totalCost / availableBudget) * 100;
          } else {
            // Se questo giocatore sfora, non possiamo aggiungerne altri
            break;
          }
        }
        
        // Seconda fase: se abbiamo ancora bisogno di giocatori, cerca di completare la rosa
        // ma sempre rispettando STRICTAMENTE il limite del 110% per ruolo
        if (selectedPlayers.length < needed) {
          const remainingNeeded = needed - selectedPlayers.length;
          const maxAllowedCost = availableBudget * 1.1;
          
          // Cerca giocatori non ancora selezionati che rientrino nel limite del 110%
          const remainingPlayers = rolePlayers
            .filter(p => !selectedPlayers.some(sp => sp.id === p.id))
            .sort((a, b) => {
              const costA = calculatePlayerValue(a.budgetPercentage);
              const costB = calculatePlayerValue(b.budgetPercentage);
              return costA - costB; // Ordine crescente per costo
            })
            .filter(player => {
              const playerCost = calculatePlayerValue(player.budgetPercentage);
              return totalCost + playerCost <= maxAllowedCost;
            })
            .slice(0, remainingNeeded)
            .map(player => {
              const playerCost = calculatePlayerValue(player.budgetPercentage);
              
              // Debug: log per capire perché i prezzi sono bassi
              log('debug', `🔍 Completion - ${player.name}: budgetPercentage=${player.budgetPercentage}%, totalBudget=${totalBudget}, playerCost=${playerCost}`);
              
              return {
              ...player,
              isOwned: false,
                displayPrice: playerCost,
              selectionPhase: 'completion',
                budgetWarning: false, // Verrà aggiornato alla fine
                priceWarning: false
              };
            });
          
          selectedPlayers.push(...remainingPlayers);
        }
        
        // Se non riusciamo a completare con titolarità >= 4, allarga il filtro
        // MA sempre rispettando il limite del 110% del budget
        if (selectedPlayers.length < needed) {
          const remainingNeeded = needed - selectedPlayers.length;
          log('warn', `⚠️ Ruolo ${role}: titolarità >= 4 insufficiente, servono ancora ${remainingNeeded} giocatori`);
          
          // Allarga il filtro per includere giocatori con titolarità >= 4
          const fallbackPlayers = availablePlayers
            .filter(p => p.role === role)
            .filter(p => (p.titolarita || 0) >= 4) // Titolarità >= 4 come fallback
            .filter(p => !selectedPlayers.some(sp => sp.id === p.id))
            .sort((a, b) => {
              const costA = calculatePlayerValue(a.budgetPercentage);
              const costB = calculatePlayerValue(b.budgetPercentage);
              return costA - costB; // Ordine crescente per costo
            })
            .filter(player => {
              const playerCost = calculatePlayerValue(player.budgetPercentage);
              return totalCost + playerCost <= availableBudget * 1.1; // Rispetta sempre il 110%
            })
            .slice(0, remainingNeeded)
            .map(player => {
              const playerCost = calculatePlayerValue(player.budgetPercentage);
              
              // Debug: log per capire perché i prezzi sono bassi
              log('debug', `🔍 Fallback - ${player.name}: budgetPercentage=${player.budgetPercentage}%, totalBudget=${totalBudget}, playerCost=${playerCost}`);
              
              return {
              ...player,
              isOwned: false,
                displayPrice: playerCost,
              selectionPhase: 'fallback',
                budgetWarning: false, // Verrà aggiornato alla fine
                priceWarning: false,
                titolaritaWarning: player.titolarita < 4
              };
            });
          
          selectedPlayers.push(...fallbackPlayers);
          
          // Se ancora non abbiamo abbastanza giocatori, usa tutti quelli disponibili
          // MA sempre rispettando il limite del 110% del budget
          if (selectedPlayers.length < needed) {
            const finalNeeded = needed - selectedPlayers.length;
            log('warn', `⚠️ Ruolo ${role}: usando tutti i giocatori disponibili per completare (${finalNeeded} mancanti), rispettando il 110%`);
            
            const allRemainingPlayers = availablePlayers
              .filter(p => p.role === role)
              .filter(p => !selectedPlayers.some(sp => sp.id === p.id))
              .sort((a, b) => {
                const costA = calculatePlayerValue(a.budgetPercentage);
                const costB = calculatePlayerValue(b.budgetPercentage);
                return costA - costB;
              })
              .filter(player => {
                const playerCost = calculatePlayerValue(player.budgetPercentage);
                return totalCost + playerCost <= availableBudget * 1.1; // Rispetta sempre il 110%
              })
              .slice(0, finalNeeded)
                          .map(player => {
              const playerCost = calculatePlayerValue(player.budgetPercentage);
              
              // Debug: log per capire perché i prezzi sono bassi
              log('debug', `🔍 Emergency - ${player.name}: budgetPercentage=${player.budgetPercentage}%, totalBudget=${totalBudget}, playerCost=${playerCost}`);
              
              return {
                ...player,
                isOwned: false,
                displayPrice: playerCost,
                selectionPhase: 'emergency',
                budgetWarning: false, // Verrà aggiornato alla fine
                priceWarning: false,
                titolaritaWarning: true
              };
            });
            
            selectedPlayers.push(...allRemainingPlayers);
          }
        }
        
        // Calcola il budgetWarning per tutti i giocatori del ruolo
        // Il warning appare solo se il ruolo completo supera il 110% del budget
        const roleBudget = Math.round((formation[role].percentage * totalBudget) / 100);
        const roleTotalCost = selectedPlayers.reduce((sum, p) => sum + p.displayPrice, 0);
        const roleExceedsBudget = roleTotalCost > roleBudget * 1.1;
        
        // Aggiorna tutti i giocatori del ruolo con il budgetWarning corretto
        selectedPlayers.forEach(player => {
          player.budgetWarning = roleExceedsBudget;
        });
        
        ideal.push(...selectedPlayers);
      }
    });

    return ideal;
  };

  // Funzione avanzata per calcolo rosa ideale con budget per ruolo e gestione titolarità/fasce
  const getIdealTeamByRoleBudgets = (params) => {
    const {
      myTeam: teamParam = myTeam,
      availablePlayers: availableParam = availablePlayers,
      remainingByRole: remainingParam = remainingByRole,
      remainingBudget: budgetParam = totalBudget - myTeam.reduce((sum, p) => sum + (p.paidPrice || 0), 0),
      roleBudgetPercentages = Object.fromEntries(
        Object.keys(formation).map(role => [
          role, 
          (formation[role].percentage / 100)
        ])
      ),
      minPricePerPlayer = 1,
      calculatePlayerValue: calcValue = calculatePlayerValue,
      betaQuality = 1.0,
      gammaPrice = 1.0,
      minTitolarita = 4, // Titolarità minima per selezione ottimale
      fallbackTitolarita = 3, // Titolarità per fallback
      enableFasciaPriority = true, // Abilita priorità per fasce
    } = params;

    const ideal = [];

    // 1) Già in rosa (non consumano il remainingBudget: si assume sia già al netto)
    const owned = teamParam.map(p => ({
      ...p,
      isOwned: true,
      displayPrice: p.paidPrice ?? 0
    }));
    ideal.push(...owned);
    const spentOwned = owned.reduce((s, p) => s + p.displayPrice, 0);

    // 2) Setup budget per ruolo (cap rigido)
    const roles = Object.keys(formation);
    const roleCap = {};
    roles.forEach(r => {
      const pct = Math.max(0, roleBudgetPercentages[r] ?? 0);
      roleCap[r] = Math.floor(budgetParam * pct);
    });

    // 3) Contatori e pool per ruolo
    const need = { ...remainingParam };
    const perRoleSpent = {};
    const perRolePicked = {};
    roles.forEach(r => {
      perRoleSpent[r] = 0;
      perRolePicked[r] = 0;
    });

    let budgetLeft = Math.max(0, budgetParam);
    const totalSlots = roles.reduce((s, r) => s + (need[r] || 0), 0);

    const ownedIds = new Set(owned.map(p => String(p.id)));
    const poolByRole = {};

    // Configurazione priorità fasce
    const fasciaPriority = {
      'Top': 6,
      'Semi-Top': 5,
      'Terza': 4,
      'Quarta': 3,
      'Scomm.': 2,
      'Outsider': 1,
      'Titolare "Scarso"': 0,
      'Non Impostata': 0
    };

    // Funzione di scoring che considera fascia, titolarità, FMV e prezzo
    const calculatePlayerScore = (player, price) => {
      let score = 0;
      
      // Priorità fascia (se abilitata)
      if (enableFasciaPriority) {
        const fasciaScore = fasciaPriority[player.fascia] || 0;
        score += fasciaScore * 1000; // Peso alto per fascia
      }
      
      // Titolarità (più alta = migliore)
      const titolarita = player.titolarita || 0;
      score += titolarita * 100; // Peso medio per titolarità
      
      // FMV con tuning
      const fmvScore = Math.pow(Math.max(0, player.fmv || 0), betaQuality);
      score += fmvScore;
      
      // Prezzo con tuning (più basso = migliore)
      const priceScore = 1 / Math.pow(Math.max(minPricePerPlayer, price), gammaPrice);
      score += priceScore;
      
      return score;
    };

    // Prepara pool per ogni ruolo con ordinamento per score
    roles.forEach(role => {
      const rolePlayers = availableParam
        .filter(p => p.role === role && !ownedIds.has(String(p.id)))
        .map(player => {
          const proposedPrice = calcValue(player.budgetPercentage) || minPricePerPlayer;
          const score = calculatePlayerScore(player, proposedPrice);
          return { ...player, proposedPrice, score };
        })
        .sort((a, b) => b.score - a.score); // Ordine decrescente per score
      
      poolByRole[role] = rolePlayers;
    });

    // Helper: riserva il minimo per gli slot restanti nel ruolo
    const clampAffordableRole = (role, proposed) => {
      const remainingSlots = Math.max(0, (need[role] || 0) - (perRolePicked[role] || 0) - 1);
      const reserveRole = remainingSlots * minPricePerPlayer;
      
      // Calcola il budget massimo disponibile per questo ruolo (110% del cap)
      const maxRoleBudget = roleCap[role] * 1.1;
      const maxNowRole = Math.max(minPricePerPlayer, maxRoleBudget - perRoleSpent[role] - reserveRole);

      // anche rispetto al globale (per sicurezza)
      const totalRemainingSlots = Math.max(0,
        roles.reduce((s, r) => s + Math.max(0, (need[r] || 0) - (perRolePicked[r] || 0)), 0) - 1
      );
      const reserveGlobal = totalRemainingSlots * minPricePerPlayer;
      const maxNowGlobal = Math.max(minPricePerPlayer, budgetLeft - reserveGlobal);

      const maxNow = Math.min(maxNowRole, maxNowGlobal);
      return Math.max(minPricePerPlayer, Math.min(Math.floor(proposed), maxNow));
    };

    // 4) Selezione per ruolo con cap rigido e gestione titolarità
    roles.forEach(role => {
      const needRole = need[role] || 0;
      if (needRole <= 0) return;

      const pool = poolByRole[role];
      const pickedIds = new Set();
      let selectionPhase = 'optimal';

      // Ciclo sugli slot di quel ruolo
      for (let slot = 0; slot < needRole; slot++) {
        if (budgetLeft < minPricePerPlayer) break;             // finiti i crediti
        if (perRoleSpent[role] + minPricePerPlayer > roleCap[role]) break; // cap ruolo esaurito

        let bestIdx = -1;
        let bestScore = -Infinity;
        let bestPrice = 0;
        let bestTitolarita = 0;

        // Prima prova con titolarità ottimale
        for (let i = 0; i < pool.length; i++) {
          const cand = pool[i];
          const id = String(cand.id);
          if (pickedIds.has(id)) continue;

          // Verifica titolarità minima per la fase corrente
          const titolarita = cand.titolarita || 0;
          if (selectionPhase === 'optimal' && titolarita < minTitolarita) continue;
          if (selectionPhase === 'fallback' && titolarita < fallbackTitolarita) continue;

          const proposed = cand.proposedPrice || minPricePerPlayer;
          const priceNow = clampAffordableRole(role, proposed);

          // rispetta cap ruolo e globale?
          if (priceNow < minPricePerPlayer) continue;
          if (perRoleSpent[role] + priceNow > roleCap[role]) continue;
          if (priceNow > budgetLeft) continue;

          const sc = cand.score;
          if (sc > bestScore) {
            bestScore = sc;
            bestIdx = i;
            bestPrice = priceNow;
            bestTitolarita = titolarita;
          }
        }

        // Se non troviamo giocatori con titolarità ottimale, passa alla fase fallback
        if (bestIdx === -1 && selectionPhase === 'optimal') {
          selectionPhase = 'fallback';
          slot--; // Riprova questo slot con criteri più permissivi
          continue;
        }

        // Se ancora non troviamo, passa alla fase di emergenza
        if (bestIdx === -1 && selectionPhase === 'fallback') {
          selectionPhase = 'emergency';
          slot--; // Riprova questo slot senza filtri di titolarità
          continue;
        }

        if (bestIdx === -1) break; // nessuna pick ammissibile nel ruolo

        const chosen = pool[bestIdx];
        // Il budgetWarning viene calcolato dopo aver completato la selezione per il ruolo
        // Per ora impostiamo false, verrà aggiornato alla fine
        
        const decoratedPlayer = {
          ...chosen,
          isOwned: false,
          displayPrice: bestPrice,
          selectionPhase,
          titolaritaWarning: bestTitolarita < minTitolarita,
          budgetWarning: false, // Verrà aggiornato alla fine
          priceWarning: bestPrice > (chosen.proposedPrice || minPricePerPlayer) // Nuovo flag per prezzo alto
        };

        ideal.push(decoratedPlayer);

        pickedIds.add(String(chosen.id));
        perRolePicked[role] += 1;
        perRoleSpent[role] += bestPrice;
        budgetLeft -= bestPrice;
      }
    });

    const spentPlanned = ideal.filter(p => !p.isOwned).reduce((s, p) => s + p.displayPrice, 0);

    // Calcola il budgetWarning per tutti i giocatori per ruolo
    // Il warning appare solo se il ruolo completo supera il 110% del budget
    roles.forEach(role => {
      const roleBudget = Math.round((roleBudgetPercentages[role] * budgetParam) / 100);
      const rolePlayers = ideal.filter(p => !p.isOwned && p.role === role);
      const roleTotalCost = rolePlayers.reduce((sum, p) => sum + p.displayPrice, 0);
      const roleExceedsBudget = roleTotalCost > roleBudget * 1.1;
      
      // Aggiorna tutti i giocatori del ruolo con il budgetWarning corretto
      rolePlayers.forEach(player => {
        player.budgetWarning = roleExceedsBudget;
      });
    });

    const perRole = Object.fromEntries(
      roles.map(r => [r, {
        cap: roleCap[r],
        spent: perRoleSpent[r],
        picked: perRolePicked[r],
        needed: need[r] || 0
      }])
    );

    return {
      ideal,
      spentPlanned,
      spentOwned,
      remainingBudgetAfterPlan: budgetLeft,
      perRole
    };
  };

  // Stato per scegliere l'algoritmo di calcolo rosa ideale
  const [useAdvancedAlgorithm, setUseAdvancedAlgorithm] = useState(false);
  const [useOptimizedAlgorithm, setUseOptimizedAlgorithm] = useState(false);
  
  // Stato per mostrare/nascondere la configurazione avanzata
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  
  // Parametri configurabili per l'algoritmo avanzato
  const [advancedParams, setAdvancedParams] = useState({
    betaQuality: 1.2,
    gammaPrice: 1.5,
    minTitolarita: 4,
    fallbackTitolarita: 3,
    enableFasciaPriority: true
  });
  
  // Memoizza i parametri avanzati per evitare re-render continui
  const memoizedAdvancedParams = useMemo(() => advancedParams, [
    advancedParams.betaQuality,
    advancedParams.gammaPrice,
    advancedParams.minTitolarita,
    advancedParams.fallbackTitolarita,
    advancedParams.enableFasciaPriority
  ]);
  
  // Calcola rosa ideale con algoritmo selezionato
  const [idealTeam, setIdealTeam] = useState([]);
  
  useEffect(() => {
    const calculateIdealTeam = async () => {
      log('info', '🔄 Calcolo rosa ideale avviato');
      log('debug', '📊 Dati disponibili:', {
        availablePlayers: availablePlayers.length,
        formation,
        totalBudget,
        myTeam: myTeam.length,
        apiStatus
      });
      let result = [];
      
      // Usa SOLO l'API esterna per l'ottimizzazione
      if (apiStatus.isAvailable) {
        try {
          log('info', '🚀 Chiamata API con:', {
            availablePlayers: availablePlayers.length,
            formation,
            totalBudget,
            myTeam: myTeam.length,
            options: { minStarterPct: 50 }
          });
          
          const apiResult = await fantaOptimizerApi.optimizeTeam(
            availablePlayers,
            formation,
            totalBudget,
            myTeam,
            { minStarterPct: 50 }
          );
          
          log('info', '✅ Risultato API ricevuto:', apiResult);
          log('debug', '🔍 Struttura byRole:', Object.keys(apiResult.byRole));
          
          // Converti il risultato API nel formato locale
          result = [];
          const seenIds = new Set(); // Set per tracciare gli ID già visti
          
          Object.entries(apiResult.byRole).forEach(([role, roleSolution]) => {
            log('debug', `📋 Ruolo ${role}:`, roleSolution);
            if (roleSolution.chosen && Array.isArray(roleSolution.chosen)) {
              roleSolution.chosen.forEach(player => {
                log('debug', `👤 Giocatore ${role}:`, player);
                
                // Controlla se l'ID è già stato visto (duplicato)
                if (seenIds.has(player.id)) {
                  log('warn', `⚠️ Giocatore duplicato saltato: ${player.name} (ID: ${player.id})`);
                  return; // Salta questo giocatore
                }
                
                // Aggiungi l'ID al set dei visti
                seenIds.add(player.id);
                
                result.push({
                  ...player,
                  displayPrice: player.proposedPrice || player.fmv || 1,
                  isOwned: myTeam.some(p => String(p.id) === String(player.id)),
                  selectionPhase: 'api',
                  budgetWarning: false,
                  priceWarning: false,
                  titolaritaWarning: player.titolarita < 4
                });
              });
            } else {
              log('warn', `⚠️ Struttura inaspettata per ruolo ${role}:`, roleSolution);
            }
          });
          
          log('info', '🔄 Risultato convertito:', result.length, 'giocatori (duplicati rimossi)');
          log('debug', '📝 Dettagli risultato:', result);
        } catch (error) {
          log('error', '❌ Errore API ottimizzazione:', error.message);
          // Non usare fallback, lascia la rosa vuota
          result = [];
        }
      } else {
        // API non disponibile, non mostrare rosa ideale
        log('warn', '🔴 API non disponibile:', {
          isConfigured: apiStatus.isConfigured,
          isAvailable: apiStatus.isAvailable,
          lastCheck: apiStatus.lastCheck
        });
        result = [];
      }
      // } else if (useApiOptimization && apiStatus.isAvailable) {
      //   // Usa l'API esterna per l'ottimizzazione
      //   try {
      //     const apiResult = await fantaOptimizerApi.optimizeTeam(
      //       availablePlayers,
      //       formation,
      //       totalBudget,
      //       myTeam,
      //       { minStarterPct: 70 }
      //     );
      //     
      //     // Converti il risultato API nel formato locale
      //     result = [];
      //     Object.entries(apiResult.byRole).forEach(([role, roleSolution]) => {
      //       roleSolution.chosen.forEach(player => {
      //       result.push({
      //         ...player,
      //         displayPrice: player.proposedPrice || player.fmv || 1,
      //         isOwned: myTeam.some(p => String(p.id) === String(player.id)),
      //         selectionPhase: 'api',
      //         budgetWarning: false,
      //         priceWarning: false,
      //         titolaritaWarning: !player.starter
      //       });
      //     });
      //   });
      // } catch (error) {
      //   console.error('❌ Errore API ottimizzazione:', error.message);
      //   // Fallback all'algoritmo avanzato in caso di errore
      //   const fallbackResult = getIdealTeamByRoleBudgets({
      //     ...memoizedAdvancedParams,
      //     minPricePerPlayer: 1
      //   });
      //     result = fallbackResult.ideal;
      //   }

      
      log('info', '🎯 Prima di setIdealTeam:', result.length, 'giocatori');
      setIdealTeam(result);
      log('info', '🎯 Dopo setIdealTeam chiamato');
    };
    
    calculateIdealTeam();
  }, [myTeam, formation, totalBudget, availablePlayers, apiStatus.isAvailable]);
  
  // Calcola il costo totale della rosa ideale
  const idealCost = useMemo(() => {
    log('debug', '💰 Calcolo idealCost con idealTeam:', idealTeam.length, 'giocatori');
    return idealTeam.reduce((sum, p) => sum + p.displayPrice, 0);
  }, [idealTeam]);
  
  // Controlla se la rosa ideale supera il 110% del budget totale
  const maxTotalBudget = useMemo(() => totalBudget * 1.1, [totalBudget]);
  const isOverTotalBudget = useMemo(() => idealCost > maxTotalBudget, [idealCost, maxTotalBudget]);
  
  // Controlla se singoli ruoli superano il loro budget
  const roleBudgetWarnings = useMemo(() => {
    const warnings = {};
    Object.keys(formation).forEach(role => {
      const roleBudget = Math.round((formation[role].percentage * totalBudget) / 100);
      const roleSpent = myTeam
        .filter(p => p.role === role)
        .reduce((sum, p) => sum + (p.paidPrice || 0), 0);
      const roleIdeal = idealTeam
        .filter(p => p.role === role && !p.isOwned)
        .reduce((sum, p) => sum + p.displayPrice, 0);
      const roleTotal = roleSpent + roleIdeal;
      const isOverBudget = roleTotal > roleBudget;
      const isOver110Percent = roleTotal > roleBudget * 1.1;
      
      warnings[role] = {
        isOverBudget,
        isOver110Percent,
        overAmount: Math.max(0, roleTotal - roleBudget),
        over110Amount: Math.max(0, roleTotal - roleBudget * 1.1),
        utilization: (roleTotal / roleBudget) * 100,
        roleSpent,
        roleIdeal,
        roleTotal,
        roleBudget
      };
    });
    return warnings;
  }, [formation, totalBudget, myTeam, idealTeam]);

  // Log per debug del re-rendering
  log('debug', '🔄 Componente re-renderizzato con idealTeam:', idealTeam.length, 'giocatori');
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Caricamento dati giocatori...</p>
          <div className="text-xs text-gray-500 max-w-md">
            <p className="font-medium mb-2">💡 Per utilizzare i dati di produzione:</p>
            <ol className="text-left space-y-1">
              <li>1. Esegui: <code className="bg-gray-200 px-1 rounded">node generate-production-data.js</code></li>
              <li>2. I dati verranno salvati in <code className="bg-gray-200 px-1 rounded">production-players.json</code></li>
              <li>3. L'app caricherà automaticamente i nuovi dati</li>
            </ol>
            <p className="mt-2">Altrimenti utilizzerà i dati di esempio (20 giocatori)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 main-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6" data-section="asta">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Award className="text-yellow-500" />
              Asta
            </h1>
            <div className="text-right">
              <div className="text-sm text-gray-500 flex items-center gap-2">
                {dataSource}
                {/*
                <button
                  onClick={reloadData}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                  title="Ricarica dati"
                >
                  🔄
                </button>
                */}
                {/*
                <button
                  onClick={() => {
                    log('debug', '=== DEBUG SQUADRE ===');
                    log('debug', 'Squadre configurate:', Object.keys(squadraColors));
                    log('debug', 'Squadre nei dati:', [...new Set(availablePlayers.map(p => p.team))]);
                    log('debug', 'Primi 5 giocatori:', availablePlayers.slice(0, 5).map(p => ({ name: p.name, team: p.team })));
                  }}
                  className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors"
                  title="Debug squadre"
                >
                  🐛
                </button>
                */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={resetAll}
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                    title="Reset completo"
                  >
                    🗑️
                    CLR
                  </button>
                  <button
                    onClick={() => setShowApiConfigModal(true)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      apiStatus.isConfigured && apiStatus.isAvailable
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                    title="Configurazione API"
                  >
                    <Settings className="w-3 h-3 inline mr-1" />
                    API
                  </button>
                  {/*
                  <button
                    onClick={resetSavedData}
                    className="px-2 py-1 rounded text-xs bg-red-500 text-white hover:bg-red-600 transition-colors"
                    title="Resetta dati salvati"
                  >
                    <Trash2 className="w-3 h-3 inline mr-1" />
                    Reset
                  </button>
                  */}
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {availablePlayers.length} giocatori disponibili
              </div>
            </div>
          </div>
          
          {/* Configurazione Budget Collassabile */}
          <details className="group mb-4">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-blue-700">💰 Configura Budget</span>
                  <span className="text-xs text-blue-500">
                    Budget: €{totalBudget} | {Object.values(formation).reduce((sum, config) => sum + config.percentage, 0)}% allocato
                  </span>
                </div>
                <div className="text-blue-400 group-open:rotate-180 transition-transform">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </summary>
            
            <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                  <label className="block text-sm font-medium mb-2 text-blue-700">Budget Totale</label>
              <input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="500"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(formation).map(([role, config]) => (
                <div key={role}>
                      <label className="block text-xs font-medium mb-1 text-blue-700">{roleLabels[role]} %</label>
                  <input
                    type="number"
                    value={config.percentage}
                    onChange={(e) => updateFormation({
                      ...formation,
                      [role]: { ...formation[role], percentage: parseInt(e.target.value) || 0 }
                    })}
                        className="w-full p-1 border border-blue-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
            </div>
          </details>

          {/* Stato Budget */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-2xl font-bold text-blue-600">€{totalBudget}</div>
              <div className="text-sm text-blue-500">Budget Totale</div>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <div className="text-2xl font-bold text-red-600">€{usedBudget}</div>
              <div className="text-sm text-red-500">Speso</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-2xl font-bold text-green-600">€{remainingBudget}</div>
              <div className="text-sm text-green-500">Rimanente</div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="text-2xl font-bold text-purple-600">{totalRemainingPlayers}</div>
              <div className="text-sm text-purple-500">Da Comprare</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Pannello Giocatori Disponibili */}
          <div ref={playersListRef} className="lg:col-span-2 bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="text-blue-500" />
              Giocatori Disponibili ({filteredPlayers.length})
            </h2>
            
            {/* Filtri */}
            <div className="space-y-4 mb-4">
              {/* Casella di ricerca principale - più prominente */}
              <div className="mb-6">
                  <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                    <input
                      type="text"
                    placeholder="Digita il nome del giocatore o della squadra per iniziare la ricerca..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-16 py-4 text-lg border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-lg hover:shadow-xl"
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                      title="Cancella ricerca"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  </div>
                <div className="mt-2 text-sm text-gray-600">
                  💡 Suggerimento: Inizia a digitare per filtrare i {availablePlayers.length} giocatori disponibili
                </div>
              </div>
              
                                          {/* Filtro Ruoli - Pulsanti circolari */}
              <div className="mb-4">
                <div className="flex gap-3">
                  {Object.entries(roleLabels).map(([role, label]) => {
                    const isSelected = selectedRoles.has(role);
                    const roleColor = roleColors[role];
                    
                    return (
                      <button
                        key={role}
                        onClick={() => handleRoleToggle(role)}
                        className={`w-12 h-12 rounded-full border-2 transition-all duration-200 flex items-center justify-center font-bold text-sm shadow-sm hover:shadow-md ${
                          isSelected 
                            ? `${roleColor} border-gray-300 transform scale-110` 
                            : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                        }`}
                        title={`${label} - ${isSelected ? 'Rimuovi filtro' : 'Aggiungi filtro'}`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
                {selectedRoles.size > 0 && (
                  <button
                    onClick={() => setSelectedRoles(new Set())}
                    className="mt-2 px-3 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 transition-colors duration-200 flex items-center gap-1"
                    title="Cancella filtro ruoli"
                  >
                    <X className="w-3 h-3" />
                    <span>Reset Ruoli</span>
                  </button>
                )}
              </div>
              
              {/* Area Filtri Avanzati Collassabile */}
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">⚙️ Filtri Avanzati</span>
                      <span className="text-xs text-gray-500">
                        {selectedRoles.size > 0 || selectedFasce.size > 0 || selectedSquadre.size > 0 || showUnavailable
                          ? `(${selectedRoles.size + selectedFasce.size + selectedSquadre.size + (showUnavailable ? 1 : 0)} attivi)`
                          : '(nessuno attivo)'
                        }
                      </span>
                    </div>
                    <div className="text-gray-400 group-open:rotate-180 transition-transform">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </summary>
                
                <div className="mt-3 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {/* Filtro Squadre */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Filtra per Squadra {selectedSquadre.size > 0 && `(${selectedSquadre.size} selezionate)`}
                      </label>
                      {selectedSquadre.size > 0 && (
                        <button
                          onClick={() => setSelectedSquadre(new Set())}
                          className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 transition-colors duration-200 flex items-center gap-1"
                          title="Cancella filtro squadra"
                        >
                          <X className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            const squadra = e.target.value;
                            if (!selectedSquadre.has(squadra)) {
                              setSelectedSquadre(prev => new Set([...prev, squadra]));
                            }
                            e.target.value = ""; // Reset della select
                          }
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Seleziona squadra...</option>
                        {Object.keys(squadraColors).map(squadra => {
                          const colors = squadraColors[squadra];
                          const abbreviazione = Object.keys(squadraAbbreviazioni).find(abb => 
                            squadraAbbreviazioni[abb] === squadra
                          ) || squadra.substring(0, 3).toUpperCase();
                          return (
                            <option key={squadra} value={squadra}>
                              {squadra} ({abbreviazione})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    
                    {/* Squadre Selezionate */}
                    {selectedSquadre.size > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Array.from(selectedSquadre).map(squadra => {
                          const abbreviazione = Object.keys(squadraAbbreviazioni).find(abb => 
                            squadraAbbreviazioni[abb] === squadra
                          ) || squadra.substring(0, 3).toUpperCase();
                          return (
                            <div
                              key={squadra}
                              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300"
                            >
                              <SquadraBadge squadra={squadra} size="xs" />
                              <span>{squadra} ({abbreviazione})</span>
                              <button
                                onClick={() => setSelectedSquadre(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(squadra);
                                  return newSet;
                                })}
                                className="ml-1 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Rimuovi squadra"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
              </div>
              
              {/* Filtro Fasce */}
              <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                  Filtra per Fascia {selectedFasce.size > 0 && `(${selectedFasce.size} selezionate)`}
                </label>
                      {(searchTerm || selectedRoles.size > 0 || selectedFasce.size > 0 || selectedSquadre.size > 0 || showUnavailable) && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedRoles(new Set());
                            setSelectedFasce(new Set());
                            setSelectedSquadre(new Set());
                            setShowUnavailable(false);
                          }}
                          className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2 shadow-sm"
                          title="Cancella tutti i filtri"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Reset Completo</span>
                        </button>
                      )}
                    </div>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_FASCE.map(fascia => {
                    const config = fasciaConfig[fascia] || fasciaConfig['Non Impostata'];
                    const Icon = config.icon;
                    const isSelected = selectedFasce.has(fascia);
                    
                    return (
                      <button
                        key={fascia}
                        onClick={() => handleFasciaToggle(fascia)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 flex items-center gap-2 shadow-sm ${
                          isSelected 
                            ? `${config.colors} shadow-md transform scale-105`
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{fascia}</span>
                      </button>
                    );
                  })}
                  {selectedFasce.size > 0 && (
                    <button
                      onClick={() => setSelectedFasce(new Set())}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 transition-colors duration-200 flex items-center gap-2 shadow-sm"
                          title="Cancella filtri fasce"
                    >
                      <Trash2 className="w-4 h-4" />
                          <span>Cancella Filtri Fasce</span>
                    </button>
                  )}
                </div>
                
                {/* Filtro Giocatori Non Disponibili */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Mostra Giocatori Non Disponibili
                    </label>
                    <button
                      onClick={() => setShowUnavailable(prev => !prev)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        showUnavailable
                          ? 'bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                      }`}
                      title={showUnavailable ? "Nascondi giocatori non disponibili" : "Mostra giocatori non disponibili"}
                    >
                      {showUnavailable ? '🔒 Nascondi' : '👁️ Mostra'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Visualizza i giocatori che non sono più disponibili per l'asta
                  </div>
                </div>
              </div>
            </div>
          </details>
            </div>

            {/* Lista Giocatori */}
            <div className="space-y-2">
              {filteredPlayers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nessun giocatore trovato</p>
              ) : (
                filteredPlayers.map(player => (
                  <div 
                    key={player.id}
                    className={`relative flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-colors hover:shadow-md ${
                      currentPlayer?.id === player.id ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-300' : 
                      player.isUnavailable ? 'bg-red-50 border-red-200 opacity-75' : 
                      'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => setCurrentPlayer(player)}
                    title={player.isUnavailable ? "Giocatore non disponibile" : "Clicca per selezionare in asta"}
                  >
                    {/* Icona Titolarità - Posizionata in alto a destra */}
                    {player.notes && (
                      <div className="absolute top-2 right-2">
                        {player.notes.toLowerCase().includes('titolarissimo') ? (
                          <span className="text-red-500 text-lg" title="Titolarissimo">⭐</span>
                        ) : player.notes.toLowerCase().includes('titolare') ? (
                          <span className="text-orange-500 text-lg" title="Titolare">⭐</span>
                        ) : null}
                      </div>
                    )}
                    
                    <div>
                      {/* Prima riga: NOME GIOCATORE */}
                      <div className="font-medium text-sm mb-1 flex items-center gap-2">
                        {player.name}
                        {player.isUnavailable && (
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                            🔒 NON DISPONIBILE
                          </span>
                        )}
                      </div>
                      
                      {/* Seconda riga: Ruolo, Fascia, Squadra */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${roleColors[player.role]}`}>
                          {roleLabels[player.role]}
                        </span>
                        <FasciaBadge fascia={player.fascia} size="xs" />
                        <SquadraBadge squadra={player.team} size="xs" />
                        <span className="text-xs text-gray-500">FMV: {player.fmv.toFixed(1)}</span>
                      </div>
                      
                      {/* Terza riga: Titolarità */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">Titolarità:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((step) => (
                            <div
                              key={step}
                              className={`w-2 h-2 rounded-full ${
                                step <= (player.titolarita || 0)
                                  ? 'bg-green-500'
                                  : 'bg-gray-200'
                              }`}
                              title={`Titolarità: ${player.titolarita || 0}/5`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Quarta riga: Notes */}
                      {player.notes && (
                        <div className="text-xs text-gray-500 mb-1" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>{player.notes}</div>
                      )}
                      
                      {/* Quinta riga: Commento */}
                      {player.commento && (
                        <div className="text-xs text-blue-600 italic" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>💬 {player.commento}</div>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className={`text-sm font-bold ${
                        player.isUnavailable ? 'text-red-600' : 'text-green-600'
                      }`}>
                        €{calculatePlayerValue(player.budgetPercentage)}
                      </div>
                      <div className="text-xs text-gray-500">{player.budgetPercentage}% Budget</div>
                      
                      {/* Pulsante ripristino per giocatori non disponibili */}
                      {player.isUnavailable && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            restorePlayer(player.id);
                          }}
                          className="mt-2 px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
                          title="Ripristina giocatore disponibile"
                        >
                          🔄 Ripristina
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pannello Controllo Asta */}
          <div className="space-y-6">
            
            {/* Giocatore Corrente */}
            {currentPlayer && (
              <div ref={playerDetailsRef} className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="text-green-500" />
                  Giocatore in Asta
                </h3>
                
                <div className="mb-4 relative">
                  {/* Icona Titolarità - Posizionata in alto a destra */}
                  {currentPlayer.notes && (
                    <div className="absolute top-0 right-0">
                      {currentPlayer.notes.toLowerCase().includes('titolarissimo') ? (
                        <span className="text-red-500 text-xl" title="Titolarissimo">⭐</span>
                      ) : currentPlayer.notes.toLowerCase().includes('titolare') ? (
                        <span className="text-orange-500 text-xl" title="Titolare">⭐</span>
                      ) : null}
                    </div>
                  )}
                  
                  {/* Prima riga: NOME GIOCATORE */}
                  <div className="font-medium text-lg mb-2">
                    {currentPlayer.name}
                  </div>
                  
                  {/* Seconda riga: Ruolo, Fascia, Squadra */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${roleColors[currentPlayer.role]}`}>
                      {roleLabels[currentPlayer.role]}
                    </span>
                    <FasciaBadge fascia={currentPlayer.fascia} size="md" />
                    <SquadraBadge squadra={currentPlayer.team} size="md" />
                    <span className="text-sm text-gray-500">FMV: {currentPlayer.fmv.toFixed(1)}</span>
                  </div>
                  
                  {/* Terza riga: Titolarità */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500">Titolarità:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((step) => (
                        <div
                          key={step}
                          className={`w-3 h-3 rounded-full ${
                            step <= (currentPlayer.titolarita || 0)
                              ? 'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                          title={`Titolarità: ${currentPlayer.titolarita || 0}/5`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Quarta riga: Notes */}
                  {currentPlayer.notes && (
                    <div className="text-sm text-gray-600 mb-2 p-2 bg-gray-50 rounded border-l-4 border-blue-500">
                      {currentPlayer.notes}
                    </div>
                  )}
                  
                  {/* Quinta riga: Commento */}
                  {currentPlayer.commento && (
                    <div className="text-sm text-blue-600 italic mb-2 p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                      💬 {currentPlayer.commento}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4 text-center text-xs">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="font-bold">{currentPlayer.gol}</div>
                    <div className="text-gray-500">Gol</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="font-bold">{currentPlayer.assist}</div>
                    <div className="text-gray-500">Assist</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="font-bold">{currentPlayer.presenze}</div>
                    <div className="text-gray-500">Presenze</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="font-bold">{currentPlayer.price}</div>
                    <div className="text-gray-500">Prezzo</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-xl font-bold text-blue-600">€{calculatePlayerValue(currentPlayer.budgetPercentage)}</div>
                    <div className="text-xs text-blue-500">Valore Suggerito ({currentPlayer.budgetPercentage}%)</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-xl font-bold text-green-600">€{calculateMaxBid(currentPlayer.role)}</div>
                    <div className="text-xs text-green-500">Max Consigliato</div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Offerta</label>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Inserisci offerta..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handlePlayerWon}
                    disabled={!bidAmount}
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:opacity-50 text-sm"
                  >
                    Aggiudicato
                  </button>
                  <button
                    onClick={handlePlayerLost}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 text-sm"
                  >
                    Ad Altri
                  </button>
                </div>
              </div>
            )}

            {/* Rosa Ideale */}
            <div className="bg-white rounded-lg shadow-md p-4" data-section="rosa-ideale">
            <div className="flex flex-row justify-between items-center mb-4 gap-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Calculator className="text-purple-500" />
                Rosa Ideale ({myTeam.length}/{myTeam.length + totalRemainingPlayers})
              </h3>
              
              {/* Toggle per algoritmo avanzato */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">API:</span>
                <div className="flex gap-1">
                  <div className={`px-2 py-1 text-xs rounded-full ${
                    apiStatus.isAvailable 
                      ? 'bg-green-100 text-green-800 border border-green-300' 
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    {apiStatus.isAvailable ? '🟢' : '🔴'}
                  </div>
                </div>
              </div>
            </div>
              
              {/* Messaggio quando l'API non è disponibile */}
              {!apiStatus.isAvailable && (
                <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-700 mb-2">
                      ⚠️ Ottimizzatore Rosa Ideale non attivo!
                    </div>
                    <div className="text-sm text-red-600">
                      L'API esterna non è configurata o non risponde.
                      <br />
                      Configura l'API per utilizzare l'ottimizzazione automatica della rosa.
                    </div>
                    <button
                      onClick={() => setShowApiConfigModal(true)}
                      className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Settings className="w-4 h-4 inline mr-2" />
                      Configura API
                    </button>
                  </div>
                </div>
              )}
              
              {apiStatus.isAvailable && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">€{Math.ceil(idealCost)}</div>
                  <div className="text-sm text-purple-500">
                    Costo Totale Rosa Ideale
                    {myTeam.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        (€{usedBudget} già spesi + €{idealCost - usedBudget} stimati)
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
                    {Object.entries(formation).map(([role, config]) => {
                      const rolePlayers = myTeam.filter(p => p.role === role);
                      const roleSpent = rolePlayers.reduce((sum, p) => sum + (p.paidPrice || 0), 0);
                      const roleBudget = Math.round((config.percentage * totalBudget) / 100);
                      const roleIdeal = idealTeam
                        .filter(p => p.role === role && !p.isOwned)
                        .reduce((sum, p) => sum + p.displayPrice, 0);
                      const roleTotal = roleSpent + roleIdeal;
                      const isOverBudget = roleTotal > roleBudget;
                      const isOver110Percent = roleTotal > roleBudget * 1.1;
                      const isRoleFull = rolePlayers.length >= config.min;
                      
                      return (
                        <div key={role} className={`p-2 rounded-lg ${
                          isOver110Percent ? 'bg-red-50 border border-red-200' : 
                          isOverBudget ? 'bg-orange-50 border border-orange-200' :
                          isRoleFull ? 'bg-green-50 border border-green-200' :
                          'bg-gray-50'
                        }`}>
                          <div className={`font-bold ${
                            isOver110Percent ? 'text-red-700' : 
                            isOverBudget ? 'text-orange-700' :
                            isRoleFull ? 'text-green-700' :
                            'text-gray-700'
                          }`}>
                            {roleLabels[role]}
                          </div>
                          <div className={isRoleFull ? 'text-green-600 font-semibold' : ''}>
                            {rolePlayers.length}/{config.min}
                            {isRoleFull && ' ✓'}
                          </div>
                          <div className={isOver110Percent ? 'text-red-600 font-semibold' : isOverBudget ? 'text-orange-600 font-semibold' : 'text-gray-600'}>
                            €{roleSpent}/€{Math.ceil(roleIdeal)}/€{roleBudget}
                            {isOverBudget && (
                              <div className={`text-xs ${isOver110Percent ? 'text-red-500' : 'text-orange-500'}`}>
                                +€{Math.ceil(roleTotal - roleBudget)}
                              </div>
                            )}
                          </div>
                          {currentPlayer?.role === role && isRoleFull && (
                            <div className="text-xs text-red-500 mt-1">
                              Ruolo completo!
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
                        </div>
                  

                  
                {idealCost > totalBudget && (
                  <div className="text-xs text-red-500 mt-1">
                    ⚠️ Supera il budget totale di €{Math.ceil(idealCost - totalBudget)}
                    {isOverTotalBudget && (
                      <div className="font-bold text-red-600">
                        🚫 ROSA IDEALE NON VALIDA (supera 110% del budget)
                      </div>
                    )}
                  </div>
                )}
                  
                  {/* Avvisi per ruoli che sforano il budget */}
                  {Object.entries(roleBudgetWarnings).some(([role, warning]) => warning.isOverBudget) && (
                    <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-xs text-red-700 font-medium mb-1">
                        ⚠️ Ruoli che superano il budget:
                      </div>
                      <div className="text-xs text-red-600 space-y-1">
                        {Object.entries(roleBudgetWarnings)
                          .filter(([role, warning]) => warning.isOverBudget)
                          .map(([role, warning]) => (
                            <div key={role}>
                              • {roleLabels[role]}: {warning.utilization.toFixed(0)}% (sfora di €{Math.ceil(warning.overAmount)})
                              {warning.isOver110Percent && (
                                <span className="text-red-600 font-semibold ml-1">⚠️ Supera 110%</span>
                              )}
                              <div className="text-xs text-gray-500 ml-2">
                                Speso: €{warning.roleSpent} | Ideale: €{Math.ceil(warning.roleIdeal)} | Budget: €{warning.roleBudget} | Totale: €{Math.ceil(warning.roleTotal)}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

<div className="space-y-2 ">
                {log('debug', '🎯 Rendering idealTeam:', idealTeam.length, 'giocatori')}
                {idealTeam.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    <div className="text-lg font-bold mb-2">🔍 Debug Rosa Ideale</div>
                    <div className="text-sm">
                      <div>API Status: {JSON.stringify(apiStatus)}</div>
                      <div>idealTeam length: {idealTeam.length}</div>
                      <div>idealTeam data: {JSON.stringify(idealTeam.slice(0, 2))}</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-center text-green-600 py-2 font-bold border border-green-300 bg-green-50 rounded-lg mb-3">
                      ✅ Rosa Ideale con {idealTeam.length} giocatori
                    </div>
                    {idealTeam.map(player => (
                    <div 
                      key={player.id} 
                      className={`relative flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-colors hover:shadow-md ${
                        player.isOwned 
                          ? 'bg-green-50 border-green-200 ring-2 ring-green-300 hover:bg-green-100' 
                          : player.selectionPhase === 'optimized'
                          ? 'bg-green-50 border-green-200 ring-2 ring-green-300 hover:bg-green-100' 
                          : player.selectionPhase === 'emergency'
                          ? 'bg-red-50 border-red-200 ring-2 ring-red-300 hover:bg-red-100'
                          : player.selectionPhase === 'fallback'
                          ? 'bg-yellow-50 border-yellow-200 ring-2 ring-yellow-300 hover:bg-yellow-100'
                          : player.budgetWarning
                          ? 'bg-red-50 border-red-200 ring-2 ring-red-300 hover:bg-red-100' // Rosso per sforamento budget ruolo
                          : player.priceWarning
                          ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-300 hover:bg-orange-100' // Arancione per prezzo alto
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        if (!player.isOwned) {
                          setCurrentPlayer(player);
                        }
                      }}
                      title={player.isOwned ? "Giocatore già acquistato" : "Clicca per selezionare in asta"}
                    >
                      {/* Icona Titolarità - Posizionata in alto a destra */}
                      {player.notes && (
                        <div className="absolute top-2 right-2">
                          {player.notes.toLowerCase().includes('titolarissimo') ? (
                            <span className="text-red-500 text-lg" title="Titolarissimo">⭐</span>
                          ) : player.notes.toLowerCase().includes('titolare') ? (
                            <span className="text-orange-500 text-lg" title="Titolare">⭐</span>
                          ) : null}
                        </div>
                      )}
                      
                      <div>
                        <div className="font-medium text-sm mb-1 flex items-center gap-2">
                          {player.name}
                          {player.isOwned && (
                            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                              ACQUISTATO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-1 rounded-full ${roleColors[player.role]}`}>
                            {roleLabels[player.role]}
                          </span>
                          <FasciaBadge fascia={player.fascia} size="xs" />
                          <SquadraBadge squadra={player.team} size="xs" />
                          <span className="text-xs text-gray-500">FMV: {player.fmv.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">Titolarità:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((step) => (
                              <div
                                key={step}
                                className={`w-2 h-2 rounded-full ${
                                  step <= (player.titolarita || 0)
                                    ? 'bg-green-500'
                                    : 'bg-gray-200'
                                }`}
                                title={`Titolarità: ${player.titolarita || 0}/5`}
                              />
                            ))}
                          </div>
                        </div>
                        {player.notes && (
                          <div className="text-xs text-gray-500 mt-1" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>{player.notes}</div>
                        )}
                        {player.commento && (
                          <div className="text-xs text-blue-600 italic mt-1" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>💬 {player.commento}</div>
                        )}
                    </div>
                    <div className={`text-sm font-bold ${
                      player.isOwned ? 'text-green-600' : 'text-purple-600'
                    }`}>
                      €{player.displayPrice}
                      {!player.isOwned && (
                        <div className="text-xs text-gray-500 font-normal">
                          ({player.budgetPercentage}%)
                          {player.price > 0 && <div>Prezzo: €{player.price}</div>}
                          {player.budgetWarning && (
                            <div className="text-red-500 font-medium">🚨 Sfora 110% budget ruolo</div>
                          )}
                          {player.priceWarning && (
                            <div className="text-orange-500 font-medium">⚠️ Prezzo superiore al suggerito</div>
                          )}
                          {player.selectionPhase === 'completion' && (
                            <div className="text-orange-500 font-medium">🔄 Scelto per completare</div>
                          )}
                          {player.selectionPhase === 'fallback' && (
                            <div className="text-yellow-500 font-medium">⚠️ Titolarità 3 (fallback)</div>
                          )}
                          {player.selectionPhase === 'optimized' && (
                            <div className="text-green-500 font-medium">🎯 Selezionato da algoritmo ottimizzato</div>
                          )}
                          {player.selectionPhase === 'emergency' && (
                            <div className="text-red-500 font-medium">🚨 Titolarità bassa (emergenza)</div>
                          )}
                          {player.titolaritaWarning && (
                            <div className="text-orange-500 font-medium">⚠️ Titolarità inferiore a 4</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
                }
                </>
                )}
                {idealTeam.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    Rosa completa!
                  </div>
                )}
                
                {/* Messaggio quando la rosa non può essere completata per vincoli di budget */}
                {idealTeam.length > 0 && idealTeam.filter(p => !p.isOwned).length < totalRemainingPlayers && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-sm text-yellow-700 font-medium mb-1">
                      ⚠️ Rosa Ideale Incompleta
              </div>
                    <div className="text-xs text-yellow-600">
                      La rosa ideale non può essere completata rispettando i vincoli di budget del 110% per ruolo.
                      <br />
                      Giocatori suggeriti: {idealTeam.filter(p => !p.isOwned).length}/{totalRemainingPlayers}
                      <br />
                      Considera di utilizzare l'algoritmo avanzato o quello ottimizzato per una migliore ottimizzazione.
                    </div>
                  </div>
                )}
            </div>

                </div>


              </div>



            {/* La Mia Rosa */}
            <div className="bg-white rounded-lg shadow-md p-4 pb-30" data-section="mia-rosa">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Award className="text-yellow-500" />
                La Mia Rosa ({myTeam.length})
              </h3>
              
              {myTeam.length === 0 ? (
                <p className="text-gray-500 text-center">Nessun giocatore acquistato</p>
              ) : (
                <div className="space-y-2 ">
                  {myTeam.map(player => (
                    <div key={player.id} className="relative flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {/* Icona Titolarità - Posizionata in alto a destra */}
                      {player.notes && (
                        <div className="absolute top-2 right-2">
                          {player.notes.toLowerCase().includes('titolarissimo') ? (
                            <span className="text-red-500 text-lg" title="Titolarissimo">⭐</span>
                          ) : player.notes.toLowerCase().includes('titolare') ? (
                            <span className="text-orange-500 text-lg" title="Titolare">⭐</span>
                          ) : null}
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1 flex items-center gap-2">
                          {player.name}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-1 rounded-full ${roleColors[player.role]}`}>
                            {roleLabels[player.role]}
                          </span>
                          <FasciaBadge fascia={player.fascia} size="xs" />
                          <SquadraBadge squadra={player.team} size="xs" />
                          <span className="text-xs text-gray-500">FMV: {player.fmv.toFixed(1)}</span>
                          {player.price > 0 && <span className="text-xs text-gray-500">Prezzo: €{player.price}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">Titolarità:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((step) => (
                              <div
                                key={step}
                                className={`w-2 h-2 rounded-full ${
                                  step <= (player.titolarita || 0)
                                    ? 'bg-green-500'
                                    : 'bg-gray-200'
                                }`}
                                title={`Titolarità: ${player.titolarita || 0}/5`}
                              />
                            ))}
                          </div>
                        </div>
                        
                        {/* Quarta riga: Notes */}
                        {player.notes && (
                          <div className="text-xs text-gray-500 mt-1" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>{player.notes}</div>
                        )}
                        
                        {/* Quinta riga: Commento */}
                        {player.commento && (
                          <div className="text-xs text-blue-600 italic mt-1" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>💬 {player.commento}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-bold text-green-600">€{player.paidPrice}</div>
                        <button
                          onClick={() => removeFromTeam(player.id)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                          title="Rimuovi giocatore"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

        {/* Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-around items-center py-3">
              {/* Asta */}
              <button
                onClick={() => {
                  const headerElement = document.querySelector('[data-section="asta"]');
                  if (headerElement) {
                    headerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors group"
                title="Vai alla sezione Asta"
              >
                <Award className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
                <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">Asta</span>
              </button>

              {/* Giocatori Disponibili */}
              <button
                onClick={() => {
                  if (playersListRef.current) {
                    playersListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors group"
                title="Vai ai Giocatori Disponibili"
              >
                <Users className="w-5 h-5 text-green-600 group-hover:text-green-700" />
                <span className="text-xs font-medium text-gray-700 group-hover:text-green-700">Giocatori</span>
              </button>

              {/* Giocatore in Asta */}
              <button
                onClick={() => {
                  if (currentPlayer && playerDetailsRef.current) {
                    playerDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    // Se non c'è un giocatore selezionato, vai alla lista
                    if (playersListRef.current) {
                      playersListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }
                }}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors group ${
                  currentPlayer 
                    ? 'hover:bg-orange-50' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                title={currentPlayer ? "Vai al Giocatore in Asta" : "Nessun giocatore selezionato"}
                disabled={!currentPlayer}
              >
                <TrendingUp className={`w-5 h-5 ${
                  currentPlayer 
                    ? 'text-orange-600 group-hover:text-orange-700' 
                    : 'text-gray-400'
                }`} />
                <span className={`text-xs font-medium ${
                  currentPlayer 
                    ? 'text-gray-700 group-hover:text-orange-700' 
                    : 'text-gray-400'
                }`}>In Asta</span>
              </button>

              {/* Rosa Ideale */}
              <button
                onClick={() => {
                  const rosaIdealeElement = document.querySelector('[data-section="rosa-ideale"]');
                  if (rosaIdealeElement) {
                    rosaIdealeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors group"
                title="Vai alla Rosa Ideale"
              >
                <Calculator className="w-5 h-5 text-purple-600 group-hover:text-purple-700" />
                <span className="text-xs font-medium text-gray-700 group-hover:text-purple-700">Ideale</span>
              </button>

              {/* La Mia Rosa */}
              <button
                onClick={() => {
                  const miaRosaElement = document.querySelector('[data-section="mia-rosa"]');
                  if (miaRosaElement) {
                    miaRosaElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-yellow-50 transition-colors group"
                title="Vai alla Mia Rosa"
              >
                <Award className="w-5 h-5 text-yellow-600 group-hover:text-yellow-700" />
                <span className="text-xs font-medium text-gray-700 group-hover:text-yellow-700">Mia Rosa</span>
              </button>
            </div>
          </div>
        </div>

        {/* API Configuration Modal */}
        <ApiConfigModal
          isOpen={showApiConfigModal}
          onClose={() => setShowApiConfigModal(false)}
          onSave={handleApiConfigSave}
        />
      </div>
  );
}

export default FantacalcioAuction; 