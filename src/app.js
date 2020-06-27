"use strict";

//TODO: add i18n
//TODO: would you like to edit more learning agreements

const { App } = require("jovo-framework");
const { Alexa } = require("jovo-platform-alexa");
const { GoogleAssistant } = require("jovo-platform-googleassistant");
const { JovoDebugger } = require("jovo-plugin-debugger");
const { Firestore } = require("jovo-db-firestore");
const axios = require("axios");

const { getLearningAgreementsForUserWithEmail, setLearningAgreementStatus } = require("./firestore");
const { filterLearningAgreementForNewOnces, filterLearningAgreementForChangedOnces, convertLearningAgreementArrayToObject } = require("./helper");

const askedFor = {
  NEW: "new",
  CHANGED: "changed"
}

const gender = {
  MALE: "male",
  FEMALE: "FEMALE"
}

const app = new App();

app.use(
  new Alexa(),
  new GoogleAssistant(),
  new JovoDebugger(),
  new Firestore()
);

// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------

app.setHandler({
  LAUNCH() {
    return this.toIntent("WelcomeIntent");
  },

  async WelcomeIntent() {
    const token = this.$request.getAccessToken();
    if (token) {
      const userInformation = (await axios.get(`https://api.amazon.com/user/profile?access_token=${token}`)).data;
      this.$session.$data.user = {
        givenName: userInformation.name.split(" ")[0],
        familyName: userInformation.name.split(" ")[1],
        email: userInformation.email,
      };

      this.$session.$data.learningAgreements = {};
      // const learningAgreements = await getLearningAgreementsForUserWithEmail(this.$session.$data.user.email);
      // this.$session.$data.learningAgreements = convertLearningAgreementArrayToObject(learningAgreements)
      const that = this;
      getLearningAgreementsForUserWithEmail(this.$session.$data.user.email).then(learningAgreements => {
        that.$session.$data.learningAgreements = convertLearningAgreementArrayToObject(learningAgreements)
      })

      this.$speech
        .addText(`Willkommen zurück ${this.$session.$data.user.givenName}. Wie kann ich dir helfen?`)
        .addText(
          "Solltest du dich nicht mehr erinnern was ich schon alles kann, sage einfach: Was kannst du schon alles?"
        );
      this.ask(this.$speech);
    } else {
      this.$alexaSkill.showAccountLinkingCard();
      this.$speech
        .addText(
          "Wilkommen zum Learning Agreement Sprachassistenten. Ich kann dich bei den folgenden Dingen unterstützen:"
        )
        .addBreak("300ms")
        .addText("Neue oder geänderte Learning Agreements vorlesen.")
        .addText("Learning Agreements können genehmigt oder mit Kommentar abgelehnt werden.")
        .addText(
          "Damit ich Learning Agreements abzurufen kann, musst du dich zuerst in der Alexa App auf deinem Smartphone anmelden. Bis gleich."
        );
      this.tell(this.$speech);
    }
  },

  afterWelcomeIntent: {
    HelpIntent() {
      this.toStatelessIntent("HelpIntent");
    },

    tellNewLearningAgreements() {
      this.toStatelessIntent("tellNewLearningAgreements");
    },

    tellChangedLearningAgreements() {
      this.toStatelessIntent("tellChangedLearningAgreements");
    },

    Unhandled() {
      this.$speech
        .addText("Das habe ich leider nicht richtig verstanden oder die Funktion wird noch nicht untersützt.")
        .addText("Falls du nicht weiter weißt, kannst du einfach: Kannst du mir helfen - sagen")
      this.ask(this.$speech);
    },
  },

  HelpIntent() {
    const token = this.$request.getAccessToken();
    if (token) {
      this.$speech
        .addText("Folgende Dinge habe ich schon gelernt:")
        .addBreak("300ms")
        .addText(
          "Neue oder geänderte Learning Agreements vorlesen. Sage dazu einfach: Neue Learning Agreements vorlesen oder geänderte Learning Agreements vorlesen."
        )
        .addText("Learning Agreements können genehmigt oder mit Kommentar abgelehnt werden.");
      this.ask(this.$speech);
    } else {
      this.$speech
        .addText("Folgende Dinge habe ich schon gelernt:")
        .addBreak("300ms")
        .addText("Neue oder geänderte Learning Agreements vorlesen.")
        .addText("Learning Agreements können genehmigt oder mit Kommentar abgelehnt werden.")
        .addText(
          "Damit ich Learning Agreements abrufen kann, musst du dich zuerst in der Alexa App auf deinem Smartphone anmelden. Bis gleich."
        );
      this.tell(this.$speech);
    }
  },

  async tellNewLearningAgreements() {
    const token = this.$request.getAccessToken();
    if (!token) {
      this.tell(
        "Um diese Funktionalität nutzen zu können, musst du dich zuerst in der Alexa App auf deinem Smartphone anmleden. Bis gleich."
      );
      this.$alexaSkill.showAccountLinkingCard();
      return;
    }

    const learningAgreements = filterLearningAgreementForNewOnces(this.$session.$data.learningAgreements);
    this.$session.$data.learningAgreements = learningAgreements;
    if (Object.keys(learningAgreements).length === 0) {
      this.tell("Aktuell gibt es keine neuen Learning Agreements. Es wird wohl Zeit für Feierabend. Bis bald!");
      return;
    }

    this.$session.$data.askedFor = askedFor.NEW;

    this.$speech.addText("Folgende unbearbeitete Learning Agreements habe ich gefunden:");
    Object.keys(learningAgreements).forEach((learningAgreement) => {
      const learningAgreementTmp = learningAgreements[learningAgreement];
      this.$speech.addText(
        `Learning Agreement ${learningAgreement} von ${learningAgreementTmp.student.preName} ${learningAgreementTmp.student.name} für die ${learningAgreementTmp.targetUniversity.name} in ${learningAgreementTmp.targetUniversity.country}.`
      );
    });
    this.$speech.addText(
      "Um ein Learning Agreement auszuwählen, sage beispielsweise Learning Agreement eins bearbeiten."
    );
    this.ask(this.$speech);
  },

  async tellChangedLearningAgreements() {
    const token = this.$request.getAccessToken();
    if (!token) {
      this.tell(
        "Um diese Funktionalität nutzen zu können, musst du dich zuerst in der Alexa App auf deinem Smartphone anmleden. Bis gleich."
      );
      this.$alexaSkill.showAccountLinkingCard();
      return;
    }

    const learningAgreements = filterLearningAgreementForChangedOnces(this.$session.$data.learningAgreements);
    this.$session.$data.learningAgreements = learningAgreements;
    if (Object.keys(learningAgreements).length === 0) {
      this.tell("Aktuell gibt es keine geänderten Learning Agreements. Es wird wohl Zeit für Feierabend. Bis bald!");
      return;
    }

    this.$session.$data.askedFor = askedFor.CHANGED;

    this.$speech.addText("Folgende geänderte Learning Agreements habe ich gefunden:");
    Object.keys(learningAgreements).forEach((learningAgreement) => {
      const learningAgreementTmp = learningAgreements[learningAgreement];
      this.$speech.addText(
        `Learning Agreement ${learningAgreement} von ${learningAgreementTmp.student.preName} ${learningAgreementTmp.student.name} für die ${learningAgreementTmp.targetUniversity.name} in ${learningAgreementTmp.targetUniversity.country}.`
      );
    });
    this.$speech.addText(
      "Um ein Learning Agreement auszuwählen, sage beispielsweise Learning Agreement eins bearbeiten."
    );
    this.ask(this.$speech);
  },

  async askLearningAgreement() {
    const token = this.$request.getAccessToken();
    if (!token) {
      this.tell(
        "Um diese Funktionalität nutzen zu können, musst du dich zuerst in der Alexa App auf deinem Smartphone anmleden. Bis gleich."
      );
      this.$alexaSkill.showAccountLinkingCard();
      return;
    }
    const learningAgreementNumber = this.$inputs.learningAgreementNumber.value;
    this.$session.$data.learningAgreementNumber = learningAgreementNumber;
    const learningAgreement = this.$session.$data.learningAgreements[learningAgreementNumber];
    if (!learningAgreementNumber || learningAgreementNumber === "?") {
      this.$speech
        .addText("Das habe ich leider nicht richtig verstanden oder die Funktion wird noch nicht unterstützt.")
        .addText("Falls du nicht weiter weißt, kannst du einfach: Kannst du mir helfen - sagen")
      this.ask(this.$speech);
      return;
    }
    if (!learningAgreement) {
      this.followUpState("wrongLearningAgreementChosen").ask(`Das Learning Agreement ${learningAgreementNumber} existiert nicht. Soll ich dir die verfügbaren Learning Agreements nochmal vorlesen?`);
      return;
    }
    const studentGender = learningAgreement.student.gender;
    this.$speech
      .addText(
        `Du hast das Learning Agreement von ${learningAgreement.student.preName} ${learningAgreement.student.name} ausgewählt.`
      )
      .addBreak("300ms")
      .addText(
        `${learningAgreement.student.preName} möchte die ${learningAgreement.targetUniversity.name}, ${learningAgreement.targetUniversity.country} besuchen.`
      )
      .addText(
        `Das ausgefüllte Learning Agreement von ${studentGender === gender.MALE ? "ihm" : "ihr"} wurde mit einem Score von ${learningAgreement.score}% bewertet.`
      )
      .addText(`Soll ich dir ${studentGender === gender.MALE ? "seine" : "ihre"} ausgewählten Kurse vorlesen?`);
    const reprompt = "Sage bitte ja oder nein.";
    this.followUpState("ReadLearningAgreementCourses").ask(this.$speech, reprompt);
  },

  wrongLearningAgreementChosen: {
    YesIntent() {
      if (this.$session.$data.askedFor === askedFor.NEW) {
        return this.toStatelessIntent("tellNewLearningAgreements");
      } else {
        return this.toStatelessIntent("tellChangedLearningAgreements");
      }
    },

    NoIntent() {
      this.ask("Alles klar, dann sage mir bitte nochmal welches Learning Agreement du bearbeiten willst?");
    },

    askLearningAgreement() {
      this.toStatelessIntent("askLearningAgreement");
    },


    Unhandled() {
      const speech = "Diese Frage lässt sich nur mit ja oder nein beantworten.";
      const reprompt = "Also nochmal nur für dich: Ja oder Nein?";
      this.ask(speech, reprompt);
    },
  },

  learningAgreementValidate: {
    async YesIntent() {
      const learningAgreement = this.$session.$data.learningAgreements[this.$session.$data.learningAgreementNumber];
      const studentGender = learningAgreement.student.gender;
      await setLearningAgreementStatus(learningAgreement.id, true);
      this.$speech.addText(`Alles klar, ich habe das Learning Agreement genehmigt und ${learningAgreement.student.preName} benachrichtigt, dass ${studentGender === gender.MALE ? "er" : "sie"} schonmal die Koffer packen kann.`)
        .addText("Möchtest du noch weitere Learning Agreements bearbeiten?");
      const reprompt = "Möchtest du noch weitere Learning Agreements bearbeiten?"
      this.followUpState("moreLearningAgreements").ask(this.$speech, reprompt);
    },

    async NoIntent() {
      const learningAgreement = this.$session.$data.learningAgreements[this.$session.$data.learningAgreementNumber];
      await setLearningAgreementStatus(learningAgreement.id, false);
      const speech = "Bist du dir sicher? Das wäre schon fies.";
      const reprompt = "Also nochmal nur für dich: Ja oder Nein?";
      this.followUpState("confirmReject").ask(speech, reprompt);
    },

    Unhandled() {
      const speech = "Diese Frage lässt sich nur mit ja oder nein beantworten.";
      const reprompt = "Also nochmal nur für dich: Ja oder Nein?";
      this.ask(speech, reprompt);
    },
  },

  ReadLearningAgreementCourses: {
    YesIntent() {
      const learningAgreement = this.$session.$data.learningAgreements[this.$session.$data.learningAgreementNumber];
      const studentGender = learningAgreement.student.gender;
      this.$speech
        .addText(
          "Alles klar ich nenne immer zuerst den Kurs an der Heimuniversität gefolgt von dem Kurs an der Zieluniversität, los gehts:"
        )
        .addBreak("300ms");
      learningAgreement.courses.forEach((course) => {
        this.$speech.addText(
          `Der Kurs ${course.courseHomeUniversity.name} mit ${course.courseHomeUniversity.creditPoints} Anrechnungspunkten soll für Kurs ${course.courseTargetUniversity.name} mit ${course.courseTargetUniversity.creditPoints} Anrechnungspunkten angerechnet werden.`
        );
      });
      this.$speech.addText(`Das war es auch schon. Was ${studentGender === gender.MALE ? "ein fleißiger Student" : "eine fleißige Studentin"}.`);
      this.$speech.addText("Sollen wir es dann einfach genehmigen ja oder nein?");
      let reprompt = "Also nochmal nur für dich: Ja oder Nein?";
      this.followUpState("learningAgreementValidate").ask(this.$speech, reprompt);
    },

    NoIntent() {
      const speech = "Na dann, wenn es dich nicht interessiert. Sollen wir es dann einfach genehmigen ja oder nein?";
      const reprompt = "Also nochmal nur für dich: Ja oder Nein?";
      this.followUpState("learningAgreementValidate").ask(speech, reprompt);
    },

    Unhandled() {
      let speech = "Diese Frage lässt sich nur mit ja oder nein beantworten.";
      let reprompt = "Also nochmal nur für dich: Ja oder Nein?";
      this.ask(speech, reprompt);
    },
  },

  confirmReject: {
    YesIntent() {
      const learningAgreement = this.$session.$data.learningAgreements[this.$session.$data.learningAgreementNumber];
      const studentGender = learningAgreement.student.gender;
      this.$speech
        .addText(`Alles klar, dann hat der ${studentGender === gender.MALE ? "Student" : "Studentin"} wohl pech und muss Zuhause bleiben!`)
        .addText("Möchtest du noch weitere Learning Agreements bearbeiten?");
      const reprompt = "Möchtest du noch weitere Learning Agreements bearbeiten?"
      this.followUpState("moreLearningAgreements").ask(this.$speech, reprompt);
    },

    NoIntent() {
      const speech =
        "Hmm, das hört sich doch schon besser an. Also was machen wir jetzt mit dem Learning Agreement? Genehmigen ja oder nein?";
      const reprompt = "Also nochmal nur für dich: Ja oder Nein?";
      this.followUpState("learningAgreementValidate").ask(speech, reprompt);
    },

    Unhandled() {
      let speech = "Diese Frage lässt sich nur mit ja oder nein beantworten.";
      let reprompt = "Also nochmal nur für dich: Ja oder Nein?";
      this.ask(speech, reprompt);
    },
  },

  moreLearningAgreements: {
    YesIntent() {
      this.$speech
        .addText("Da ist aber jemand fleißig heute.")
        .addText("Für neue Learning Agreements sage: Neue Learning Agreements vorlesen und für geänderte: Geänderte Learning Agreements vorlesen.");
      const reprompt = "Mögliche Optionen sind: Neue Learning Agreements vorlesen oder Geänderte Learning Agreements vorlesen?"
      this.ask(this.$speech, reprompt);
    },

    NoIntent() {
      const speech =
        "Alles klar. Dann wünsche ich dir noch einen schönen Tag und bis bald.";
      this.tell(speech);
    },

    async tellNewLearningAgreements() {
      this.$session.$data.learningAgreements = {};
      const newLearningAgreements = convertLearningAgreementArrayToObject(await getLearningAgreementsForUserWithEmail(this.$session.$data.user.email));
      const filteredLearningAgreements = filterLearningAgreementForNewOnces(newLearningAgreements);
      this.$session.$data.learningAgreements = filteredLearningAgreements;

      if (Object.keys(filteredLearningAgreements).length === 0) {
        this.tell("Aktuell gibt es keine neuen Learning Agreements. Es wird wohl Zeit für Feierabend. Bis bald!");
        return;
      }

      this.$session.$data.askedFor = askedFor.NEW;


      this.$speech.addText("Folgende unbearbeitete Learning Agreements habe ich gefunden:");
      Object.keys(filteredLearningAgreements).forEach((learningAgreement) => {
        const learningAgreementTmp = filteredLearningAgreements[learningAgreement];
        this.$speech.addText(
          `Learning Agreement ${learningAgreement} von ${learningAgreementTmp.student.preName} ${learningAgreementTmp.student.name} für die ${learningAgreementTmp.targetUniversity.name} in ${learningAgreementTmp.targetUniversity.country}.`
        );
      });
      this.$speech.addText(
        "Um ein Learning Agreement auszuwählen, sage beispielsweise Learning Agreement eins bearbeiten."
      );

      this.ask(this.$speech);
    },

    async tellChangedLearningAgreements() {
      this.$session.$data.learningAgreements = {};
      const newLearningAgreements = convertLearningAgreementArrayToObject(await getLearningAgreementsForUserWithEmail(this.$session.$data.user.email));
      const filteredLearningAgreements = filterLearningAgreementForChangedOnces(newLearningAgreements);
      this.$session.$data.learningAgreements = filteredLearningAgreements;

      const learningAgreements = filterLearningAgreementForChangedOnces(this.$session.$data.learningAgreements);
      if (Object.keys(learningAgreements).length === 0) {
        this.tell("Aktuell gibt es keine geänderten Learning Agreements. Es wird wohl Zeit für Feierabend. Bis bald!");
        return;
      }

      this.$session.$data.askedFor = askedFor.CHANGED;

      this.$speech.addText("Folgende geänderte Learning Agreements habe ich gefunden:");
      Object.keys(learningAgreements).forEach((learningAgreement) => {
        const learningAgreementTmp = learningAgreements[learningAgreement];
        this.$speech.addText(
          `Learning Agreement ${learningAgreement} von ${learningAgreementTmp.student.preName} ${learningAgreementTmp.student.name} für die ${learningAgreementTmp.targetUniversity.name} in ${learningAgreementTmp.targetUniversity.country}.`
        );
      });
      this.$speech.addText(
        "Um ein Learning Agreement auszuwählen, sage beispielsweise Learning Agreement eins bearbeiten."
      );
      this.ask(this.$speech);
    },

    askLearningAgreement() {
      return this.toStatelessIntent("askLearningAgreement")
    },

    //TODO: right speech
    //TODO: add changed onces
    Unhandled() {
      let speech = "Diese Frage lässt sich nur mit ja oder nein beantworten.";
      let reprompt = "Also nochmal nur für dich: Ja oder Nein?";
      this.ask(speech, reprompt);
    },
  }


});

module.exports = { app };
