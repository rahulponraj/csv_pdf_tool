const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const { parse } = require('papaparse');

// Function to fill PDF fields with data from CSV rows
async function fillPDF(pdfPath, csvFilePath) {
  // Read the PDF file
  const pdfBytes = await fs.readFile(pdfPath);

  // Read CSV file
  const csvFile = await fs.readFile(csvFilePath, 'utf-8');
  const { data } = parse(csvFile, { header: true });

  // Iterate over each row in the CSV
  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    // Check if any values are present in the row
    if (Object.values(row).some((value) => value.trim() !== '')) {
      // Load the PDF template for each customer
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      // Fill PDF fields with row values
      for (let j = 0; j < Object.keys(row).length; j++) {
        const header = `[header${j + 1}]`;
        const value = `[value${j + 1}]`;
        const headerField = form.getTextField(header);
        const valueField = form.getTextField(value);

        // Fill PDF fields
        headerField.setText(Object.keys(row)[j]);
        valueField.setText(row[Object.keys(row)[j]]);
      }

      // Save the modified PDF for each user
      const filledPdfBytes = await pdfDoc.save();
      await fs.writeFile(`customer1_${i + 1}_filled.pdf`, filledPdfBytes);
    }
  }

  console.log('PDFs filled and saved successfully');
}

// Example PDF and CSV file paths
const pdfPath = 'Radison Ticket.pdf';
const csvFilePath = 'fields_cust.csv';

// Fill the PDF fields with data from the CSV rows
fillPDF(pdfPath, csvFilePath).catch((err) => {
  console.error('Error filling PDF:', err);
});
