
export type Role = 'P' | 'D' | 'C' | 'A';

export interface Player {
  id: string;
  name: string;
  team: string;
  role: Role;
  cost: number;    // crediti (intero >= 0)
  rating: number;  // 0..100
  starter: boolean;
}

export interface BuildConfig {
  totalBudget: number;
  rolePercentages: { P: number; D: number; C: number; A: number };
  roleCounts: { P: number; D: number; C: number; A: number };
  minStarterPct: number;
  starterBoost?: number;
  constraints?: {
    locks?: string[];        // player IDs da includere forzatamente
    excludes?: string[];     // player IDs da escludere
    preferIds?: string[];    // player IDs preferiti (bonus punteggio)
    preferTeams?: string[];  // nomi squadra preferiti (bonus punteggio)
    preferBonus?: number;    // bonus da sommare al rating dei preferiti
  };
}

export interface Acquired {
  id: string;      // player id
  price: number;   // prezzo di aggiudicazione (override del costo)
}

export interface RoleSolution {
  chosen: Player[];
  totalCost: number;
  totalScore: number;
  startersCount: number;
}

export interface BuildResult {
  byRole: { P: RoleSolution; D: RoleSolution; C: RoleSolution; A: RoleSolution };
  totalCost: number;
  totalScore: number;
  budgets: { P: number; D: number; C: number; A: number };          // budget finali per ruolo dopo redistribuzione
  initialBudgets: { P: number; D: number; C: number; A: number };   // budget iniziali da percentuali
}

// -----------------------
// Helpers
// -----------------------
function splitByRole(players: Player[]) {
  return {
    P: players.filter(p => p.role === 'P'),
    D: players.filter(p => p.role === 'D'),
    C: players.filter(p => p.role === 'C'),
    A: players.filter(p => p.role === 'A'),
  };
}

function roleBudgetsFromPercentages(total: number, perc: {P:number;D:number;C:number;A:number}) {
  const raw = {
    P: total * perc.P / 100,
    D: total * perc.D / 100,
    C: total * perc.C / 100,
    A: total * perc.A / 100,
  };
  const floored = {
    P: Math.floor(raw.P),
    D: Math.floor(raw.D),
    C: Math.floor(raw.C),
    A: Math.floor(raw.A),
  };
  const sum = floored.P + floored.D + floored.C + floored.A;
  let remainder = total - sum;

  const fracs = [
    { r: 'P' as Role, frac: raw.P - floored.P },
    { r: 'D' as Role, frac: raw.D - floored.D },
    { r: 'C' as Role, frac: raw.C - floored.C },
    { r: 'A' as Role, frac: raw.A - floored.A },
  ].sort((a,b) => b.frac - a.frac);

  const res: Record<Role, number> = { ...floored } as any;
  let idx = 0;
  while (remainder > 0) {
    const role = fracs[idx % fracs.length].r;
    res[role] += 1;
    remainder--;
    idx++;
  }
  return res;
}

function minStartersRequired(count: number, pct: number): number {
  return Math.ceil(count * pct / 100);
}

// -----------------------
// DP: chooseExactKForRole
// -----------------------
function chooseExactKForRole(
  pl: Player[],
  k: number,
  budget: number,
  starterBoost: number,
  extraBonus?: (p: Player) => number
): { chosenIdx: number[]; totalCost: number; totalScore: number } {
  // Validazione dei parametri
  if (k < 0 || k > pl.length) {
    throw new Error(`Parametri non validi: k=${k}, pl.length=${pl.length}`);
  }
  
  // Caso speciale: 0 giocatori da selezionare
  if (k === 0) {
    return { chosenIdx: [], totalCost: 0, totalScore: 0 };
  }
  
  // Caso speciale: 1 giocatore da selezionare
  if (k === 1) {
    // Trova il miglior giocatore singolo
    let best: Player | null = null;
    let bestScore = -Infinity;
    
    for (let i = 0; i < pl.length; i++) {
      const p = pl[i];
      if (p.cost <= budget) {
        const score = p.rating + (p.starter ? starterBoost : 0) + (extraBonus ? extraBonus(p) : 0);
        if (score > bestScore) {
          bestScore = score;
          best = p;
        }
      }
    }
    
    if (!best) {
      throw new Error(`Nessun giocatore disponibile con budget ${budget}`);
    }
    
    const bestIdx = pl.findIndex(p => p.id === best!.id);
    return { 
      chosenIdx: [bestIdx], 
      totalCost: best.cost, 
      totalScore: bestScore 
    };
  }

  // Per k > 1, usa direttamente l'algoritmo greedy migliorato
  return chooseExactKForRoleGreedy(pl, k, budget, starterBoost, extraBonus);
}

