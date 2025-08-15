
import express = require('express');
import cors = require('cors');
import { z } from 'zod';
import swaggerUi = require('swagger-ui-express');
import swaggerJsdoc = require('swagger-jsdoc');
import { buildBestSquadWithStarterConstraint, Player, BuildConfig, BuildResult } from './index';

const app = express();
app.use(cors());
app.use(express.json({ limit: '4mb' }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fanta Optimizer API',
      version: '1.2.0',
      description: 'API REST per ottimizzare una rosa Fantacalcio con budget per reparto, min % titolari, locks/excludes/prefer, giocatori già aggiudicati e redistribuzione proporzionale.',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Role: {
          type: 'string',
          enum: ['P', 'D', 'C', 'A'],
          description: 'Ruolo del giocatore: P=Portiere, D=Difensore, C=Centrocampista, A=Attaccante'
        },
        Player: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'ID univoco del giocatore' },
            name: { type: 'string', description: 'Nome del giocatore' },
            team: { type: 'string', description: 'Squadra del giocatore' },
            role: { $ref: '#/components/schemas/Role' },
            cost: { type: 'integer', minimum: 0, description: 'Costo del giocatore' },
            rating: { type: 'number', minimum: 0, maximum: 100, description: 'Rating del giocatore' },
            starter: { type: 'boolean', description: 'Se il giocatore è titolare' }
          },
          required: ['id', 'name', 'team', 'role', 'cost', 'rating', 'starter']
        },
        Constraints: {
          type: 'object',
          properties: {
            locks: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Lista di ID giocatori che devono essere inclusi nella rosa'
            },
            excludes: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Lista di ID giocatori che devono essere esclusi dalla rosa'
            },
            preferIds: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Lista di ID giocatori preferiti (bonus punti)'
            },
            preferTeams: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Lista di squadre preferite (bonus punti)'
            },
            preferBonus: { 
              type: 'number',
              description: 'Bonus punti per giocatori/squadre preferiti'
            }
          }
        },
        BuildConfig: {
          type: 'object',
          properties: {
            totalBudget: { 
              type: 'integer', 
              minimum: 1,
              description: 'Budget totale disponibile'
            },
            rolePercentages: {
              type: 'object',
              properties: {
                P: { type: 'number', description: 'Percentuale budget per portieri' },
                D: { type: 'number', description: 'Percentuale budget per difensori' },
                C: { type: 'number', description: 'Percentuale budget per centrocampisti' },
                A: { type: 'number', description: 'Percentuale budget per attaccanti' }
              },
              description: 'Percentuali di budget per ruolo (devono sommare a 100)'
            },
            roleCounts: {
              type: 'object',
              properties: {
                P: { type: 'integer', minimum: 1, description: 'Numero di portieri richiesti' },
                D: { type: 'integer', minimum: 1, description: 'Numero di difensori richiesti' },
                C: { type: 'integer', minimum: 1, description: 'Numero di centrocampisti richiesti' },
                A: { type: 'integer', minimum: 1, description: 'Numero di attaccanti richiesti' }
              },
              description: 'Numero di giocatori richiesti per ruolo'
            },
            minStarterPct: { 
              type: 'number', 
              minimum: 0, 
              maximum: 100,
              description: 'Percentuale minima di titolari richiesti per ruolo'
            },
            starterBoost: { 
              type: 'number',
              description: 'Bonus punti per giocatori titolari'
            },
            constraints: { $ref: '#/components/schemas/Constraints' }
          },
          required: ['totalBudget', 'rolePercentages', 'roleCounts', 'minStarterPct']
        },
        Acquired: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'ID del giocatore già acquisito' },
            price: { type: 'integer', minimum: 0, description: 'Prezzo pagato per il giocatore' }
          },
          required: ['id', 'price']
        },
        RoleSolution: {
          type: 'object',
          properties: {
            chosen: { 
              type: 'array', 
              items: { $ref: '#/components/schemas/Player' },
              description: 'Giocatori selezionati per questo ruolo'
            },
            totalCost: { type: 'number', description: 'Costo totale per questo ruolo' },
            totalScore: { type: 'number', description: 'Punteggio totale per questo ruolo' },
            startersCount: { type: 'integer', description: 'Numero di titolari per questo ruolo' }
          }
        },
        BuildResult: {
          type: 'object',
          properties: {
            byRole: {
              type: 'object',
              properties: {
                P: { $ref: '#/components/schemas/RoleSolution' },
                D: { $ref: '#/components/schemas/RoleSolution' },
                C: { $ref: '#/components/schemas/RoleSolution' },
                A: { $ref: '#/components/schemas/RoleSolution' }
              }
            },
            totalCost: { type: 'number', description: 'Costo totale della rosa' },
            totalScore: { type: 'number', description: 'Punteggio totale della rosa' },
            budgets: {
              type: 'object',
              properties: {
                P: { type: 'number', description: 'Budget allocato per portieri' },
                D: { type: 'number', description: 'Budget allocato per difensori' },
                C: { type: 'number', description: 'Budget allocato per centrocampisti' },
                A: { type: 'number', description: 'Budget allocato per attaccanti' }
              }
            },
            initialBudgets: {
              type: 'object',
              properties: {
                P: { type: 'number', description: 'Budget iniziale per portieri' },
                D: { type: 'number', description: 'Budget iniziale per difensori' },
                C: { type: 'number', description: 'Budget iniziale per centrocampisti' },
                A: { type: 'number', description: 'Budget iniziale per attaccanti' }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/server.ts']
};

const specs = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Fanta Optimizer API Documentation'
}));

