const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const GeneratedPdf = require('./models/GeneratedPdf');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');


const sendWhatsAppMessage = async (mobileNumber, pdfData, pdfFilename) => {
    
    // Create an instance of FormData
    const form = new FormData();

    // Append the PDF file to the form
    form.append('file', pdfData, { filename: pdfFilename });

    // Append the mobile number as a form field
    form.append('body', JSON.stringify({
        "whatsapp_number": "919703115918", // Assuming this is your WhatsApp number
        "phone_number_id": "105264415758485", // Assuming this is the phone number ID
        "template": {
            "template_name": "test_event_ticket_pdf",
            "variables": [],
            "user_phone": mobileNumber
        }
    }));

    try {
        // Axios request with form-data
        const response = await axios.post('https://zotiapi.omnileadz.com/zotibot/ext/triggerTemplateMessageWithMedia', form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        console.log('Success:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        throw error;
    }
};

const getProcessedCustomersDetails = async function* () {
    try {
        // Select all customers with status processed
        const processedCustomers = await Customer.find({ status: 'processed' }).populate('generatedPdf');
        console.log('Found processed customers:', processedCustomers);

        // Iterate over each processed customer
        for (const customer of processedCustomers) {

            const name = customer.name;

            // Get the phone number of each customer from the db
            const phoneNumber = customer.mobileNumber;

            const generatedPdf = customer.generatedPdf;


            // Get the generated pdf path of the customer from the generatedPdf model
            // Get the PDF file path
            const pdfPath = generatedPdf.filePath;
            const pdfFilename = generatedPdf.filename;


            // If no generated pdf path is found for the customer, skip to the next customer
            if (!pdfPath) {
                console.log('No PDF path found for customer, skipping');
                continue;
            }

            // // If the PDF file does not exist, skip to the next customer
            // if (!fs.existsSync(pdfPath)) {
            //     console.log('PDF file does not exist, skipping');
            //     continue;
            // }

            // Read the PDF file
            const pdfData = fs.readFileSync(pdfPath);
            console.log('pdf path:',pdfPath);

            // Convert the PDF file to base64
            // const pdfBase64 = pdfData.toString('base64');

            // Construct the WhatsApp message
            // const message = `Dear ${name}, your PDF is ready for download.`;

            // Yield the details of the customer along with the PDF data
            yield {
                name,
                phoneNumber,
                pdfData,
                pdfFilename,
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
            console.log('Processing customer:', customer);
            const { name, phoneNumber, customerId, pdfData, pdfFilename } = customer;

            if (!pdfData) {
                continue;
            }

            // Send a WhatsApp message to the customer with the PDF file and message
            const sentMessage = await sendWhatsAppMessage(phoneNumber, pdfData, pdfFilename);

            // Update the status field in the Customer model to "sent"
            await Customer.findOneAndUpdate({ _id: customerId }, { status: 'sent' });

            console.log(`WhatsApp message sent to customer with ID ${customerId}`);
        }
        console.log('WhatsApp messages sent successfully.');

    } catch (error) {
        console.error('Error sending WhatsApp messages:', error);
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
