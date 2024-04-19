const mongoose = require('mongoose');

const generatedEventSchema = new mongoose.Schema({
    ticket_event:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TicketEventData',
        required: true
    },
    filename:String,
    filetype: {
        type: String,
        required: true
    },
    filepath: {
        type: String,
        default: 'generated_pdfs/ticketeventdata_pdfs/'
    }
});

const GeneratedEventPdf = mongoose.model('GeneratedEventPdf', generatedEventSchema);

module.exports = GeneratedEventPdf;