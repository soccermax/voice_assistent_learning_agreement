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
          uri: "https://webhook.jovo.cloud/d130af5c-773b-47e1-b593-5b7bd675ed2a", // Simply place your Jovo Webhook URL here
          sslCertificateType: "Wildcard"
        },
      }
    }
  },
  googleAction: {
    nlu: "dialogflow",
  },
  endpoint: "${JOVO_WEBHOOK_URL}",
};
