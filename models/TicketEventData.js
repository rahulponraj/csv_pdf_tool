const mongoose = require('mongoose');

const ticketEventDataSchema = new mongoose.Schema({
    csvRow: { type: mongoose.Schema.Types.Mixed }, // Store the CSV row as a JSON object
    uploadedCsv: { type: mongoose.Schema.Types.ObjectId, ref: 'Csv' }, // Reference to the original CSV file
    status: { type: String, default: 'pending' },
    generatedPdf: { type: mongoose.Schema.Types.ObjectId, ref: 'GeneratedPdf', default: null },
    message: String, // New field for storing WhatsApp message
    qrCode: { type: mongoose.Schema.Types.ObjectId, ref: 'QRCode', default: null },
    // Add other fields from the Customer model as needed
}, {
    collection: 'ticket_event_data',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

const TicketEventData = mongoose.model('TicketEventData', ticketEventDataSchema);

module.exports = TicketEventData;
