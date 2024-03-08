// controllers/uploadController.js
const csvParser = require('csv-parser');
const fs = require('fs').promises; // Using fs.promises for async operations
const { parseCSVAndStoreInDatabase } = require('./databaseController');


const handleFileUpload = async (req, res) => {
  try {
    console.log('File upload started...');

    const csvFile = req.files['csv'] ? req.files['csv'][0] : null;
    const pdfFile = req.files['pdf'] ? req.files['pdf'][0] : null;

    if (!csvFile || !pdfFile) {
      return res.status(400).json({ success: false, error: 'CSV and PDF files are required.' });
    }
    console.log('Start parsing CSV and storing in the database...');
    const csvData = await parseCSVAndStoreInDatabase(csvFile.path, pdfFile.originalname, 'pdf', pdfFile.path);
    console.log('CSV parsing and storing in the database done.');
    console.log('Checking csvData length:', csvData.length);
    console.log('CSV Data Type:', typeof csvData);
    console.log('CSV Data Length:', csvData.length);
    
    try { 
      // After handling file uploads, get customers with pending status
    const pendingCustomers = await getCustomersWithPendingStatus();
    console.log('Pending customers:', pendingCustomers);
      console.log('File upload completed.');
      res.status(200).json({
        success: true,
        data: { csvFile: csvFile.originalname, pdfFile: pdfFile.originalname }
      });
    } catch (moveError) {
      console.error('Error saving files:', moveError);
      res.status(500).json({ success: false, error: 'Error saving files' });
    }
  } catch (error) {
    console.error('Error handling file upload:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

module.exports = { handleFileUpload };
