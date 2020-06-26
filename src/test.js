"use strict";

const firestore = require("./firestore");
const { filterLearningAgreementForNewOnces, filterLearningAgreementForChangedOnces } = require("./helper");

(async () => {
  const tmp = await firestore.getLearningAgreementsForUserWithEmail("max.grunfelder@gmail.com");

  const tmp2 = {};
  tmp.forEach((learningAgreement, index) => {
    tmp2[index + 1] = learningAgreement;
  });

  const learningAgreements = filterLearningAgreementForChangedOnces(tmp2);
  console.log(learningAgreements);
})();
