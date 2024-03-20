const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const csv = require('csv-parser');

// Load the PDF file
const pdfFilePath = 'Ticket Format With Multiple Fields (1).pdf';
const pdfBytes = fs.readFileSync(pdfFilePath);

// Load the CSV file and fill the form fields
fs.createReadStream('second.csv')
  .pipe(csv())
  .on('data', async (row) => {
    console.log(row);
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the form fields
    const form = pdfDoc.getForm();

    // Fill the form fields with the CSV data
    form.getTextField('name').setText(row.name);
    form.getTextField('venue name').setText(row['venue name']);
    form.getTextField('venue address').setText(row['venue address']);
    form.getTextField('date').setText(row.date);
    form.getTextField('time').setText(row.time);
    form.getTextField('reporting time').setText(row['reporting time']);
    form.getTextField('mobilenumber').setText(row.mobilenumber);

    // Save the filled PDF
    const filledPdfBytes = await pdfDoc.save();
    fs.writeFileSync('output6.pdf', filledPdfBytes);
  })
  .on('end', () => {
    console.log('PDF form fields filled successfully');
  });
