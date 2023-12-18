import { Diagnostic, QuestionDiagnostic } from '../../diagnostic/Diagnostic';
import { QuestionATiroir, ReponsePossible } from '../../diagnostic/Referentiel';
import {
  Action,
  Chemin,
  QuestionATranscrire,
  ReponseATranscrire,
  RepresentationThematique,
  RepresentationDiagnostic,
  RepresentationQuestion,
  RepresentationReponsePossible,
  Transcripteur,
} from './types';

const trouveQuestionATranscrire = (
  chemin: { chemin: Chemin; identifiantQuestion: string },
  transcripteur: Transcripteur,
): QuestionATranscrire | undefined => {
  return trouveParmiLesQuestions(
    transcripteur.thematiques[chemin.chemin][
      'questions'
    ] as QuestionATranscrire[],
    chemin.identifiantQuestion,
  );
};
const trouveParmiLesQuestions = (
  questions: QuestionATranscrire[],
  identifiantQuestion: string,
): QuestionATranscrire | undefined => {
  for (const question of questions) {
    if (question.identifiant === identifiantQuestion) {
      return question;
    }
    const questionsATranscrire = (
      question.reponses
        ?.reduce((accumulateur: ReponseATranscrire[], reponseCourante) => {
          if (reponseCourante.question !== undefined) {
            accumulateur.push(reponseCourante);
          }
          return accumulateur;
        }, [])
        .map((reponse) => reponse.question) as QuestionATranscrire[]
    )?.find((q) => q.identifiant === identifiantQuestion);
    if (questionsATranscrire !== undefined) {
      return questionsATranscrire;
    }
  }
  return undefined;
};
const questionTiroirATranscrire = (
  questions: QuestionATiroir[] | undefined,
  transcripteur: Transcripteur,
): RepresentationQuestion[] => {
  return (
    questions?.map((question) => {
      const questionTiroirATranscrire: QuestionATranscrire | undefined =
        trouveQuestionATranscrire(
          {
            chemin: `contexte`,
            identifiantQuestion: question.identifiant,
          },
          transcripteur,
        );
      if (questionTiroirATranscrire !== undefined) {
        const reponsesPossibles: RepresentationReponsePossible[] =
          trouveReponsesPossibles(
            question,
            transcripteur,
            questionTiroirATranscrire,
          );
        return {
          type: question.type,
          identifiant: questionTiroirATranscrire.identifiant,
          reponsesPossibles,
          libelle: question.libelle,
        } as RepresentationQuestion;
      }
      const { poids, ...questionSansPoids } = { ...question };
      return {
        ...questionSansPoids,
      } as RepresentationQuestion;
    }) || []
  );
};

const estQuestionATiroir = (
  reponse: ReponsePossible | Omit<ReponsePossible, 'questions'>,
): reponse is ReponsePossible => {
  return (
    'questions' in reponse &&
    reponse.questions !== undefined &&
    reponse.questions?.length > 0
  );
};
const trouveReponsesPossibles = (
  question: QuestionDiagnostic | QuestionATiroir,
  transcripteur: Transcripteur,
  questionATranscrire: QuestionATranscrire | undefined,
): RepresentationReponsePossible[] => {
  return question.reponsesPossibles.map((reponse) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { resultat, ...corpsDeReponse } = reponse;
    let representationReponsePossible: RepresentationReponsePossible = {
      ...corpsDeReponse,
    } as RepresentationReponsePossible;
    const reponseATranscrire = trouveReponseATranscrire(
      reponse.identifiant,
      questionATranscrire?.reponses,
    );
    if (estQuestionATiroir(reponse)) {
      const representationQuestionATiroir = questionTiroirATranscrire(
        reponse.questions,
        transcripteur,
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { questions, resultat, ...corpsDeReponse } = reponse;
      representationReponsePossible = {
        ...corpsDeReponse,
        questions: representationQuestionATiroir,
      };
    }
    return {
      ...representationReponsePossible,
      ...(reponseATranscrire?.type && { type: reponseATranscrire?.type }),
    };
  });
};

const trouveReponseATranscrire = (
  identifiantReponse: string,
  reponsesATranscrire: ReponseATranscrire[] | undefined,
): ReponseATranscrire | undefined => {
  return reponsesATranscrire?.find(
    (reponseATranscrire) =>
      reponseATranscrire?.identifiant === identifiantReponse,
  );
};

const extraisLesChampsDeLaQuestion = (question: QuestionDiagnostic) => {
  const autresReponses = {
    valeur: question.reponseDonnee.reponseUnique,
    reponses: question.reponseDonnee.reponsesMultiples.map((rep) => ({
      identifiant: rep.identifiant,
      reponses: [...rep.reponses],
    })),
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { reponseDonnee, poids, ...reste } = { ...question };
  return { autresReponses, reste };
};

export function representeLeDiagnosticPourLeClient(
  diagnostic: Diagnostic,
  transcripteur: Transcripteur,
): RepresentationDiagnostic {
  const actions: Action[] = [
    {
      action: 'terminer',
      ressource: {
        url: `/api/diagnostic/${diagnostic.identifiant}/termine`,
        methode: 'GET',
      },
    },
  ];
  const referentiel = Object.entries(diagnostic.referentiel).reduce(
    (accumulateur, [clef, questionsThematique]) => {
      actions.push({
        [clef]: {
          action: 'repondre',
          ressource: {
            url: `/api/diagnostic/${diagnostic.identifiant}`,
            methode: 'PATCH',
          },
        },
      });
      return {
        ...accumulateur,
        [clef]: {
          questions: questionsThematique.questions.map((question) => {
            const questionATranscrire = trouveQuestionATranscrire(
              {
                chemin: clef,
                identifiantQuestion: question.identifiant,
              },
              transcripteur,
            );
            const reponsesPossibles = trouveReponsesPossibles(
              question,
              transcripteur,
              questionATranscrire,
            );
            const { autresReponses, reste } =
              extraisLesChampsDeLaQuestion(question);
            return {
              ...reste,
              reponseDonnee: autresReponses,
              reponsesPossibles,
              type: questionATranscrire?.type || question.type,
            };
          }),
          actions: [
            {
              action: 'repondre',
              chemin: clef,
              ressource: {
                url: `/api/diagnostic/${diagnostic.identifiant}`,
                methode: 'PATCH',
              },
            },
          ],
          libelle: transcripteur.thematiques[clef].libelle,
        },
      };
    },
    {},
  );

  return {
    actions,
    identifiant: diagnostic.identifiant,
    referentiel: {
      ...Object.keys(referentiel)
        .sort((thematiqueA, thematiqueB) =>
          transcripteur.ordreThematiques &&
          transcripteur.ordreThematiques?.indexOf(thematiqueA) >
            transcripteur.ordreThematiques?.indexOf(thematiqueB)
            ? 1
            : -1,
        )
        .reduce(
          (accumulateur, thematique) => ({
            ...accumulateur,
            [thematique]: {
              ...(Object.entries(referentiel).find(
                ([clef]) => clef === thematique,
              )?.[1] as RepresentationThematique),
            },
          }),
          {},
        ),
    },
  };
}
