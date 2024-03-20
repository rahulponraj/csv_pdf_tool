const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const app = express();
const path = require('path');
const fs = require('fs').promises; // Import fs with promises
const generatedPdf = require('./models/GeneratedPdf');
const Customer = require('./models/Customer');
const Pdf = require('./models/Pdf');
const Csv = require('./models/Csv');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');




// MongoDB setup
mongoose.connect("mongodb+srv://rahulponraj:secretmongo@cluster0.rdefuhv.mongodb.net/", { 
  useNewUrlParser: true,
})
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Set the view engine to use EJS
app.set('view engine', 'ejs');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Set the correct MIME type for CSS files
app.use('/css', express.static(path.join(__dirname, 'public/css'), { 'extensions': ['css'] }));

// Define a custom storage engine for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const currentDate = new Date().toISOString().slice(0, 10); // Get current date (YYYY-MM-DD format)
    const originalFilename = path.parse(file.originalname).name; // Extract filename without extension
    const fileExtension = path.extname(file.originalname); // Extract file extension
    
    // Generate a random string (6 characters) to add uniqueness
    const randomString = Math.random().toString(36).substring(2, 8);
    
    // Concatenate original filename with current date, random string, and file extension
    const newFilename = `${originalFilename}_${currentDate}_${randomString}${fileExtension}`;
    cb(null, newFilename);
  }
});

  
  const upload = multer({ storage: storage });

  // Import controllers
const uploadController = require('./controllers/uploadController');
const tableController = require('./controllers/tableController');
const { parseCSVAndStoreInDatabase } = require('./controllers/databaseController');
const GeneratedPdf = require('./models/GeneratedPdf');


