const csvParser = require('csv-parser');
const fs = require('fs');
const { promisify } = require('util');
const User = require('../models/Customer');
const Pdf = require('../models/Pdf');
const Csv = require('../models/Csv');
const path = require('path');
const TicketEventData = require('../models/TicketEventData');


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

    const csvRows = await new Promise((resolve, reject) => {
      const rows = [];
      let headers = null;
    
      fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('headers', (h) => {
          headers = h;
        })
        .on('data', (data) => {
          const rowData = {};
    
          // Ensure all headers are included in the data object, even if they are empty
          headers.forEach((header) => {
            rowData[header] = data[header] || '';
          });
    
          console.log('CSV Data:', rowData);
          rows.push(rowData);
        })
        .on('end', () => resolve(rows))
        .on('error', reject);
    });
    // Upload PDF and get its ObjectId
    const pdfObjectId = await savePdfToDatabase(pdfFilename, pdfFileType, pdfFilePath);


    // Process each row
    for (const data of csvRows) {
      try {
        if (data.Name && data.MobileNumber) {
          // 'Name' and 'MobileNumber' fields exist, save in Customer model
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
        } else {
          // 'Name' or 'MobileNumber' is missing, save in new collection 'TicketEventData'
          const ticketEventData = new TicketEventData({
            csvRow: data,
            uploadedCsv: csv._id,
            uploadedPdf: pdfObjectId,
            status: 'pending', // You can set a default status here if needed
          });
          await ticketEventData.save();
          console.log('TicketEventData saved:', ticketEventData); 
        }
      } catch (error) { 
        console.error('Error saving user or TicketEventData:', error);
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