// Endpoint per scaricare il JSON dello Swagger
app.get('/swagger.json', (_req: any, res: any) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="fanta-optimizer-api.json"');
  res.json(specs);
});

// Root endpoint redirects to API docs
app.get('/', (_req: any, res: any) => {
  res.redirect('/api-docs');
});

const RoleEnum = z.enum(['P', 'D', 'C', 'A']);

const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  team: z.string(),
  role: RoleEnum,
  cost: z.number().int().nonnegative(),
  rating: z.number().min(0).max(100),
  starter: z.boolean(),
});

const ConstraintsSchema = z.object({
  locks: z.array(z.string()).optional(),
  excludes: z.array(z.string()).optional(),
  preferIds: z.array(z.string()).optional(),
  preferTeams: z.array(z.string()).optional(),
  preferBonus: z.number().optional(),
}).optional();

const BuildConfigSchema = z.object({
  totalBudget: z.number().int().positive(),
  rolePercentages: z.object({ P: z.number(), D: z.number(), C: z.number(), A: z.number() }),
  roleCounts: z.object({ P: z.number().int().positive(), D: z.number().int().positive(), C: z.number().int().positive(), A: z.number().int().positive() }),
  minStarterPct: z.number().min(0).max(100),
  starterBoost: z.number().optional(),
  constraints: ConstraintsSchema,
});

const AcquiredSchema = z.object({
  id: z.string(),
  price: z.number().int().nonnegative(),
});

const OptimizeRequestSchema = z.object({
  players: z.array(PlayerSchema).min(1),
  config: BuildConfigSchema,
  acquired: z.array(AcquiredSchema).optional().default([]),
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Verifica lo stato del servizio
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Servizio funzionante
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 service:
 *                   type: string
 *                   example: "fanta-optimizer-ts"
 *                 version:
 *                   type: string
 *                   example: "1.2.0"
 */
app.get('/health', (_req: any, res: any) => {
  res.json({ status: 'ok', service: 'fanta-optimizer-ts', version: '1.2.0' });
});

/**
 * @swagger
 * /optimize:
 *   post:
 *     summary: Ottimizza la rosa Fantacalcio
 *     description: Calcola la migliore combinazione di giocatori rispettando budget, vincoli e preferenze
 *     tags: [Optimization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               players:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Player'
 *                 minItems: 1
 *                 description: Lista di tutti i giocatori disponibili
 *               config:
 *                 $ref: '#/components/schemas/BuildConfig'
 *               acquired:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Acquired'
 *                 default: []
 *                 description: Lista di giocatori già acquisiti all'asta
 *             required:
 *               - players
 *               - config
 *     responses:
 *       200:
 *         description: Rosa ottimizzata calcolata con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BuildResult'
 *       400:
 *         description: Richiesta non valida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Messaggio di errore
 *                 details:
 *                   type: array
 *                   description: Dettagli di validazione (se disponibili)
 *       500:
 *         description: Errore interno del server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 *                 message:
 *                   type: string
 *                   description: Dettagli dell'errore
 */
app.post('/optimize', (req: any, res: any, next: any) => {
  try {
    const { players, config, acquired } = OptimizeRequestSchema.parse(req.body);
    const sumPerc = config.rolePercentages.P + config.rolePercentages.D + config.rolePercentages.C + config.rolePercentages.A;
    if (Math.abs(sumPerc - 100) > 1e-6) {
      return res.status(400).json({ error: 'rolePercentages must sum to 100.' });
    }
    const result: BuildResult = buildBestSquadWithStarterConstraint(players as Player[], config as BuildConfig, (acquired || []) as { id: string; price: number }[]);
    res.json(result);
  } catch (err: any) {
    if (err?.issues) {
      return res.status(400).json({ error: 'Invalid request body', details: err.issues });
    }
    next(err);
  }
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err?.message ?? 'unknown' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 fanta-optimizer-ts API listening on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`📄 OpenAPI JSON: http://localhost:${PORT}/swagger.json`);
  console.log(`🌐 Root: http://localhost:${PORT}/`);
  console.log(`🔍 GET  /health`);
  console.log(`⚡ POST /optimize`);
});
