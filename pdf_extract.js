const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const { parse } = require('papaparse');
const fontkit = require('@pdf-lib/fontkit');

// Function to create a new PDF
async function createPDF(csvFilePath) {
  // Load existing PDF
  const existingPdfBytes = await fs.readFile('Blank Ticket_Full.pdf');
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  // Register fontkit
  pdfDoc.registerFontkit(fontkit);

  // Get the first page
  const page = pdfDoc.getPages()[0];

  // Register Helvetica font
  const fontBytes = await fs.readFile('./fonts/BarlowCondensed-Medium.ttf');
  const helveticaFont = await pdfDoc.embedFont(fontBytes);

  // Define X and Y coordinates for starting point
  let x = 35;
  let y = 290;

  // Read CSV file
  const csvFile = await fs.readFile(csvFilePath, 'utf-8');
  const { data } = parse(csvFile, { header: true });

    // Print headers and data
   // Blue for headers
  Object.keys(data[0]).forEach((header) => {
    page.setFontColor(rgb(0, 0, 1));
    page.setFontSize(12); // Blue for headers
    page.drawText(header, { x, y, font: helveticaFont,size: 12, bold: true, color: rgb(32 / 255, 75 / 255, 106 / 255)  });
    y -= 14; // Adjust this value based on the spacing between headers and values
    page.setFontColor(rgb(0, 0, 0));
    page.setFontSize(14); // Black for values
    data.forEach((entry) => {
      const value = entry[header] || '';
      page.drawText(value, { x, y, font: helveticaFont });
      y -= 12; // Adjust this value based on the spacing between entries
    });
  });

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  await fs.writeFile('output5_pdf.pdf', pdfBytes);
}

// Example CSV file path
const csvFilePath = 'fields_cust.csv';

// Create the PDF
createPDF(csvFilePath).then(() => {
  console.log('PDF created successfully');
}).catch((err) => {
  console.error('Error creating PDF:', err);
});
