"use strict";
// ------------------------------------------------------------------
// JOVO PROJECT CONFIGURATION
// ------------------------------------------------------------------

module.exports = {
  alexaSkill: {
    nlu: "alexa",
    manifest: {
      permissions: [
        {
          name: 'alexa::devices:all:notifications:write'
        }
      ],
      events: {
        publications: [
          {
            eventName: 'AMAZON.MessageAlert.Activated'
          },
          {
            eventName: 'AMAZON.WeatherAlert.Activated'
          },
        ],
        endpoint: {
          uri: "https://europe-west3-happystudyplanner.cloudfunctions.net/voiceAssistent", // Simply place your Jovo Webhook URL here
          sslCertificateType: "Wildcard"
        },
      }
    }
  },
  googleAction: {
    nlu: "dialogflow",
  },
  endpoint: "https://europe-west3-happystudyplanner.cloudfunctions.net/voiceAssistent",
};
