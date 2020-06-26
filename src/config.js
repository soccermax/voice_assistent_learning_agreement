"use strict";
// ------------------------------------------------------------------
// APP CONFIGURATION
// ------------------------------------------------------------------

module.exports = {
  logging: {
    request: false,
  },

  intentMap: {
    "AMAZON.StopIntent": "END",
    "AMAZON.YesIntent": "YesIntent",
    "AMAZON.NoIntent": "NoIntent",
  },

  db: {
    Firestore: {
      credential: require("./credentials-firebase.json"),
      databaseURL: "https://happystudyplanner.firebaseio.com",
    },
  },
};
