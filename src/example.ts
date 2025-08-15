
import { buildBestSquadWithStarterConstraint, Player, BuildConfig } from './index';

const players: Player[] = [
  { id: 'p1', name: 'Portiere A', team: 'AAA', role: 'P', cost: 20, rating: 80, starter: true },
  { id: 'p2', name: 'Portiere B', team: 'BBB', role: 'P', cost: 15, rating: 75, starter: true },
  { id: 'p3', name: 'Portiere C', team: 'CCC', role: 'P', cost: 10, rating: 70, starter: false },
  { id: 'd1', name: 'Dif 1', team: 'Inter', role: 'D', cost: 12, rating: 76, starter: true },
  { id: 'd2', name: 'Dif 2', team: 'AAA', role: 'D', cost: 15, rating: 78, starter: true },
  { id: 'd3', name: 'Dif 3', team: 'BBB', role: 'D', cost: 18, rating: 79, starter: true },
  { id: 'd4', name: 'Dif 4', team: 'CCC', role: 'D', cost: 14, rating: 77, starter: true },
  { id: 'd5', name: 'Dif 5', team: 'DDD', role: 'D', cost: 16, rating: 78, starter: true },
  { id: 'd6', name: 'Dif 6', team: 'EEE', role: 'D', cost: 13, rating: 76, starter: true },
  { id: 'd7', name: 'Dif 7', team: 'FFF', role: 'D', cost: 17, rating: 77, starter: false },
  { id: 'd8', name: 'Dif 8', team: 'GGG', role: 'D', cost: 19, rating: 78, starter: false },
  { id: 'd9', name: 'Dif 9', team: 'HHH', role: 'D', cost: 20, rating: 77, starter: false },
  { id: 'd10', name: 'Dif 10', team: 'III', role: 'D', cost: 18, rating: 76, starter: false },
  { id: 'd11', name: 'Dif 11', team: 'JJJ', role: 'D', cost: 21, rating: 77, starter: false },
  { id: 'd12', name: 'Dif 12', team: 'KKK', role: 'D', cost: 22, rating: 78, starter: false },
  { id: 'c1', name: 'Cent 1', team: 'AAA', role: 'C', cost: 25, rating: 82, starter: true },
  { id: 'c2', name: 'Cent 2', team: 'BBB', role: 'C', cost: 28, rating: 83, starter: true },
  { id: 'c3', name: 'Cent 3', team: 'CCC', role: 'C', cost: 22, rating: 81, starter: true },
  { id: 'c4', name: 'Cent 4', team: 'DDD', role: 'C', cost: 26, rating: 82, starter: true },
  { id: 'c5', name: 'Cent 5', team: 'EEE', role: 'C', cost: 24, rating: 80, starter: true },
  { id: 'c6', name: 'Cent 6', team: 'FFF', role: 'C', cost: 27, rating: 81, starter: true },
  { id: 'c7', name: 'Cent 7', team: 'GGG', role: 'C', cost: 23, rating: 79, starter: false },
  { id: 'c8', name: 'Cent 8', team: 'HHH', role: 'C', cost: 29, rating: 80, starter: false },
  { id: 'a1', name: 'Att 1', team: 'AAA', role: 'A', cost: 60, rating: 92, starter: true },
  { id: 'a2', name: 'Att 2', team: 'BBB', role: 'A', cost: 50, rating: 90, starter: true },
  { id: 'a3', name: 'Att 3', team: 'CCC', role: 'A', cost: 40, rating: 88, starter: true },
  { id: 'a4', name: 'Att 4', team: 'DDD', role: 'A', cost: 45, rating: 89, starter: true },
  { id: 'a5', name: 'Att 5', team: 'EEE', role: 'A', cost: 35, rating: 87, starter: true },
  { id: 'a6', name: 'Att 6', team: 'FFF', role: 'A', cost: 55, rating: 91, starter: false },
];

const cfg: BuildConfig = {
  totalBudget: 800,
  rolePercentages: { P: 10, D: 20, C: 30, A: 40 },
  roleCounts: { P: 3, D: 8, C: 8, A: 6 },
  minStarterPct: 50,
  starterBoost: 0.3,
  constraints: {
    locks: ['a2'],
    excludes: ['x99'],
    preferIds: ['a1'],
    preferTeams: ['Inter'],
    preferBonus: 0.5
  }
};

const acquired = [
  { id: 'p1', price: 22 }, // portiere già tuo a 22
  { id: 'a2', price: 52 }  // attaccante già tuo a 52
];

const res = buildBestSquadWithStarterConstraint(players, cfg, acquired);
console.log(JSON.stringify(res, null, 2));
