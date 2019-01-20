const AWS = require("aws-sdk");

exports.handler = function(event, context) {
  const request = event.request;
  console.log('Request is', JSON.stringify(request));
  
  if (request.type === 'LaunchRequest') {
    const response = generateResponse(buildSpeechletResponse("Okay, go ahead.", false));
    console.log('response', JSON.stringify(response));
    context.succeed(response);
  } else if (request.type === 'IntentRequest') {
    if (request.intent.name === 'ThatsAll') {
      const response = generateResponse(buildSpeechletResponse("Okay, done.", true));
      console.log('response', JSON.stringify(response));
      context.succeed(response);
    } else if (request.dialogState === 'STARTED' ||
      request.dialogState === 'IN_PROGRESS') {
      const response = generateResponse({ directives: [{ type: "Dialog.Delegate", shouldEndSession: false }]})
      console.log('response', JSON.stringify(response));
      context.succeed(response);
    } else {
      const params = {
      Destination: {
        ToAddresses: ['dtstutz@gmail.com']
      },
      Message: {
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: 'Intent: ' + JSON.stringify(request.intent)
          }
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Subject"
        }
      },
      Source: "Alexa Log skill <dtstutz@gmail.com>"
    };
  
    const sendPromise = new AWS.SES({ apiVersion: "2010-12-01" })
      .sendEmail(params)
      .promise();
  
    sendPromise
      .then(data => {
        console.log('Successful send.  MessageId: ', data.MessageId);
        const response = generateResponse(buildSpeechletResponse("Okay, more?", false));
        console.log('response', JSON.stringify(response));
        context.succeed(response);
      })
      .catch(err => {
        console.error(err, err.stack);
        context.done(null, "Failed");
      });
    }
  }
};


const buildSpeechletResponse = (outputText, shouldEndSession) => {
  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    shouldEndSession: shouldEndSession
  }
};

const generateResponse = (speechletResponse) => {
  return {
    version: "1.0",
    response: speechletResponse
  }
};