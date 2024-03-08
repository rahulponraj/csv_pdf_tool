const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const GeneratedPdf = require('./models/GeneratedPdf');
const fs = require('fs').promises;


const sendWhatsAppMessage = async (customerId, message) => {
    // Call your WhatsApp API here to send a message to the specified customer ID
    // Replace this with the actual implementation using your WhatsApp API
    console.log(`Sending WhatsApp message to customer with ID ${customerId}: ${message}`);
  
    return message; // Return the message content
};

// Define the function to get processed customers' details
const getProcessedCustomersDetails = async function* () {
    try {
      // Select all customers with status processed
      const processedCustomers = await Customer.find({ status: 'processed' });
  
      // Iterate over each processed customer
      for (const customer of processedCustomers) {

        const name = customer.name;
        
        // Get the phone number of each customer from the db
        const phoneNumber = customer.mobileNumber;
  
        // Get the generated pdf ID of the customer from the db
        const generatedPdfId = customer.generatedPdf;
  
        // If no generated pdf ID is found for the customer, skip to the next customer
        if (!generatedPdfId) {
          continue;
        }
  
        // Construct the PDF URL
        const pdfUrl = `http://localhost:3000/pdfs/${generatedPdfId}`;

         // Construct the WhatsApp message
         const message = `Dear ${name}, your PDF is ready for download.`;
         // You can download it from the following link: ${pdfUrl}

  
        // Yield the details of the customer along with the PDF URL
        yield {
            name,
          phoneNumber,
          pdfUrl,
          message,
          customerId: customer._id.toString(),
        };
      }
    } catch (error) {
      console.error('Error retrieving processed customers details:', error); 
      throw error;
    }
  };
  
  
  const sendPDFDetailsViaWhatsApp = async () => {
    try {
        const customersDetails = await getProcessedCustomersDetails();
 
        for await (const customer of customersDetails) {
            const { name, customerId, pdfUrl } = customer;

            if (!pdfUrl) {
                continue;
            } 

            const message = `Dear ${name}, your PDF is ready for download.`;
            // You can download it from the following link: ${pdfUrl}`

            // Send a WhatsApp message to the customer with the PDF URL and message
            const sentMessage = await sendWhatsAppMessage(customerId, pdfUrl, message);

            // Update the message field in the Customer model with the sent message
            await Customer.findOneAndUpdate({ _id: customerId }, { message: message }); 
 
            // Update the status field in the Customer model to "sent"
            await Customer.findOneAndUpdate({ _id: customerId }, { status: 'sent' });

            console.log(`WhatsApp message sent to customer with ID ${customerId}: ${sentMessage}`);
        }

        console.log('WhatsApp messages sent successfully.'); 
    } catch (error) {
        console.error('Error sending WhatsApp messages:', error);
        throw error;
    }
};


// MongoDB setup
mongoose.connect("mongodb+srv://rahulponraj:secretmongo@cluster0.rdefuhv.mongodb.net/", { useNewUrlParser: true })
  .then(() => {
    console.log('Connected to MongoDB');
    sendPDFDetailsViaWhatsApp().then(() => {
      console.log('Processing completed'); 
      mongoose.connection.close(); // Close the MongoDB connection when processing is completed
    }); 
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