app.post('/upload', upload.fields([{ name: 'csv', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), async (req, res) => {
  try {
    // Handle file uploads...
    console.log('File upload started...');

    const csvFile = req.files['csv'] ? req.files['csv'][0] : null;
    const pdfFile = req.files['pdf'] ? req.files['pdf'][0] : null;

    if (!csvFile || !pdfFile) {
      return res.status(400).json({ success: false, error: 'CSV and PDF files are required.' });
    }
    console.log('Start parsing CSV and storing in the database...');
    const csvData = await parseCSVAndStoreInDatabase(csvFile.path, pdfFile.originalname, 'pdf', pdfFile.path);
    console.log('CSV parsing and storing in the database done.');
    console.log('Checking csvData length:', csvData.length);
    console.log('CSV Data Type:', typeof csvData);
    console.log('CSV Data Length:', csvData.length);
    console.log('File Upload Completed');

    // // Fetch pending customers
    // const pendingCustomerGenerator = getCustomersWithPendingStatus();

    // // Process each pending customer sequentially with a delay
    // for await (const customer of pendingCustomerGenerator) {
    //   // Process customer...
    //   await generatePDFForCustomer(customer);
      
    //   // Add a delay of 5 seconds before processing the next customer
    //   await new Promise(resolve => setTimeout(resolve, 2000));
    // }
    res.status(200).json({
      success: true,
      data: { csvFile: csvFile.originalname, pdfFile: pdfFile.originalname }
    });  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).send('Internal Server Error');
  }
});

  // Route handler to render the main.ejs file
  app.get('/',async (req, res) => {
   // Render the main.ejs template with the PDF file data, number of customers, and results
    res.render('main');
    
  });
  app.get('/files', tableController.renderTable); 
 
// Serve files from the '/uploads' directory 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// const getCustomersWithPendingStatus = async function* () {
//   try {
//     const customers = await Customer.find({ status: 'pending' });
//     console.log('pending customers:', customers);

//     for (const customer of customers) {
//       yield customer;
//     }
//   } catch (error) {
//     console.error('Error fetching customers with pending status:', error);
//     throw error;
//   }
// };


// const generatePDFForCustomer = async (customer) => {
//   try {
//     console.log(`Generating PDF for customer: ${customer.name}`);

//     // Fetch the uploaded PDF template from the database based on the ObjectId stored in customer.uploadedPdf
//     const uploadedPdf = await Pdf.findById(customer.uploadedPdf);
//     if (!uploadedPdf) {
//       console.error('Uploaded PDF template not found for customer:', customer.name);
//       return; // Stop processing if uploaded PDF template is not found
//     }

//     // Create a directory named "generated_pdfs" if it doesn't exist
//     const generatedPdfDir = path.join(__dirname, '.', 'generated_pdfs');
//     await fs.mkdir(generatedPdfDir, { recursive: true });

//     // Load the uploaded PDF template for the customer
//     const pdfBuffer = await fs.readFile(uploadedPdf.filePath);
//     const pdfDoc = await PDFDocument.load(pdfBuffer);

//     // Register fontkit
//     pdfDoc.registerFontkit(fontkit);

//     // Customize the PDF template with customer data
//     const { name, mobileNumber } = customer;

//     // Set the font and size for the text
//     const fontBytes = await fs.readFile('./fonts/BarlowCondensed-Bold.ttf'); // Replace with the actual path to the font file
//     const font = await pdfDoc.embedFont(fontBytes);

// // Set the position for the name and mobile number
// const nameX = 35;
// const nameY = 275;
// const mobileNumberX = 35;
// const mobileNumberY = 63;

// // Get the first page of the PDF
// const page = pdfDoc.getPage(0);

// // Draw the text on the page
// page.drawText(name, { x: nameX, y: nameY, font, size: 14, color: rgb(0, 0, 0) });
// page.drawText(mobileNumber, { x: mobileNumberX, y: mobileNumberY, font, size: 14, color: rgb(0, 0, 0) });

//     // Save the generated PDF in the "generated_pdfs" folder with a unique filename for each customer
//     const currentDate = new Date();
//     const formattedDate = currentDate.toISOString().replace(/:/g, "-").replace(/\..+/, "");
//     const filename = `customer_${customer.name}_${formattedDate}.pdf`;
//     const customerPdfPath = path.join(generatedPdfDir, filename);
//     await fs.writeFile(customerPdfPath, await pdfDoc.save());

//     // Save the generated PDF to the database
//     const pdfRecord = new generatedPdf({
//       customer: customer._id,
//       filename: filename,
//       fileType: 'pdf',
//       filePath: customerPdfPath,
//       // Save the PDF content here if needed
//     });
//     const savedPdf = await pdfRecord.save();

//     // Update the customer document with the ObjectId of the generated PDF
//     await Customer.findByIdAndUpdate(customer._id, { generatedPdf: savedPdf._id });
//     // Update customer status to 'processed' and store the path
//     await updateStatusToProcessed(customer._id, customerPdfPath);
//     console.log(`Generated PDF for customer: ${customer.name}`);
//   } catch (error) {
//     console.error(`Error generating PDF for customer: ${customer.name}`, error);
//     // Consider how you want to handle errors
//   }
// };
// const updateStatusToProcessed = async (userId, updatedPdfPath) => { 
//   try {
//     const user = await Customer.findByIdAndUpdate(userId, { status: 'processed', pdfPath: updatedPdfPath });
//     console.log(`User with ID ${userId} marked as processed with updated PDF path.`);
//     return user;
//   } catch (error) {
//     console.error('Error updating user status:', error);
//     throw error;
//   }
// };
// Serve static files from the 'generated_pdfs' folder
app.use('/pdfs', express.static(path.join(__dirname, 'generated_pdfs')));
// Define a route handler for serving PDF files
app.get('/pdfs/:id', async (req, res) => { 
  try {
      const pdf = await GeneratedPdf.findById(req.params.id);
      if (!pdf) {
          res.status(404).send('File not found');
          return;
      }
      res.sendFile(pdf.filePath);
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
});
// Define a route handler for serving uploaded files
app.get('/uploads/:id', async (req, res) => {
  try {
      const file = await Pdf.findById(req.params.id);
      if (!file) {
          res.status(404).send('File not found');
          return;
      }
      const absolutePath = path.resolve(__dirname, file.filePath); // Resolve the file path
      res.sendFile(absolutePath);
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
});
app.get('/customerTable', async (req, res) => {
  try {
      const customers = await Customer.find().populate('uploadedPdf generatedPdf');
      const customersWithUrls = customers.map(customer => {
          const uploadedPdfUrl = customer.uploadedPdf ? `/uploads/${customer.uploadedPdf._id}` : null;
          const generatedPdfUrl = customer.generatedPdf ? `/pdfs/${customer.generatedPdf._id}` : null;
          return {
              _id: customer._id,
              name: customer.name,
              mobileNumber: customer.mobileNumber,
              message:customer.message,
              status: customer.status,
              uploadedPdfUrl,
              uploadedPdfFilename: customer.uploadedPdf ? customer.uploadedPdf.filename : null,
              generatedPdfUrl,
              generatedPdfFilename: customer.generatedPdf ? customer.generatedPdf.filename : null,
              createdAt: customer.createdAt,
              updatedAt: customer.updatedAt
          };
      });
      res.render('customerTable', { customers: customersWithUrls });
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
});


  // Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`); 
});