function chooseExactKForRoleGreedy(
  pl: Player[],
  k: number,
  budget: number,
  starterBoost: number,
  extraBonus?: (p: Player) => number
): { chosenIdx: number[]; totalCost: number; totalScore: number } {
  // Algoritmo che garantisce il rispetto dei vincoli di starter
  const playersWithScore = pl.map((p, idx) => ({
    index: idx,
    player: p,
    score: p.rating + (p.starter ? starterBoost : 0) + (extraBonus ? extraBonus(p) : 0),
    ratio: (p.rating + (p.starter ? starterBoost : 0) + (extraBonus ? extraBonus(p) : 0)) / p.cost
  }));
  
  // Separa titolari e non titolari
  const starters = playersWithScore.filter(p => p.player.starter);
  const nonStarters = playersWithScore.filter(p => !p.player.starter);
  
  // Ordina per score decrescente
  starters.sort((a, b) => b.score - a.score);
  nonStarters.sort((a, b) => b.score - a.score);
  
  let totalCost = 0;
  let totalScore = 0;
  const chosenIdx: number[] = [];
  const usedIndices = new Set<number>(); // Previene duplicati
  
  // Strategia: prima riempi con i migliori titolari disponibili
  // poi completa con non titolari se necessario
  
  // Seleziona i migliori titolari fino a riempire tutti i posti o esaurire il budget
  for (const item of starters) {
    if (chosenIdx.length >= k) break;
    
    if (usedIndices.has(item.index)) continue;
    
    if (totalCost + item.player.cost <= budget) {
      chosenIdx.push(item.index);
      usedIndices.add(item.index);
      totalCost += item.player.cost;
      totalScore += item.score;
    }
  }
  
  // Se non ha riempito tutti i posti, completa con non titolari
  for (const item of nonStarters) {
    if (chosenIdx.length >= k) break;
    
    if (usedIndices.has(item.index)) continue;
    
    if (totalCost + item.player.cost <= budget) {
      chosenIdx.push(item.index);
      usedIndices.add(item.index);
      totalCost += item.player.cost;
      totalScore += item.score;
    }
  }
  
  // Se ancora non ha riempito tutti i posti, cerca di ottimizzare
  if (chosenIdx.length < k) {
    // Prova a sostituire giocatori costosi con quelli più economici
    const remainingSlots = k - chosenIdx.length;
    const remainingBudget = budget - totalCost;
    
    // Cerca giocatori economici che possano riempire i posti rimanenti
    const allPlayers = [...starters, ...nonStarters].filter(p => !usedIndices.has(p.index));
    allPlayers.sort((a, b) => a.player.cost - b.player.cost); // Ordina per costo crescente
    
    for (const item of allPlayers) {
      if (chosenIdx.length >= k) break;
      
      if (item.player.cost <= remainingBudget) {
        chosenIdx.push(item.index);
        usedIndices.add(item.index);
        totalCost += item.player.cost;
        totalScore += item.score;
      }
    }
  }
  
  if (chosenIdx.length < k) {
    throw new Error(`Nessuna combinazione valida: k=${k}, budget=${budget}`);
  }
  
  return {
    chosenIdx,
    totalCost,
    totalScore
  };
}

