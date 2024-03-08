const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: String,
    mobileNumber: String,
    status: { type: String, default: 'pending' },
    uploadedPdf: { type: mongoose.Schema.Types.ObjectId, ref: 'Pdf' },
    generatedPdf: { type: mongoose.Schema.Types.ObjectId, ref: 'GeneratedPdf', default: null },
    message: String, // New field for storing WhatsApp message
    qrCode: { type: mongoose.Schema.Types.ObjectId, ref: 'QRCode', default: null }
}, { 
    collection: 'customers', 
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } 
});

const Customer = mongoose.model('Customer', customerSchema); 

module.exports = Customer;
