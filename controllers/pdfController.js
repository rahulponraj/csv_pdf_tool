const fs = require('fs').promises;
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const { updateStatusToProcessed } = require('./databaseController');
const Pdf = require('../models/Pdf');

const generatePDFs = async (userList) => {
  console.log('Entering generatePDFs');
  console.log('User List:', userList);
  console.log('User List Type:', typeof userList);
  console.log('User List Length:', userList.length);

  try {
    // Fetch the general PDF template from the database based on the upload date (assuming you want the latest)
    const generalPdf = await Pdf.findOne().sort({ uploadDate: -1 });
    if (!generalPdf) {
      console.error('No general PDF template found');
      return; // Stop processing if no general PDF template is found
    }

    // Create a directory named "generated_pdfs" if it doesn't exist
    const generatedPdfDir = path.join(__dirname, '..', 'generated_pdfs');
    await fs.mkdir(generatedPdfDir, { recursive: true });

    // Loop through userList and generate PDF for each user using the general PDF template...
    for (const user of userList) {
      try {
        console.log(`Processing user ID ${user._id}`);

        // Load the general PDF template for each user
        const pdfBuffer = await fs.readFile(generalPdf.filePath);
        const pdfDoc = await PDFDocument.load(pdfBuffer);

        // Customize the PDF template with user data
        const { name, mobileNumber, _id } = user;

        // Find and fill the "Name" field
        const nameField = pdfDoc.getForm().getTextField('Name');
        if (nameField) {
          nameField.setText(name);
        } else {
          console.error('Field "Name" not found in PDF');
        }

        // Find and fill the "Mobile Number" field
        const mobileNumberField = pdfDoc.getForm().getTextField('Mobile Number');
        if (mobileNumberField) {
          mobileNumberField.setText(mobileNumber);
        } else {
          console.error('Field "Mobile Number" not found in PDF');
        }

        // Save the generated PDF in the "generated_pdfs" folder with a unique filename for each user
        const userPdfPath = path.join(generatedPdfDir, `user_${_id}.pdf`);
        await fs.writeFile(userPdfPath, await pdfDoc.save());

        // Update user status to 'processed' and store the path
        await updateStatusToProcessed(_id, userPdfPath);
        console.log(`Generated PDF for user ID ${_id}: ${userPdfPath}`);

        console.log(`Processed user ID ${user._id}`);
      } catch (error) {
        console.error(`Error processing user ID ${user._id}:`, error.stack);
        // Consider how you want to handle errors
      }
    }
  } catch (error) {
    console.error('Error fetching general PDF template:', error.stack);
    // Consider how you want to handle errors
  }

  console.log('Exiting generatePDFs');
};

module.exports = { generatePDFs };