// -----------------------
// Sottoproblema con vincolo starters (assoluto)
// -----------------------
function chooseWithStarterConstraintAbs(
  pl: Player[],
  count: number,
  budget: number,
  requiredStartersAbs: number,
  starterBoost: number,
  extraBonus?: (p: Player) => number
): { chosen: Player[]; totalCost: number; totalScore: number; startersCount: number } {
  const starters = pl.filter(p => p.starter);
  const nonStarters = pl.filter(p => !p.starter);

  let best: { chosen: Player[]; totalCost: number; totalScore: number; startersCount: number } | null = null;

  // Aggiusta il numero minimo di titolari se non ci sono abbastanza disponibili
  const actualRequiredStarters = Math.min(requiredStartersAbs, starters.length);
  
  // Prova prima con il numero richiesto, poi riduci gradualmente se necessario
  for (let s = actualRequiredStarters; s <= Math.min(count, starters.length); s++) {
    try {
      const a = chooseExactKForRole(starters, s, budget, starterBoost, extraBonus);
      const b = chooseExactKForRole(nonStarters, count - s, budget - a.totalCost, starterBoost, extraBonus);

      const idxs = [...a.chosenIdx.map(i => ({ i, arr: 'S' as const })), ...b.chosenIdx.map(i => ({ i, arr: 'N' as const }))];
      const chosen = idxs.map(x => x.arr === 'S' ? starters[x.i] : nonStarters[x.i]);
      const totalCost = a.totalCost + b.totalCost;
      const totalScore = a.totalScore + b.totalScore;
      const startersCount = s;

      if (!best || totalScore > best.totalScore) {
        best = { chosen, totalCost, totalScore, startersCount };
      }
    } catch (error) {
      // ignora combinazioni invalide
    }
  }
  
  // Se non è riuscito con il numero minimo richiesto, prova con meno titolari
  if (!best && actualRequiredStarters > 0) {
    console.warn(`⚠️ Impossibile soddisfare il requisito minimo di ${requiredStartersAbs} titolari per il ruolo. Provo con meno titolari...`);
    
    for (let s = 0; s < actualRequiredStarters; s++) {
      try {
        const a = chooseExactKForRole(starters, s, budget, starterBoost, extraBonus);
        const b = chooseExactKForRole(nonStarters, count - s, budget - a.totalCost, starterBoost, extraBonus);

        const idxs = [...a.chosenIdx.map(i => ({ i, arr: 'S' as const })), ...b.chosenIdx.map(i => ({ i, arr: 'N' as const }))];
        const chosen = idxs.map(x => x.arr === 'S' ? starters[x.i] : nonStarters[x.i]);
        const totalCost = a.totalCost + b.totalCost;
        const totalScore = a.totalScore + b.totalScore;
        const startersCount = s;

        if (!best || totalScore > best.totalScore) {
          best = { chosen, totalCost, totalScore, startersCount };
        }
      } catch (error) {
        // ignora combinazioni invalide
      }
    }
    
    if (best) {
      console.warn(`✅ Soluzione trovata con ${best.startersCount} titolari (invece di ${requiredStartersAbs} richiesti)`);
    }
  }
  
  // FALLBACK FINALE: se ancora non ha trovato nulla, usa l'algoritmo di emergenza
  if (!best) {
    console.warn(`🚨 Fallback di emergenza: seleziono i migliori giocatori disponibili ignorando i vincoli di titolarità`);
    best = chooseBestPlayersEmergency(pl, count, budget, starterBoost, extraBonus);
  }
  
  return best;
}

