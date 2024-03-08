const mongoose = require('mongoose');
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const Customer = require('./models/Customer');
const Pdf = require('./models/Pdf');
const fontkit = require('@pdf-lib/fontkit');
const generatedPdf = require('./models/GeneratedPdf');
const qr = require('qrcode');
const QRCode = require('./models/QRCode'); // Import the QRCode model




// MongoDB setup
mongoose.connect("mongodb+srv://rahulponraj:secretmongo@cluster0.rdefuhv.mongodb.net/", {
  useNewUrlParser: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
    processPendingCustomers().then(() => {
      console.log('Processing completed');
      mongoose.connection.close(); // Close the MongoDB connection when processing is completed
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

async function* getCustomersWithPendingStatus() {
  const customers = await Customer.find({ status: 'pending' }).lean().cursor();
  for await (const customer of customers) {
    yield customer;
  }
}
async function processPendingCustomers() {
  // Fetch pending customers
  const pendingCustomerGenerator = getCustomersWithPendingStatus();

  // Create an async iterator from the generator
  const iterator = pendingCustomerGenerator[Symbol.asyncIterator]();

  // Process each pending customer sequentially with a delay
  async function processNextCustomer() {
    const { value, done } = await iterator.next();
    if (done) {
      console.log('Processing customer completed');
      return;
    }

    // Process customer...
    await generatePDFForCustomer(value);

    // Add a delay of 5 seconds before processing the next customer
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Process the next customer
    await processNextCustomer();
  }

  // Start processing the first customer
  await processNextCustomer();
}

const generateQRCode = async (customer) => {
  try {
    const text = `Customer ID: ${customer._id}`;
    const qrCodePath = `qrcodes/${customer._id}.png`;
    await qr.toFile(qrCodePath, text);

    // Save the QR code path in the database or update the customer document
    const qrCode = new QRCode({
      customer: customer._id,
      filePath: qrCodePath,
    });
    const savedQRCode = await qrCode.save();

    // Update the customer document with the QR code ID
    await Customer.findByIdAndUpdate(customer._id, { qrCode: savedQRCode._id });

    return qrCodePath;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// const generateQRCodeForCustomer = async (customer) => {
//   try {
//     // Generate QR code
//     const qrCodePath = await generateQRCode(customer);

//     // Save the QR code path to the QRCode collection
//     const qrCode = new QRCode({ customerId: customer._id, qrCodePath });
//     await qrCode.save();

//     // Update the customer's qrCode field with the QR code ID
//     await Customer.findOneAndUpdate({ _id: customer._id }, { qrCode: qrCode._id });

//     console.log(`QR code generated and saved for customer with ID: ${customer._id}`);
//   } catch (error) {
//     console.error('Error generating QR code:', error);
//     throw error;
//   }
// };

const generatePDFForCustomer = async (customer) => {
  try {
    console.log(`Generating PDF for customer: ${customer.name}`);

    // Fetch the uploaded PDF template from the database based on the ObjectId stored in customer.uploadedPdf
    const uploadedPdf = await Pdf.findById(customer.uploadedPdf);
    if (!uploadedPdf) {
      console.error('Uploaded PDF template not found for customer:', customer.name);
      return; // Stop processing if uploaded PDF template is not found
    }

    // Create a directory named "generated_pdfs" if it doesn't exist
    const generatedPdfDir = path.join(__dirname, '.', 'generated_pdfs');
    await fs.mkdir(generatedPdfDir, { recursive: true });

    // Load the uploaded PDF template for the customer
    const pdfBuffer = await fs.readFile(uploadedPdf.filePath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    // Register fontkit
    pdfDoc.registerFontkit(fontkit);

    // Customize the PDF template with customer data
    const { name, mobileNumber } = customer;

    // Set the font and size for the text
    const fontBytes = await fs.readFile('./fonts/BarlowCondensed-Medium.ttf'); // Replace with the actual path to the font file
    const font = await pdfDoc.embedFont(fontBytes);

    // Set the position for the name and mobile number
    const nameX = 35;
    const nameY = 275;
    const mobileNumberX = 35; 
    const mobileNumberY = 63;

    // Get the first page of the PDF
    const page = pdfDoc.getPage(0);

    // Draw a white rectangle behind the text
    const { width, height } = page.getSize(); 
    page.drawRectangle({
      x: nameX,
      y: nameY, // Invert the Y coordinate to match PDF coordinates
      width: 150, // Adjust the width as needed
      height: 13, // Adjust the height as needed
      color: rgb(1, 1, 1), // White color
      //   borderColor: null, // No border 
      borderWidth: 0, // No border 
    });
    // Draw a white rectangle behind the mobile number
    page.drawRectangle({
      x: mobileNumberX,
      y: mobileNumberY, // Invert the Y coordinate to match PDF coordinates
      width: 150, // Adjust the width as needed
      height: 12, // Adjust the height as needed
      color: rgb(1, 1, 1), // White color
      borderWidth: 0, // No border  
    });

    // Draw a white rectangle behind for image insertion
    page.drawRectangle({
      x: 221,
      y: 222, // Invert the Y coordinate to match PDF coordinates
      width: 83, // Adjust the width as needed
      height: 82, // Adjust the height as needed
      color: rgb(1, 1, 1), // White color 
      borderWidth: 0, // No border          
      // roundedCorner: { radius: 50 } // Radius to round the corners
    });
    // Generate QR code for the customer
    const qrCodePath = await generateQRCode(customer);
    const qrCodeBytes = await fs.readFile(qrCodePath);
    const qrCodeImage = await pdfDoc.embedPng(qrCodeBytes);

    // Draw the QR code on the page
    page.drawImage(qrCodeImage, {
      x: 221,
      y: 222,
      width: 83,
      height: 82,
    });

    // Draw the text on the page
    page.drawText(name, { x: nameX, y: nameY, font, size: 14, color: rgb(0, 0, 0) });
    page.drawText(mobileNumber, { x: mobileNumberX, y: mobileNumberY, font, size: 14, color: rgb(0, 0, 0) });

    // Save the generated PDF in the "generated_pdfs" folder with a unique filename for each customer
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().replace(/:/g, "-").replace(/\..+/, "");
    const filename = `customer_${customer.name}_${formattedDate}.pdf`;
    const customerPdfPath = path.join(generatedPdfDir, filename);
    await fs.writeFile(customerPdfPath, await pdfDoc.save());

    // Save the generated PDF to the database
    const pdfRecord = new generatedPdf({
      customer: customer._id,
      filename: filename,
      fileType: 'pdf',
      filePath: customerPdfPath,
      // Save the PDF content here if needed
    });
    const savedPdf = await pdfRecord.save();

    // Update the customer document with the ObjectId of the generated PDF
    await Customer.findByIdAndUpdate(customer._id, { generatedPdf: savedPdf._id });
    // Update customer status to 'processed' and store the path
    await updateStatusToProcessed(customer._id, customerPdfPath);
    console.log(`Generated PDF for customer: ${customer.name}`);
  } catch (error) {
    console.error(`Error generating PDF for customer: ${customer.name}`, error);
    // Consider how you want to handle errors
  }
};
const updateStatusToProcessed = async (userId, updatedPdfPath) => {
  try {
    const user = await Customer.findByIdAndUpdate(userId, { status: 'processed', pdfPath: updatedPdfPath });
    console.log(`User with ID ${userId} marked as processed with updated PDF path.`);
    return user;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

