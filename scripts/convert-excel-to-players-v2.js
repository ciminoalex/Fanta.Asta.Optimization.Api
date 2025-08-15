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
    
    // Ottieni il primo foglio
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converti in JSON con header
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log('Numero totale di righe trovate:', jsonData.length);
    
    // Mostra la prima riga per vedere la struttura
    if (jsonData.length > 0) {
      console.log('\nStruttura della prima riga:');
      console.log(Object.keys(jsonData[0]));
    }
    
    // Mappa le colonne Excel ai campi del nostro formato
    const players = jsonData
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
          id: index + 1,
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
          rigParati: parseInt(row['Rig. Parati']) || 0
        };
      });
    
    console.log('\nGiocatori convertiti:', players.length);
    
    // Mostra alcuni esempi
    console.log('\nPrimi 5 giocatori convertiti:');
    players.slice(0, 5).forEach((player, index) => {
      console.log(`${index + 1}. ${player.name} (${player.team}) - ${player.role} - ${player.fascia} - Budget: ${player.budgetPercentage}%`);
    });
    
    // Salva i giocatori convertiti
    const outputPath = path.join(__dirname, '../public/sample-players.json');
    fs.writeFileSync(outputPath, JSON.stringify(players, null, 2));
    
    console.log(`\n✅ ${players.length} giocatori salvati in ${outputPath}`);
    
    // Statistiche
    const stats = {
      totalPlayers: players.length,
      byRole: {},
      byFascia: {}
    };
    
    players.forEach(player => {
      // Conta per ruolo
      if (!stats.byRole[player.role]) stats.byRole[player.role] = 0;
      stats.byRole[player.role]++;
      
      // Conta per fascia
      if (!stats.byFascia[player.fascia]) stats.byFascia[player.fascia] = 0;
      stats.byFascia[player.fascia]++;
    });
    
    console.log('\n📊 Statistiche:');
    console.log('Per ruolo:', stats.byRole);
    console.log('Per fascia:', stats.byFascia);
    
    // Mostra alcuni giocatori per ruolo
    console.log('\n🎯 Esempi per ruolo:');
    Object.keys(stats.byRole).forEach(role => {
      const rolePlayers = players.filter(p => p.role === role).slice(0, 3);
      console.log(`${role} (${stats.byRole[role]}): ${rolePlayers.map(p => p.name).join(', ')}`);
    });
    
  } catch (error) {
    console.error('Errore nella conversione:', error.message);
    console.error(error.stack);
  }
}

// Esegui la conversione
convertExcelToPlayers(); 