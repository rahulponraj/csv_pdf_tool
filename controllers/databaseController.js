const csvParser = require('csv-parser');
const fs = require('fs');
const { promisify } = require('util');
const User = require('../models/Customer');
const Pdf = require('../models/Pdf');
const Csv = require('../models/Csv');
const path = require('path');



const parseCSVAndStoreInDatabase = async (csvFilePath,pdfFilename, pdfFileType, pdfFilePath) => {
  try {

    // Extract the file name from the CSV file path
    const csvFilename = path.basename(csvFilePath);

    // Add current time to the filename
    const currentTime = new Date().toISOString().slice(11, 19).replace(/:/g, "-");
    const newCsvFilename = `${csvFilename}_${currentTime}`;

    // Save CSV file to the database
    const csv = new Csv({
      filename: newCsvFilename,
      fileType: 'csv', // Specify the file type
      filePath: csvFilePath // Path to the CSV file
    });
    await csv.save();
    console.log('CSV saved to database:', csv);

    console.log('Start parsing CSV...');

    const readFile = promisify(fs.readFile);
    const csvContent = await readFile(csvFilePath, 'utf-8'); 
    console.log('CSV Content:', csvContent);

    const results = [];

     // Use promisified csv-parser
     const csvRows = await new Promise((resolve, reject) => {  
      const rows = [];
      fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', (data) => {
          console.log('CSV Data:', data);
          rows.push(data);
        })
        .on('end', () => resolve(rows))
        .on('error', reject);
    });
    // Upload PDF and get its ObjectId
    const pdfObjectId = await savePdfToDatabase(pdfFilename, pdfFileType, pdfFilePath);


    // Process each row
    for (const data of csvRows) {
      try {
        // Check if Name and MobileNumber fields exist in the data
        if (!data.Name || !data.MobileNumber) {
          console.error('Name or MobileNumber is missing in CSV data:', data);
          continue; // Skip this row and proceed to the next one
        }
    
        const user = new User({
          name: data.Name,
          mobileNumber: data.MobileNumber,
          status: 'pending',
          uploadedPdf: pdfObjectId,
          uploadedCsv: csv._id,
        });

        await user.save();
        results.push(user);
        console.log('User saved:', user);
      } catch (error) { 
        console.error('Error saving user to the database:', error);
      } 
    }
// Add a timestamp to the newly uploaded customers
const timestamp = new Date();
const updatedResults = results.map(customer => ({ ...customer, timestamp }));

    console.log('CSV parsing and storing in the database done.');
    console.log('Final Parsed Results:', updatedResults);
    return { length: updatedResults.length, results: updatedResults };
  } catch (error) {
    console.error('Error parsing CSV and storing in the database:', error);
    throw error;
  }
};



const savePdfToDatabase = async (filename, fileType, filePath) => {
  try {
    // Get the current time in HH-MM-SS format
    const currentTime = new Date().toISOString().slice(11, 19).replace(/:/g, "-");

    // Concatenate the original filename with the current time
    const newFilename = `${filename}_${currentTime}`;

    const pdf = new Pdf({
      filename: newFilename,
      fileType,
      filePath,
    });
    await pdf.save();
    console.log('PDF saved to database:', pdf);
    return pdf._id;
  } catch (error) {
    console.error('Error saving PDF to database:', error);
    throw error;
  }
};




module.exports = { parseCSVAndStoreInDatabase, savePdfToDatabase};