"use strict";
const admin = require("firebase-admin");

const filterLearningAgreementForNewOnces = (learningAgreements) => {
  const newLearningAgreements = {};
  for (const key in learningAgreements) {
    const learningAgreement = learningAgreements[key];
    if (
      !learningAgreement.approved &&
      learningAgreement.lastEvaluatedOn === null
    ) {
      newLearningAgreements[key] = learningAgreement;
    }
  }
  return newLearningAgreements;
};

const filterLearningAgreementForChangedOnces = (learningAgreements) => {
  const modifiedLearningAgreements = {};
  for (const key in learningAgreements) {
    const learningAgreement = learningAgreements[key];
    const lastEvaluatedTimeStamp = learningAgreement.lastEvaluatedOn === null ? 0 : new admin.firestore.Timestamp(
      learningAgreement.lastEvaluatedOn._seconds,
      learningAgreement.lastEvaluatedOn._nanoseconds
    ).toMillis();
    const lastModifiedTimeStamp = learningAgreement.lastModifiedOn === null ? 0 : new admin.firestore.Timestamp(
      learningAgreement.lastModifiedOn._seconds,
      learningAgreement.lastModifiedOn._nanoseconds
    ).toMillis();
    if (
      !learningAgreement.approved &&
      lastModifiedTimeStamp > lastEvaluatedTimeStamp
    ) {
      modifiedLearningAgreements[key] = learningAgreement;
    }
  }
  return modifiedLearningAgreements;
};

const convertLearningAgreementArrayToObject = (learningAgreements) => {
  const result = {};
  learningAgreements.forEach((learningAgreement, index) => {
    result[index + 1] = learningAgreement;
  });
  return result;
};

module.exports = {
  filterLearningAgreementForNewOnces,
  filterLearningAgreementForChangedOnces,
  convertLearningAgreementArrayToObject,
};
