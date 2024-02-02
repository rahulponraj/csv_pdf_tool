const fs = require('fs').promises;
const { PDFDocument } = require('pdf-lib');
const { updateStatusToProcessed, updateUserPdfPath } = require('./databaseController');

const generatePDFs = async (userList) => {
  console.log('Entering generatePDFs');

  for (const user of userList) {
    try {
      console.log(`Processing user ID ${user._id}`);

      // Set the correct PDF path for the user
      const pdfPath = `uploads/${user._id}.pdf`;
      console.log(`PDF file path: ${pdfPath}`);

      // Check if the directory exists, create if not
      const dirExists = await fs.access('uploads').then(() => true).catch(() => false);
      if (!dirExists) {
        await fs.mkdir('uploads');
      }

      let pdfDoc;
      try {
        // Load the existing PDF file 
        const pdfBuffer = await fs.readFile(pdfPath);
        pdfDoc = await PDFDocument.load(pdfBuffer);
        console.log(`Loaded existing PDF for user ID ${user._id}`);
      } catch (loadError) {
        // If the file doesn't exist, create a new PDF
        console.log(`Creating a new PDF for user ID ${user._id}`);
        pdfDoc = await PDFDocument.create();
      }

      // Create a new page if needed
      if (pdfDoc.getPages().length === 0) {
        pdfDoc.addPage();
      }

      const page = pdfDoc.getPages()[0];
      const { width, height } = page.getSize();
      const { name, mobileNumber, _id } = user;

      // Customize the PDF template with user data
      page.drawText(`Name: ${name}`, { x: 50, y: height - 100 });
      page.drawText(`Mobile Number: ${mobileNumber}`, { x: 50, y: height - 120 });

      // Save the updated PDF
      await fs.writeFile(pdfPath, await pdfDoc.save());

      // Update user status to 'processed' and store the path
      await updateStatusToProcessed(_id, pdfPath);
      console.log(`Updated PDF for user ID ${_id}: ${pdfPath}`);
      console.log(`Checking if PDF file exists: ${await fs.access(pdfPath).then(() => 'Exists').catch(() => 'Does not exist')}`);

      console.log(`Processed user ID ${user._id}`);
    } catch (error) {
      console.error(`Error processing user ID ${user._id}:`, error.stack);
      // Consider how you want to handle errors
    }
  }

  console.log('Exiting generatePDFs');
};

module.exports = { generatePDFs };
