const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Script per generare i dati di produzione
function generateProductionData() {
  try {
    console.log('🚀 Generazione dati di produzione...');
    
    // Percorso del file Excel
    const excelFilePath = path.join(__dirname, '../files/Carmy Classic 25_26.xlsx');
    
    if (!fs.existsSync(excelFilePath)) {
      console.error('❌ File Excel non trovato:', excelFilePath);
      console.log('📁 Assicurati che il file Excel sia presente nella cartella files/');
      return;
    }
    
    // Leggi il file Excel
    const workbook = XLSX.readFile(excelFilePath);
    
    console.log('📊 Fogli disponibili nel file Excel:'); // Commento per debug
    console.log(workbook.SheetNames);
    
    let allPlayers = [];
    let totalRows = 0;
    
    // Processa ogni foglio
    workbook.SheetNames.forEach((sheetName, sheetIndex) => {
      console.log(`\n🔄 Processando foglio: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Converti in JSON con header
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`   Righe trovate: ${jsonData.length}`);
      totalRows += jsonData.length;
      
      // Mostra la struttura del primo foglio per riferimento
      if (sheetIndex === 0 && jsonData.length > 0) {
        console.log(`   Struttura colonne:`, Object.keys(jsonData[0]));
      }
      
      // Mappa le colonne Excel ai campi del nostro formato
      const sheetPlayers = jsonData
        .filter(row => {
          // Filtra righe valide che hanno almeno Nome, Ruolo e Team
          return row.Nome && row.Ruolo && row.Team && 
                 row.Nome.toString().trim() !== '' && 
                 row.Ruolo.toString().trim() !== '' && 
                 row.Team.toString().trim() !== '';
        })
        .map((row, index) => {
          // Estrai le note dalle colonne Note 1-5
          const notes = [
            row['Nota 1'],
            row['Nota 2'], 
            row['Nota 3'],
            row['Nota 4'],
            row['Nota 5']
          ].filter(note => note && note.toString().trim() !== '').join(' • ');
          
          // Calcola la percentuale del budget (rimuovi il % e converti in numero)
          let budgetPercentage = 0;
          if (row.Budget) {
            const budgetStr = row.Budget.toString();
            budgetPercentage = parseFloat(budgetStr.replace('%', '').replace(',', '.'));
          }
          
          // Calcola il prezzo
          const price = row.Prezzo || 0;
          
          // Converti FMV in numero
          const fmv = parseFloat(row.FMV) || 0;
          
          // Converti gol, assist e presenze in numeri
          const gol = parseInt(row.Gol) || 0;
          const assist = parseInt(row.Assist) || 0;
          const presenze = parseInt(row.Presenze) || 0;
          
          return {
            id: allPlayers.length + index + 1, // ID univoco globale
            name: row.Nome.toString().trim(),
            team: row.Team.toString().trim(),
            role: row.Ruolo.toString().trim(),
            fascia: row.Fascia ? row.Fascia.toString().trim() : 'Non Impostata',
            budgetPercentage: budgetPercentage,
            price: price,
            fmv: fmv,
            gol: gol,
            assist: assist,
            presenze: presenze,
            notes: notes,
            // Campi aggiuntivi dal file Excel
            pma: row.PMA || '',
            quo: row.Quo || '',
            titolarita: row.Titolarità || '',
            affidabilita: row.Affidabilità || '',
            integrita: row.Integrità || '',
            commento: row.Commento || '',
            mv: parseFloat(row.MV) || 0,
            fmvExp: parseFloat(row['FMV Exp.']) || 0,
            ptTit: parseInt(row['Pt. Tit.']) || 0,
            minuti: parseInt(row.Minuti) || 0,
            ptInf: parseInt(row['Pt. Inf.']) || 0,
            ammonizioni: parseInt(row.Ammonizioni) || 0,
            espulsioni: parseInt(row.Espulsioni) || 0,
            rigSegnati: parseInt(row['Rig. Segnati']) || 0,
            rigSbagliati: parseInt(row['Rig. Sbagliati']) || 0,
            golSubiti: parseInt(row['Gol Subiti']) || 0,
            rigParati: parseInt(row['Rig. Parati']) || 0,
            // Metadati aggiuntivi
            sheetName: sheetName,
            sheetIndex: sheetIndex
          };
        });
      
      console.log(`   Giocatori validi estratti: ${sheetPlayers.length}`);
      
      // Aggiungi i giocatori di questo foglio alla lista totale
      allPlayers = allPlayers.concat(sheetPlayers);
    });
    
    console.log(`\n🎯 TOTALE GENERALE:`);
    console.log(`   Righe processate: ${totalRows}`);
    console.log(`   Giocatori convertiti: ${allPlayers.length}`);
    
    // Salva i giocatori convertiti come dati di PRODUZIONE
    const productionPath = path.join(__dirname, '../public/production-players.json');
    fs.writeFileSync(productionPath, JSON.stringify(allPlayers, null, 2));
    
    console.log(`\n✅ ${allPlayers.length} giocatori salvati come DATI DI PRODUZIONE in ${productionPath}`);
    console.log('🚀 L\'app ora userà automaticamente questi dati di produzione!');
    
    // Salva anche una copia come backup con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, `../public/production-players-${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(allPlayers, null, 2));
    console.log(`📦 Backup salvato in ${backupPath}`);
    
    // Statistiche finali
    const stats = {
      totalPlayers: allPlayers.length,
      totalRows: totalRows,
      sheets: workbook.SheetNames,
      byRole: {},
      byFascia: {},
      bySheet: {},
      generatedAt: new Date().toISOString(),
      type: 'production'
    };
    
    allPlayers.forEach(player => {
      // Conta per ruolo
      if (!stats.byRole[player.role]) stats.byRole[player.role] = 0;
      stats.byRole[player.role]++;
      
      // Conta per fascia
      if (!stats.byFascia[player.fascia]) stats.byFascia[player.fascia] = 0;
      stats.byFascia[player.fascia]++;
      
      // Conta per foglio
      if (!stats.bySheet[player.sheetName]) stats.bySheet[player.sheetName] = 0;
      stats.bySheet[player.sheetName]++;
    });
    
    console.log('\n📊 STATISTICHE FINALI:');
    console.log('Per ruolo:', stats.byRole);
    console.log('Per fascia:', stats.byFascia);
    console.log('Per foglio:', stats.bySheet);
    
    // Salva anche le statistiche
    const statsPath = path.join(__dirname, '../production-stats.json');
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    console.log(`\n📈 Statistiche di produzione salvate in ${statsPath}`);
    
  } catch (error) {
    console.error('❌ Errore nella generazione dei dati di produzione:', error.message);
    console.error(error.stack);
  }
}

// Esegui la generazione
generateProductionData();
