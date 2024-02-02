const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const app = express();



// MongoDB setup
mongoose.connect("mongodb://127.0.0.1:27017/pdftool", {
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
    cb(null, file.originalname); // Keep the original filename
  }
});

const upload = multer({ storage: storage });

// Import controllers
const uploadController = require('./controllers/uploadController');

// File upload endpoint
app.post('/upload', upload.fields([{ name: 'csv', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), uploadController.handleFileUpload);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
