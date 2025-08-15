const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Funzione per convertire il file Excel nel formato giocatori
function convertExcelToPlayers() {
  try {
    // Percorso del file Excel
    const excelFilePath = path.join(__dirname, '../files/Carmy Classic 25_26.xlsx');
    
    // Leggi il file Excel
    const workbook = XLSX.readFile(excelFilePath);
    
    console.log('📊 Fogli disponibili nel file Excel:');
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
    
    // Mostra alcuni esempi per ogni ruolo
    console.log('\n📋 Esempi per ruolo:');
    const playersByRole = {};
    allPlayers.forEach(player => {
      if (!playersByRole[player.role]) {
        playersByRole[player.role] = [];
      }
      playersByRole[player.role].push(player);
    });
    
    Object.keys(playersByRole).forEach(role => {
      const rolePlayers = playersByRole[role];
      const examples = rolePlayers.slice(0, 3).map(p => p.name).join(', ');
      console.log(`   ${role} (${rolePlayers.length}): ${examples}`);
    });
    
    // Mostra alcuni esempi per fascia
    console.log('\n🏷️ Esempi per fascia:');
    const playersByFascia = {};
    allPlayers.forEach(player => {
      if (!playersByFascia[player.fascia]) {
        playersByFascia[player.fascia] = [];
      }
      playersByFascia[player.fascia].push(player);
    });
    
    Object.keys(playersByFascia).forEach(fascia => {
      const fasciaPlayers = playersByFascia[fascia];
      const examples = fasciaPlayers.slice(0, 3).map(p => p.name).join(', ');
      console.log(`   ${fascia} (${fasciaPlayers.length}): ${examples}`);
    });
    
    // Salva i giocatori convertiti
    const outputPath = path.join(__dirname, '../public/sample-players.json');
    fs.writeFileSync(outputPath, JSON.stringify(allPlayers, null, 2));
    
    console.log(`\n✅ ${allPlayers.length} giocatori salvati in ${outputPath}`);
    
    // Statistiche finali
    const stats = {
      totalPlayers: allPlayers.length,
      totalRows: totalRows,
      sheets: workbook.SheetNames,
      byRole: {},
      byFascia: {},
      bySheet: {}
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
    const statsPath = path.join(__dirname, '../conversion-stats.json');
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    console.log(`\n📈 Statistiche salvate in ${statsPath}`);
    
  } catch (error) {
    console.error('❌ Errore nella conversione:', error.message);
    console.error(error.stack);
  }
}

// Esegui la conversione
convertExcelToPlayers(); 