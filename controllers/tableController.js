const csvParser = require('csv-parser');
const fs = require('fs');
const Pdf = require('../models/Pdf');
const Csv = require('../models/Csv');

const parseCsvAndGetCustomerCount = async (csvFilePath) => {
  try {
    const customers = [];
    // Read the CSV file and parse its content
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', (data) => {
          // Process each row of the CSV file
          customers.push(data);
        })
        .on('end', () => resolve())
        .on('error', (error) => reject(error));
    });
    // Return the count of customers
    return customers.length;
  } catch (error) {
    console.error('Error parsing CSV file:', error);
    throw error;
  }
};

const renderTable = async (req, res) => {
  try {
    // Fetch PDF file details from the database
    const pdfFiles = await Pdf.find();
    // Fetch CSV file details from the database
    const csvFiles = await Csv.find();

    // Map file paths to URLs for PDF files
    const pdfUrls = pdfFiles.map(pdf => {
      return {
        filename: pdf.filename,
        url: `/${pdf.filePath.replace(/\\/g, '/')}`
      };
    });

    // Map file paths to URLs for CSV files and get customer counts
    const csvUrls = await Promise.all(csvFiles.map(async csv => {
      const customerCount = await parseCsvAndGetCustomerCount(csv.filePath);
      return {
        filename: csv.filename,
        uploadDate: csv.uploadDate,
        url: `/${csv.filePath.replace(/\\/g, '/')}`,
        customerCount: customerCount
      };
    }));

    // Render the table.ejs template with the PDF and CSV file URLs
    res.render('table', { pdfUrls, csvUrls });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { renderTable };
