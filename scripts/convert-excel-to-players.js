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
    
    console.log('Numero totale di giocatori trovati:', jsonData.length);
    
    // Mappa le colonne Excel ai campi del nostro formato
    const players = jsonData
      .filter(row => row.Nome && row.Ruolo && row.Team) // Filtra righe valide
      .map((row, index) => {
        // Estrai le note dalle colonne Note 1-5
        const notes = [
          row['Nota 1'],
          row['Nota 2'], 
          row['Nota 3'],
          row['Nota 4'],
          row['Nota 5']
        ].filter(note => note && note.trim() !== '').join(' • ');
        
        // Calcola la percentuale del budget (rimuovi il % e converti in numero)
        const budgetPercentage = row.Budget ? 
          parseFloat(row.Budget.toString().replace('%', '')) : 0;
        
        // Calcola il prezzo (se non presente, usa la percentuale del budget)
        const price = row.Prezzo || 0;
        
        return {
          id: index + 1,
          name: row.Nome || '',
          team: row.Team || '',
          role: row.Ruolo || '',
          fascia: row.Fascia || 'Non Impostata',
          budgetPercentage: budgetPercentage,
          price: price,
          fmv: row.FMV || 0,
          gol: row.Gol || 0,
          assist: row.Assist || 0,
          presenze: row.Presenze || 0,
          notes: notes || '',
          // Campi aggiuntivi dal file Excel
          pma: row.PMA || '',
          quo: row.Quo || '',
          titolarita: row.Titolarità || '',
          affidabilita: row.Affidabilità || '',
          integrita: row.Integrità || '',
          commento: row.Commento || '',
          mv: row.MV || 0,
          fmvExp: row['FMV Exp.'] || 0,
          ptTit: row['Pt. Tit.'] || 0,
          minuti: row.Minuti || 0,
          ptInf: row['Pt. Inf.'] || 0,
          ammonizioni: row.Ammonizioni || 0,
          espulsioni: row.Espulsioni || 0,
          rigSegnati: row['Rig. Segnati'] || 0,
          rigSbagliati: row['Rig. Sbagliati'] || 0,
          golSubiti: row['Gol Subiti'] || 0,
          rigParati: row['Rig. Parati'] || 0
        };
      });
    
    console.log('Giocatori convertiti:', players.length);
    
    // Mostra alcuni esempi
    console.log('\nPrimi 3 giocatori convertiti:');
    players.slice(0, 3).forEach((player, index) => {
      console.log(`${index + 1}. ${player.name} (${player.team}) - ${player.role} - ${player.fascia}`);
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
    
  } catch (error) {
    console.error('Errore nella conversione:', error.message);
  }
}

// Esegui la conversione
convertExcelToPlayers(); 