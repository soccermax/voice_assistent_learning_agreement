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
      },
      publishingInformation: {
        automaticDistribution: {
          isActive: false
        },
        category: "EDUCATION_AND_REFERENCE",
        distributionCountries: [
          "DE"
        ],
        isAvailableWorldwide: false,
        locales: {
          "de-DE": {
            description: "Intuitiver Alexa Skill für das bearbeiten von Learning Agreements.",
            examplePhrases: [
              "Alexa starte learning agreement"
            ],
            keywords: [
              "learning",
              "agreement",
              "education",
              "smart",
              "Study"
            ],
            largeIconUri: "https://via.placeholder.com/512/09f/09f.png",
            name: "Learning Agreement Assistent",
            smallIconUri: "https://via.placeholder.com/108/09f/09f.png",
            summary: "Intuitiver Alexa Skill für das bearbeiten von Learning Agreements."
          }
        },
        testingInstructions: "the skill is part of a university project. The skill required to be registered at the university."
      }
    }
  },
  googleAction: {
    nlu: "dialogflow",
  },
  endpoint: "https://europe-west3-happystudyplanner.cloudfunctions.net/voiceAssistent",
};
