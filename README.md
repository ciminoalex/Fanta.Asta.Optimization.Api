
# 🏆 Fanta Optimizer API

**API intelligente per l'ottimizzazione automatica di squadre di Fantasy Football con algoritmi avanzati di constraint satisfaction e fallback intelligenti.**

## 🚀 Caratteristiche Principali

- **🎯 Ottimizzazione Intelligente**: Algoritmi DP e greedy per la selezione ottimale dei giocatori
- **🔄 Fallback Robusto**: Gestione automatica dei casi limite con selezione dei migliori giocatori disponibili
- **💰 Gestione Budget Avanzata**: Distribuzione intelligente del budget con tolleranza del 10%
- **📊 Vincoli Flessibili**: Rispetto dei requisiti di titolarità con fallback graduali
- **🌐 API REST Completa**: Endpoint Swagger per testing e documentazione
- **⚡ Performance Ottimizzate**: Algoritmi efficienti per grandi dataset di giocatori

## 🛠️ Tecnologie

- **Backend**: Node.js + Express.js
- **Linguaggio**: TypeScript
- **Documentazione**: Swagger/OpenAPI
- **Algoritmi**: Dynamic Programming + Greedy + Fallback Intelligente

## 📋 Requisiti

- Node.js 16+
- npm o yarn
- TypeScript

## 🚀 Installazione

```bash
# Clona il repository
git clone https://github.com/ciminoalex/Fanta.Asta.Optimization.Api.git
cd Fanta.Asta.Optimization.Api

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run serve

# Build per produzione
npm run build
```

## 🌐 API Endpoints

### 🏥 Health Check
```
GET /health
```

### ⚡ Ottimizzazione Squadra
```
POST /optimize
```

### 📖 Documentazione Swagger
```
GET /api-docs
```

### 📄 OpenAPI JSON
```
GET /swagger.json
```

## 📊 Configurazione

### Parametri di Ottimizzazione

```json
{
  "totalBudget": 500,
  "rolePercentages": {
    "P": 15,  // Portieri
    "D": 25,  // Difensori
    "C": 30,  // Centrocampisti
    "A": 30   // Attaccanti
  },
  "roleCounts": {
    "P": 3,   // 3 portieri
    "D": 8,   // 8 difensori
    "C": 8,   // 8 centrocampisti
    "A": 6    // 6 attaccanti
  },
  "minStarterPct": 50,
  "starterBoost": 5
}
```

### Vincoli e Preferenze

```json
{
  "constraints": {
    "locks": [],           // Giocatori bloccati
    "excludes": [],        // Giocatori esclusi
    "preferIds": [],       // ID preferiti
    "preferTeams": [],     // Squadre preferite
    "preferBonus": 10      // Bonus per preferenze
  }
}
```

## 🧠 Algoritmi di Ottimizzazione

### 1. **Dynamic Programming (DP)**
- Selezione ottimale per ruoli specifici
- Massimizzazione del rapporto score/costo
- Rispetto dei vincoli di budget

### 2. **Greedy Algorithm**
- Selezione rapida dei migliori giocatori disponibili
- Fallback quando DP non riesce a soddisfare i vincoli
- Ottimizzazione per score e rating

### 3. **Fallback Intelligente**
- Gestione automatica dei casi limite
- Selezione dei migliori giocatori disponibili
- Rispetto dei requisiti minimi di posti

### 4. **Gestione Budget Avanzata**
- Distribuzione proporzionale per ruolo
- Ridistribuzione del budget risparmiato
- Tolleranza del 10% per sforamenti

## 🔧 Configurazione Avanzata

### Variabili d'Ambiente

```bash
# Porta del server (default: 3001)
PORT=3001

# Ambiente (development/production)
NODE_ENV=development
```

### Script NPM

```bash
# Sviluppo
npm run serve          # Avvia server con ts-node
npm run dev            # Avvia in modalità watch

# Build
npm run build          # Compila TypeScript
npm run start          # Avvia build di produzione

# Utility
npm run lint           # Controllo codice
npm run test           # Esecuzione test
```

## 📈 Esempi di Utilizzo

### Richiesta di Ottimizzazione

```bash
curl -X POST http://localhost:3001/optimize \
  -H "Content-Type: application/json" \
  -d @call.json
```

### Risposta di Esempio

```json
{
  "byRole": {
    "P": {
      "chosen": [...],
      "totalCost": 73,
      "totalScore": 52,
      "startersCount": 3
    },
    "D": {...},
    "C": {...},
    "A": {...}
  },
  "totalCost": 501,
  "totalScore": 375,
  "budgets": {...}
}
```

## 🚨 Gestione Errori

### Fallback Intelligente
- **Vincoli di Titolarità**: Riduzione graduale dei requisiti
- **Budget Sforato**: Tolleranza del 10% con warning
- **Giocatori Insufficienti**: Selezione dei migliori disponibili

### Logging Avanzato
- Warning per vincoli non soddisfatti
- Informazioni sui fallback utilizzati
- Metriche di performance e budget

## 🔍 Debug e Monitoraggio

### Log di Sistema
```
⚠️ Impossibile soddisfare il requisito minimo di 3 titolari
✅ Soluzione trovata con 2 titolari (invece di 3 richiesti)
🚨 Fallback di emergenza: seleziono i migliori giocatori disponibili
💰 Distribuzione budget: { totalBudget: 500, totalCost: 501, savedBudget: 0 }
```

### Metriche di Performance
- Tempo di esecuzione per ruolo
- Utilizzo del budget per ruolo
- Qualità delle soluzioni trovate

## 🤝 Contributi

1. Fork del progetto
2. Creazione di un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apertura di una Pull Request

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

## 👨‍💻 Autore

**Alessandro Cimino**
- GitHub: [@ciminoalex](https://github.com/ciminoalex)
- Repository: [Fanta.Asta.Optimization.Api](https://github.com/ciminoalex/Fanta.Asta.Optimization.Api)

## 🙏 Ringraziamenti

- Algoritmi di ottimizzazione avanzati
- Gestione robusta dei casi limite
- API REST completa con documentazione Swagger
- Sistema di fallback intelligente per massima affidabilità

---

**⚡ Ottimizza la tua squadra di Fantasy Football con algoritmi all'avanguardia!**
