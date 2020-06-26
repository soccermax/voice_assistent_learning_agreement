"use strict";
const admin = require("firebase-admin");
const NOT_EVALUATED_DATE = new Date("01.01.1970");

const filterLearningAgreementForNewOnces = (learningAgreements) => {
  const newLearningAgreements = {};
  for (const key in learningAgreements) {
    const learningAgreement = learningAgreements[key];
    const lastEvaluatedTimeStamp = new admin.firestore.Timestamp(
      learningAgreement.lastEvaluatedOn._seconds,
      learningAgreement.lastEvaluatedOn._nanoseconds
    );
    if (!learningAgreement.approved && lastEvaluatedTimeStamp.isEqual(admin.firestore.Timestamp.fromDate(NOT_EVALUATED_DATE))) {
      newLearningAgreements[key] = learningAgreement;
    }
  }
  return newLearningAgreements;
};


const filterLearningAgreementForChangedOnces = (learningAgreements) => {
    const modifiedLearningAgreements = {};
    for (const key in learningAgreements) {
      const learningAgreement = learningAgreements[key];
      const lastEvaluatedTimeStamp = new admin.firestore.Timestamp(
        learningAgreement.lastEvaluatedOn._seconds,
        learningAgreement.lastEvaluatedOn._nanoseconds
      );
      const lastModifiedTimeStamp = new admin.firestore.Timestamp(
        learningAgreement.lastModifiedOn._seconds,
        learningAgreement.lastModifiedOn._nanoseconds
      );
      if (!learningAgreement.approved && !lastEvaluatedTimeStamp.isEqual(admin.firestore.Timestamp.fromDate(NOT_EVALUATED_DATE)) && lastModifiedTimeStamp.toMillis() > lastEvaluatedTimeStamp.toMillis()) {
        modifiedLearningAgreements[key] = learningAgreement;
      }
    }
    return modifiedLearningAgreements;
  };

  const convertLearningAgreementArrayToObject = (learningAgreements) =>{
      const result = {};
      learningAgreements.forEach((learningAgreement, index) => {
        result[index + 1] = learningAgreement;
      });
     return result;
  }

module.exports = {
  filterLearningAgreementForNewOnces,
  filterLearningAgreementForChangedOnces,
  convertLearningAgreementArrayToObject
};
