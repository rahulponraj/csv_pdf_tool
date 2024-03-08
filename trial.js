const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');


const apiEndpoint = 'https://zoti.bizwudi.com/zotibot/ext/triggerTemplateMessageWithMedia';
const mediaFile = './fonts/oak.jpg'; // Path to your media file
const whatsappNumber = '919703115918'; // WhatsApp number to send the message to
const phoneNumberId = '105264415758485'; // Phone number ID
const templateName = 'test_event_ticket'; // Name of the template
const templateVariables = ['var1', 'var2', 'var3']; // Variables for the template
const userPhone = '918281179172'; // User phone number

// Create a new FormData object
const formData = new FormData();
formData.append('file', fs.createReadStream(mediaFile));

// Create the JSON object for the body
const body = {
  whatsapp_number: whatsappNumber,
  phone_number_id: phoneNumberId,
  template: {
    template_name: templateName,
    variables: templateVariables,
    user_phone: userPhone
  }
};

// Append the JSON object to the FormData object
formData.append('body', JSON.stringify(body));

// Send the POST request
axios.post(apiEndpoint, formData, {
  headers: {
    ...formData.getHeaders(),
    //'Content-Type': 'application/json' // Set the Content-Type header to application/json
  }
})
  .then(response => {
    console.log(response);
    console.log('Message sent successfully');
  })
  .catch(error => {
    console.error('Error sending message:', error);
  });
