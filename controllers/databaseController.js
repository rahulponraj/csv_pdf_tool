const csvParser = require('csv-parser');
const fs = require('fs');
const { promisify } = require('util');
const User = require('../models/User');

const parseCSVAndStoreInDatabase = async (csvFilePath) => {
  try {
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

    // Process each row
    for (const data of csvRows) {
      try {
        const user = new User({
          name: data.name,
          mobileNumber: data.mobileNumber,
          status: 'pending',
        });

        await user.save();
        results.push(user);
        console.log('User saved:', user);
      } catch (error) {
        console.error('Error saving user to the database:', error);
      }
    }

    console.log('CSV parsing and storing in the database done.');
    console.log('Final Parsed Results:', results);
    console.log('Returning results:', results);
    return results;
  } catch (error) {
    console.error('Error parsing CSV and storing in the database:', error);
    throw error;
  }
};
const updateStatusToProcessed = async (userId, updatedPdfPath) => {
  try {
    const user = await User.findByIdAndUpdate(userId, { status: 'processed', pdfPath: updatedPdfPath });
    console.log(`User with ID ${userId} marked as processed with updated PDF path.`);
    return user;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};
const updateUserPdfPath = async (userId, pdfPath) => {
  try {
    const user = await User.findByIdAndUpdate(userId, { pdfPath });
    console.log(`PDF Path updated for user ID ${userId}: ${pdfPath}`);
    return user;
  } catch (error) {
    console.error('Error updating user PDF path:', error);
    throw error;
  }
};

module.exports = { parseCSVAndStoreInDatabase, updateStatusToProcessed, updateUserPdfPath };