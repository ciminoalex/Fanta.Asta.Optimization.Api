# 🏆 Fantacalcio Auction - Gestione Aste Fantacalcio

Un'applicazione web moderna per gestire aste di fantacalcio con ottimizzazione automatica della rosa tramite API esterna.

## ✨ Caratteristiche Principali

### 🎯 **Gestione Aste**
- Sistema di aste in tempo reale
- Gestione budget e offerte
- Cronologia delle aste
- Statistiche dettagliate

### 🤖 **Ottimizzazione Rosa Ideale**
- **API Esterna Integrata** per l'ottimizzazione automatica
- Algoritmi di ottimizzazione avanzati
- Gestione budget per ruolo
- Priorità per fasce e titolarità

### 📊 **Gestione Squadra**
- Rosa personalizzabile
- Formazioni flessibili
- Budget per ruolo
- Analisi performance

### 🔧 **Configurazione API**
- Configurazione personalizzabile dell'API esterna
- Test di connettività
- Gestione timeout e retry
- Persistenza delle configurazioni

## 🚀 Tecnologie Utilizzate

- **Frontend**: React 18 + Vite
- **UI Components**: Tailwind CSS + Lucide React Icons
- **State Management**: React Hooks (useState, useEffect, useMemo)
- **API Integration**: REST API con gestione errori e retry
- **Storage**: localStorage per persistenza dati
- **Build Tool**: Vite per sviluppo e produzione

## 📋 Prerequisiti

- Node.js 16+ 
- npm o yarn
- Browser moderno con supporto ES6+

## 🛠️ Installazione

### 1. Clona il repository
```bash
git clone <repository-url>
cd Fanta.Asta
```

### 2. Installa le dipendenze
```bash
npm install
```

### 3. Avvia l'ambiente di sviluppo
```bash
npm run dev
```

### 4. Apri nel browser
L'applicazione sarà disponibile su `http://localhost:3000`

## 🔧 Configurazione

### API Esterna
1. Clicca sul pulsante **"API"** nell'header
2. Inserisci l'URL base dell'API (es: `http://localhost:3000`)
3. Configura timeout e parametri di ottimizzazione
4. Clicca **"Test Connessione"** per verificare
5. Salva la configurazione

### Formazione e Budget
- Personalizza la formazione desiderata
- Imposta le percentuali di budget per ruolo
- Definisci il numero minimo di giocatori per ruolo

## 📱 Utilizzo

### 🎯 **Ottimizzazione Rosa Ideale**
1. Configura l'API esterna
2. Imposta formazione e budget
3. L'API calcola automaticamente la rosa ottimale
4. Visualizza i 25 giocatori suggeriti
5. Clicca su un giocatore per selezionarlo in asta

### 🏆 **Gestione Aste**
1. Seleziona un giocatore dalla rosa ideale
2. Imposta l'importo dell'offerta
3. Clicca **"Vinci Asta"** o **"Perdi Asta"**
4. Il giocatore viene aggiunto alla tua squadra

### 📊 **Gestione Squadra**
- Visualizza la tua rosa attuale
- Rimuovi giocatori se necessario
- Monitora il budget utilizzato
- Analizza la distribuzione per ruolo

## 🏗️ Struttura del Progetto

```
src/
├── components/
│   ├── FantacalcioAuction.jsx    # Componente principale
│   ├── ApiConfigModal.jsx         # Modal configurazione API
│   └── ...
├── services/
│   └── fantaOptimizerApi.js      # Servizio API esterna
├── config/
│   └── api.js                    # Configurazione API
├── utils/
│   └── ...                       # Utility e helper
└── App.jsx                       # Entry point
```

## 🔌 API Esterna

L'applicazione si integra con un'API REST esterna per l'ottimizzazione della rosa:

### Endpoint Principali
- `GET /health` - Controllo stato API
- `POST /optimize` - Ottimizzazione rosa

### Formato Richiesta
```json
{
  "players": [...],
  "config": {
    "totalBudget": 500,
    "rolePercentages": {...},
    "roleCounts": {...},
    "minStarterPct": 70
  },
  "acquired": [...]
}
```

### Formato Risposta
```json
{
  "byRole": {
    "P": {"chosen": [...], "totalCost": 50, "totalScore": 47},
    "D": {"chosen": [...], "totalCost": 100, "totalScore": 135},
    "C": {"chosen": [...], "totalCost": 150, "totalScore": 174},
    "A": {"chosen": [...], "totalCost": 197, "totalScore": 119}
  },
  "totalCost": 497,
  "totalScore": 475
}
```

## 🚀 Build per Produzione

```bash
npm run build
```

I file ottimizzati saranno generati nella cartella `dist/`.

## 🤝 Contributi

1. Fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## 🆘 Supporto

Per supporto o domande:
- Apri una issue su GitHub
- Contatta il team di sviluppo

---

**Sviluppato con ❤️ per la comunità Fantacalcio** 