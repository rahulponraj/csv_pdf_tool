// controllers/uploadController.js
const csvParser = require('csv-parser');
const fs = require('fs').promises; // Using fs.promises for async operations
const { parseCSVAndStoreInDatabase } = require('./databaseController');
const { generatePDFs } = require('./pdfController');
const { generatePreview } = require('./previewController');
const { savePdfToDatabase } = require('./databaseController');




// controllers/uploadController.js

const handleFileUpload = async (req, res) => {
  try {
    console.log('File upload started...');

    const csvFile = req.files['csv'] ? req.files['csv'][0] : null;
    const pdfFile = req.files['pdf'] ? req.files['pdf'][0] : null;

    if (!csvFile || !pdfFile) {
      return res.status(400).json({ success: false, error: 'CSV and PDF files are required.' });
    }

    // Handle CSV file
    console.log('Start parsing CSV and storing in the database...');
    const csvData = await parseCSVAndStoreInDatabase(csvFile.path);
    console.log('CSV Data after parsing and storing:', csvData);

    console.log('CSV parsing and storing in the database done.');

    console.log('Checking csvData length:', csvData.length);
    console.log('CSV Data Type:', typeof csvData);
    console.log('CSV Data Length:', csvData.length);
    // Handle PDF file
    console.log('Saving PDF file to the database...');
    const pdf = await savePdfToDatabase(pdfFile.originalname, 'pdf', pdfFile.path);

    console.log('PDF saved:', pdf);


    // Generate PDFs for each user in the database
    try {
      console.log('Generating PDFs...');
      await generatePDFs(csvData);
      console.log('PDFs generated successfully.');
    } catch (error) {
      console.error('Error generating PDFs:', error);
    }

    // Generate PDF previews
// console.log('Generating PDF previews...');
// const pdfPreviews = await generatePreview(csvData);
// console.log('PDF previews generated successfully.');


    // Move uploaded files to the "uploads" directory
    try {
      await Promise.all([
        fs.rename(csvFile.path, `uploads/${csvFile.originalname}`),
        fs.rename(pdfFile.path, `uploads/${pdfFile.originalname}`)
      ]);

      console.log('File upload completed.');
      res.status(200).json({
        success: true,
        data: { csvFile: csvFile.originalname, pdfFile: pdfFile.originalname}
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