function chooseBestPlayersEmergency(
  pl: Player[],
  count: number,
  budget: number,
  starterBoost: number,
  extraBonus?: (p: Player) => number
): { chosen: Player[]; totalCost: number; totalScore: number; startersCount: number } {
  // Algoritmo di emergenza: seleziona i migliori giocatori disponibili
  const playersWithScore = pl.map((p, idx) => ({
    index: idx,
    player: p,
    score: p.rating + (p.starter ? starterBoost : 0) + (extraBonus ? extraBonus(p) : 0)
  }));
  
  // Ordina per score decrescente
  playersWithScore.sort((a, b) => b.score - a.score);
  
  let totalCost = 0;
  let totalScore = 0;
  const chosenIdx: number[] = [];
  const usedIndices = new Set<number>();
  let startersCount = 0;
  
  // FASE 1: Seleziona i migliori giocatori disponibili entro il budget
  for (const item of playersWithScore) {
    if (chosenIdx.length >= count) break;
    
    if (usedIndices.has(item.index)) continue;
    
    if (totalCost + item.player.cost <= budget) {
      chosenIdx.push(item.index);
      usedIndices.add(item.index);
      totalCost += item.player.cost;
      totalScore += item.score;
      if (item.player.starter) startersCount++;
    }
  }
  
  // FASE 2: Se non ha riempito tutti i posti, cerca giocatori più economici
  if (chosenIdx.length < count) {
    const remainingSlots = count - chosenIdx.length;
    const remainingBudget = budget - totalCost;
    
    // Cerca giocatori economici per riempire i posti rimanenti
    const allPlayers = playersWithScore.filter(p => !usedIndices.has(p.index));
    allPlayers.sort((a, b) => a.player.cost - b.player.cost); // Ordina per costo crescente
    
    for (const item of allPlayers) {
      if (chosenIdx.length >= count) break;
      
      if (item.player.cost <= remainingBudget) {
        chosenIdx.push(item.index);
        usedIndices.add(item.index);
        totalCost += item.player.cost;
        totalScore += item.score;
        if (item.player.starter) startersCount++;
      }
    }
  }
  
  // FASE 3: Se ancora non ha riempito tutti i posti, usa i giocatori più economici disponibili
  if (chosenIdx.length < count) {
    console.warn(`⚠️ Fallback di emergenza: non riesco a riempire tutti i ${count} posti richiesti. Posti riempiti: ${chosenIdx.length}`);
    
    const allPlayers = playersWithScore.filter(p => !usedIndices.has(p.index));
    allPlayers.sort((a, b) => a.player.cost - b.player.cost); // Ordina per costo crescente
    
    for (const item of allPlayers) {
      if (chosenIdx.length >= count) break;
      
      // In emergenza, accetta anche giocatori che superano il budget
      chosenIdx.push(item.index);
      usedIndices.add(item.index);
      totalCost += item.player.cost;
      totalScore += item.score;
      if (item.player.starter) startersCount++;
    }
  }
  
  const chosen = chosenIdx.map(idx => pl[idx]);
  
  console.log(`🚨 Fallback completato: ${chosen.length}/${count} posti riempiti, costo: ${totalCost}, score: ${totalScore}`);
  
  return {
    chosen,
    totalCost,
    totalScore,
    startersCount
  };
}

// -----------------------
// Redistribuzione proporzionale del budget di reparti completati
// -----------------------
function redistributeBudgets(
  initialBudgets: Record<Role, number>,
  remainingCounts: Record<Role, number>,
  remainingBudgets: Record<Role, number>
): Record<Role, number> {
  let totalDelta = 0;
  (['P','D','C','A'] as Role[]).forEach(r => {
    if (remainingCounts[r] === 0) {
      totalDelta += remainingBudgets[r];   // avanzo (+) o sforamento (-)
      remainingBudgets[r] = 0;            // quel reparto è chiuso
    }
  });

  const activeRoles = (['P','D','C','A'] as Role[]).filter(r => remainingCounts[r] > 0);
  const weightSum = activeRoles.reduce((acc, r) => acc + initialBudgets[r], 0);

  if (activeRoles.length === 0) return remainingBudgets;
  if (weightSum === 0) {
    const share = totalDelta / activeRoles.length;
    activeRoles.forEach(r => remainingBudgets[r] += share);
    return remainingBudgets;
  }
  activeRoles.forEach(r => {
    const w = initialBudgets[r] / weightSum;
    remainingBudgets[r] += totalDelta * w;
  });
  return remainingBudgets;
}

// -----------------------
// Funzione principale con acquired + constraints
// -----------------------
export interface OptimizeOptions {
  // Placeholder per future estensioni (es. strategia di redistribuzione)
}

