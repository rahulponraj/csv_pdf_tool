const { exec } = require('child_process');
const path = require('path');

// Get the full path to the image file
const imagePath = path.join(__dirname, 'oak.jpg');

exec(`curl --location 'https://zoti.bizwudi.com/zotibot/ext/triggerTemplateMessageWithMedia' \
--form 'file=@"${imagePath}"' \
--form 'body="{\"whatsapp_number\": \"919703115918\",
  \"phone_number_id\": \"105264415758485\",
  \"template\": {
    \"template_name\": \"test_event_ticket\",
    \"variables\": [],
    \"user_phone\":\"918281179172\"
  }
}"'`, (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.error(`stderr: ${stderr}`);
});
