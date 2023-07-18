import {
  QuestionATranscrire,
  ReponseATranscrire,
  Transcripteur,
} from "../../../src/api/representateurs/types";
import {
  Question,
  ReponseComplementaire,
  ReponsePossible,
} from "../../../src/diagnostic/Referentiel";

export class TranscripteurDeReponseComplementaire {
  constructor(private readonly reponse: ReponseComplementaire) {}

  construis(): ReponseATranscrire {
    return {
      identifiant: this.reponse.identifiant,
      type: { format: "texte", type: "saisieLibre" },
    };
  }
}

export class TranscripteurDeReponse {
  private transcripteurDeReponseComplementaires: TranscripteurDeReponseComplementaire[] =
    [];

  constructor(private readonly reponse: ReponsePossible) {}

  ajouteUnTranscripteurDeReponseComplementaire(
    transcripteurDeReponse: TranscripteurDeReponseComplementaire,
  ): TranscripteurDeReponse {
    this.transcripteurDeReponseComplementaires.push(transcripteurDeReponse);
    return this;
  }

  construis(): ReponseATranscrire {
    return {
      identifiant: this.reponse.identifiant,
      question: this.reponse.question!,
      reponses: this.transcripteurDeReponseComplementaires.map((rc) =>
        rc.construis(),
      ),
      type: {
        format: "texte",
        type: "saisieLibre",
      },
    };
  }
}

export class TranscripteurDeQuestion {
  private transcripteursDeReponses: TranscripteurDeReponse[] = [];

  constructor(private readonly question: Question) {}

  ajouteUnTranscripteurDeReponse(
    transcripteurDeReponse: TranscripteurDeReponse,
  ): TranscripteurDeQuestion {
    this.transcripteursDeReponses.push(transcripteurDeReponse);
    return this;
  }

  construis(): QuestionATranscrire {
    return {
      identifiant: this.question.identifiant,
      reponses: this.transcripteursDeReponses.map((r) => r.construis()),
      type: this.question.type,
    };
  }
}

export class TranscripteursDeTest {
  private transcripteursDeQuestions: TranscripteurDeQuestion[] = [];

  ajouteUnTranscripteurDeQuestion(
    transcripteurDeQuestion: TranscripteurDeQuestion,
  ) {
    this.transcripteursDeQuestions.push(transcripteurDeQuestion);
  }

  construis(): Transcripteur {
    return {
      contexte: {
        questions: this.transcripteursDeQuestions.map((t) => t.construis()),
      },
    };
  }
}

const transcripteurAvecSaisiesLibres = {
  contexte: {
    questions: [
      {
        identifiant: "quelle-est-la-question",
        reponses: [
          {
            identifiant: "reponse1",
            type: { type: "saisieLibre", format: "texte" },
          },
          {
            identifiant: "reponse2",
            type: { type: "saisieLibre", format: "nombre" },
          },
        ],
      },
    ],
  },
} as Transcripteur;

const transcripteurQuestionTiroir = {
  contexte: {
    questions: [
      {
        identifiant: "question-avec-reponse-tiroir",
        reponses: [
          {
            identifiant: "reponse-0",
            question: {
              identifiant: "question-tiroir",
              reponses: [
                {
                  identifiant: "reponse-3",
                  type: { type: "saisieLibre", format: "texte" },
                },
              ],
            },
          },
        ],
      },
    ],
  },
} as Transcripteur;

const transcripteurMultipleTiroir = {
  contexte: {
    questions: [
      {
        identifiant: "premiere-question",
        reponses: [
          {
            identifiant: "reponse-1",
            question: {
              identifiant: "question-11",
            },
          },
        ],
      },
      {
        identifiant: "deuxieme-question",
        reponses: [
          {
            identifiant: "reponse-2",
            question: {
              identifiant: "question-21",
            },
          },
        ],
      },
    ],
  },
} as Transcripteur;

const fabriqueTranscripteur = (
  transcripteurs: TranscripteurDeQuestion[],
): Transcripteur => {
  const transcripteursDeTest = new TranscripteursDeTest();
  for (const transcripteur of transcripteurs) {
    transcripteursDeTest.ajouteUnTranscripteurDeQuestion(transcripteur);
  }
  return transcripteursDeTest.construis();
};

export {
  fabriqueTranscripteur,
  transcripteurAvecSaisiesLibres,
  transcripteurMultipleTiroir,
  transcripteurQuestionTiroir,
};