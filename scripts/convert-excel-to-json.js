const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Funzione per convertire il file Excel in JSON
function convertExcelToJson() {
  try {
    // Percorso del file Excel
    const excelFilePath = path.join(__dirname, '../files/Carmy Classic 25_26.xlsx');
    
    // Leggi il file Excel
    const workbook = XLSX.readFile(excelFilePath);
    
    // Ottieni il primo foglio
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converti in JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('Struttura del file Excel:');
    console.log('Numero di righe:', jsonData.length);
    if (jsonData.length > 0) {
      console.log('Numero di colonne:', jsonData[0].length);
      console.log('Prime 5 righe:');
      jsonData.slice(0, 5).forEach((row, index) => {
        console.log(`Riga ${index + 1}:`, row);
      });
    }
    
    // Salva la struttura in un file per analisi
    fs.writeFileSync(
      path.join(__dirname, '../excel-structure.json'), 
      JSON.stringify(jsonData, null, 2)
    );
    
    console.log('\nStruttura salvata in excel-structure.json');
    console.log('Analizza questo file per capire la struttura dei dati');
    
  } catch (error) {
    console.error('Errore nella conversione:', error.message);
  }
}

// Esegui la conversione
convertExcelToJson(); 