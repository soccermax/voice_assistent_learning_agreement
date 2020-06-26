"use strict";

const admin = require("firebase-admin");
const serviceAccount = require("./credentials-firebase.json");

const collections = {
    LEARNING_AGREEMENT: "learningAgreement",
    USER: "user",
    UNIVERSITY: "university",
    COURSE: "course"
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const getLearningAgreementsForUserWithEmail = async (email) => {
  const learningAgreements = [];
  try {
    const responsibleId = await getUserIDByEmail(email);
    if (responsibleId === null) {
      return;
    }
    (await db.collection(collections.LEARNING_AGREEMENT).where("responsible", "==", responsibleId).get()).forEach(
      (learningAgreementRef) => {
        const learningAgreement = learningAgreementRef.data();
        learningAgreement.id = learningAgreementRef.id;
        learningAgreements.push(learningAgreement);
      }
    );
    for (const learningAgreement of learningAgreements) {
      const [student, targetUniversity] = await Promise.all([
        getUserById(learningAgreement.student),
        getUniversityById(learningAgreement.targetUniversity),
      ]);
      learningAgreement.student = student;
      learningAgreement.targetUniversity = targetUniversity;
      for (const course of learningAgreement.courses) {
        const [courseHomeUniversity, courseTargetUniversity] = await Promise.all([
          getCourseById(course.courseHomeUniversity),
          getCourseById(course.courseTargetUniversity),
        ]);
        course.courseHomeUniversity = courseHomeUniversity;
        course.courseTargetUniversity = courseTargetUniversity;
      }
    }
    return learningAgreements;
  } catch (err) {
    console.error(err);
    return null;
  }
};

const getUserIDByEmail = async (email) => {
  try {
    const data = (await db.collection(collections.USER).where("email", "==", email).get()).docs;
    return data[0] ? data[0].id : null;
  } catch (err) {
    console.error(err);
    return null;
  }
};

const getUserById = async (id) => {
  return _getDocumentById(collections.USER, id);
};

const getCourseById = async (id) => {
  return _getDocumentById(collections.COURSE, id);
};

const getUniversityById = async (id) => {
  return _getDocumentById(collections.UNIVERSITY, id);
};

const setLearningAgreementStatus = async(id, status) => {
    try {
       await db.collection(collections.LEARNING_AGREEMENT).doc(id).update({approved: status, lastEvaluatedOn: admin.firestore.FieldValue.serverTimestamp()});
    } catch(err) {
        console.error(err);
    }
}

const _getDocumentById = async (collection, id) => {
  try {
    const course = await db.collection(collection).doc(id).get();
    if (!course.exists) {
      return null;
    }
    return course.data();
  } catch (err) {
    console.error(err);
    return null;
  }
};

module.exports = {
  getLearningAgreementsForUserWithEmail,
  setLearningAgreementStatus
};