export function buildBestSquadWithStarterConstraint(
  players: Player[],
  cfg: BuildConfig,
  acquired: { id: string; price: number }[] = [],
  _opts?: OptimizeOptions
): BuildResult {
  const { totalBudget, rolePercentages, roleCounts, minStarterPct, starterBoost = 0, constraints } = cfg;

  const excludes = new Set(constraints?.excludes ?? []);
  const locksSet = new Set(constraints?.locks ?? []);
  const preferIds = new Set(constraints?.preferIds ?? []);
  const preferTeams = new Set((constraints?.preferTeams ?? []).map(s => s.toLowerCase()));
  const preferBonus = constraints?.preferBonus ?? 0;

  // Indicizzazione
  const byId = new Map<string, Player>();
  for (const p of players) byId.set(p.id, { ...p });

  // Acquired come locks con prezzo d'asta
  const acquiredLocked: Player[] = [];
  for (const a of acquired) {
    const p = byId.get(a.id);
    if (!p) throw new Error(`Acquired player id non trovato: ${a.id}`);
    acquiredLocked.push({ ...p, cost: a.price });
  }
  const acquiredIds = new Set(acquiredLocked.map(p => p.id));

  // Pool: applica exclude ma reintroduci eventuali acquired esclusi per priorità
  let pool = players.filter(p => !excludes.has(p.id));
  pool = [...pool.filter(p => !acquiredIds.has(p.id)), ...acquiredLocked];

  // Validazione intelligente dei parametri (dopo il filtraggio)
  const byRole = splitByRole(pool);
  const roleWarnings: string[] = [];
  
  (['P','D','C','A'] as Role[]).forEach(r => {
    const rolePlayers = byRole[r];
    const starters = rolePlayers.filter(p => p.starter);
    const required = roleCounts[r];
    const minStarters = minStartersRequired(required, minStarterPct);
    
    if (starters.length < minStarters) {
      roleWarnings.push(`Ruolo ${r}: richiesti ${minStarters} titolari ma disponibili solo ${starters.length}`);
    }
    
    if (rolePlayers.length < required) {
      roleWarnings.push(`Ruolo ${r}: richiesti ${required} giocatori ma disponibili solo ${rolePlayers.length}`);
    }
  });
  
  if (roleWarnings.length > 0) {
    console.warn('⚠️ Avvertimenti sui parametri:', roleWarnings.join('; '));
  }

  // Altri locks
  const lockedFromConstraints: Player[] = [];
  for (const id of Array.from(locksSet)) {
    if (acquiredIds.has(id)) continue;
    const p = byId.get(id);
    if (!p) throw new Error(`Lock non trovato nel pool giocatori: ${id}`);
    lockedFromConstraints.push(p);
  }

  const initialBudgets = roleBudgetsFromPercentages(totalBudget, rolePercentages);

  const allLocks = [...acquiredLocked, ...lockedFromConstraints];
  const locksByRole = {
    P: allLocks.filter(p => p.role === 'P'),
    D: allLocks.filter(p => p.role === 'D'),
    C: allLocks.filter(p => p.role === 'C'),
    A: allLocks.filter(p => p.role === 'A'),
  };

  const bonusFn = (p: Player) => {
    let b = 0;
    if (preferIds.has(p.id)) b += preferBonus;
    if (preferTeams.has(p.team.toLowerCase())) b += preferBonus;
    return b;
  };

  const remainingCounts: Record<Role, number> = { P:0,D:0,C:0,A:0 };
  const remainingBudgets: Record<Role, number> = { P:0,D:0,C:0,A:0 };
  const lockedCostByRole: Record<Role, number> = { P:0,D:0,C:0,A:0 };
  const lockedStartersByRole: Record<Role, number> = { P:0,D:0,C:0,A:0 };

  (['P','D','C','A'] as Role[]).forEach(r => {
    const req = roleCounts[r];
    const locksR = (locksByRole as any)[r] as Player[];
    if (locksR.length > req) throw new Error(`Troppi locks nel ruolo ${r}: locks=${locksR.length} > richiesti=${req}`);
    const costLocks = locksR.reduce((acc, p) => acc + p.cost, 0);
    const startersLocks = locksR.filter(p => p.starter).length;
    lockedCostByRole[r] = costLocks;
    lockedStartersByRole[r] = startersLocks;
    remainingCounts[r] = req - locksR.length;
    remainingBudgets[r] = initialBudgets[r] - costLocks;
  });

  // Redistribuzione per reparti completi
  const adjustedBudgets = redistributeBudgets(initialBudgets, remainingCounts, { ...remainingBudgets });

  const resultPerRole: any = {};
  let totalCost = 0;
  let totalScore = 0;

  for (const r of (['P','D','C','A'] as Role[])) {
    const req = roleCounts[r];
    const locksR = (locksByRole as any)[r] as Player[];
    const lockedCost = lockedCostByRole[r];
    const lockedStarters = lockedStartersByRole[r];

    let roleSol: RoleSolution = {
      chosen: [...locksR],
      totalCost: lockedCost,
      totalScore: locksR.reduce((acc, p) => acc + p.rating + (p.starter ? starterBoost : 0) + bonusFn(p), 0),
      startersCount: lockedStarters,
    };

    const remaining = remainingCounts[r];
    if (remaining > 0) {
      const minStartersAbs = minStartersRequired(req, minStarterPct);
      const requiredStartersRemaining = Math.max(0, minStartersAbs - lockedStarters);

      const lockedIdsR = new Set(locksR.map(p => p.id));
      const candidates = (byRole as any)[r].filter((p: Player) => !lockedIdsR.has(p.id));

      const addSol = chooseWithStarterConstraintAbs(
        candidates, remaining, adjustedBudgets[r], requiredStartersRemaining, starterBoost, bonusFn
      );
      roleSol = {
        chosen: [...locksR, ...addSol.chosen],
        totalCost: lockedCost + addSol.totalCost,
        totalScore: roleSol.totalScore + addSol.totalScore,
        startersCount: lockedStarters + addSol.startersCount,
      };
    }

    resultPerRole[r] = roleSol;
    totalCost += roleSol.totalCost;
    totalScore += roleSol.totalScore;
  }

  // Validazione finale del budget
  // Calcola la tolleranza del 10% per il budget
  const budgetTolerance = totalBudget * 0.10;
  const maxAllowedBudget = totalBudget + budgetTolerance;
  
  if (totalCost > maxAllowedBudget) {
    console.warn(`⚠️ Budget sforato di ${totalCost - totalBudget} crediti (${((totalCost - totalBudget) / totalBudget * 100).toFixed(1)}% oltre il limite)`);
    
    // Se lo sforamento è maggiore del 10%, fallisce
    throw new Error(`Budget totale sforato: ${totalCost} > ${maxAllowedBudget} (tolleranza 10%: ${totalBudget} + ${budgetTolerance})`);
  } else if (totalCost > totalBudget) {
    console.warn(`⚠️ Budget sforato di ${totalCost - totalBudget} crediti (${((totalCost - totalBudget) / totalBudget * 100).toFixed(1)}% oltre il limite, ma entro la tolleranza del 10%)`);
  }

  // Ordina i giocatori per ruolo e costo
  const roleOrder = ['P', 'D', 'C', 'A'] as Role[];
  for (const r of roleOrder) {
    if (resultPerRole[r]) {
      resultPerRole[r].chosen.sort((a: Player, b: Player) => b.cost - a.cost);
    }
  }

  // Calcola il budget rimanente per ogni ruolo
  const budgets: Record<Role, number> = {} as Record<Role, number>;
  let remainingBudget = totalBudget - totalCost;
  
  // Prima distribuisce il budget base proporzionalmente
  for (const r of roleOrder) {
    const required = roleCounts[r];
    const locked = locksByRole[r].length || 0;
    const remainingToFind = required - locked;
    
    if (remainingToFind > 0) {
      // Calcola il budget proporzionale per questo ruolo
      const roleBudget = Math.floor((totalBudget * rolePercentages[r]) / 100);
      budgets[r] = roleBudget;
    } else {
      // Ruolo già completo, assegna 0 budget
      budgets[r] = 0;
    }
  }
  
  // Ora ridistribuisce il budget risparmiato dai ruoli completi
  const totalAssignedBudget = Object.values(budgets).reduce((sum, b) => sum + b, 0);
  const savedBudget = totalBudget - totalAssignedBudget;
  
  if (savedBudget > 0) {
    // Trova i ruoli che hanno ancora bisogno di giocatori
    const rolesWithNeed = roleOrder.filter(r => {
      const required = roleCounts[r];
      const locked = locksByRole[r].length || 0;
      return (required - locked) > 0;
    });
    
    if (rolesWithNeed.length > 0) {
      // Ridistribuisce il budget risparmiato proporzionalmente
      const extraPerRole = Math.floor(savedBudget / rolesWithNeed.length);
      const remainder = savedBudget % rolesWithNeed.length;
      
      for (let i = 0; i < rolesWithNeed.length; i++) {
        const r = rolesWithNeed[i];
        const extraBudget = extraPerRole + (i < remainder ? 1 : 0);
        budgets[r] += extraBudget;
      }
    }
  }
  
  // Log per debug
  console.log('💰 Distribuzione budget:', {
    totalBudget,
    totalCost, // Changed from totalAcquiredCost to totalCost
    savedBudget,
    budgets: Object.fromEntries(roleOrder.map(r => [r, budgets[r]]))
  });

  return {
    byRole: resultPerRole as any,
    totalCost,
    totalScore,
    budgets: budgets,
    initialBudgets,
  };
}
