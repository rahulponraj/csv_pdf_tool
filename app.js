const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const app = express();
const path = require('path');
const fs = require('fs').promises; // Import fs with promises





// MongoDB setup
mongoose.connect("mongodb+srv://rahulponraj:secretmongo@cluster0.rdefuhv.mongodb.net/", { 
  useNewUrlParser: true,
})
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

app.use(express.static('public'));

// Define a custom storage engine for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const currentDate = new Date().toISOString().slice(0, 10); // Get current date (YYYY-MM-DD format)
    const originalFilename = path.parse(file.originalname).name; // Extract filename without extension
    const fileExtension = path.extname(file.originalname); // Extract file extension

    // Concatenate original filename with current date and file extension
    const newFilename = `${originalFilename}_${currentDate}${fileExtension}`;
    cb(null, newFilename);
  }
});

const upload = multer({ storage: storage });

// Import controllers
const uploadController = require('./controllers/uploadController');

// Serve static files from the 'generated_pdfs' folder
app.use('/pdfs', express.static(path.join(__dirname, 'generated_pdfs')));

// Endpoint to get URLs of generated PDFs
app.get('/pdfs', async (req, res) => {
  const pdfDir = path.join(__dirname, 'generated_pdfs');

  try {
    // Read the contents of the 'generated_pdfs' folder
    const files = await fs.readdir(pdfDir);

    // Generate URLs for each PDF file
    const pdfUrls = files.map(file => `/pdfs/${file}`);

    // Send the array of PDF URLs as a response
    res.json({ pdfUrls });
  } catch (err) {
    console.error('Error reading PDF directory:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// File upload endpoint
app.post('/upload', upload.fields([{ name: 'csv', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), uploadController.handleFileUpload);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
