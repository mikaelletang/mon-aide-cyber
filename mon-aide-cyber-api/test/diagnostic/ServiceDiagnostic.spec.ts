import { beforeEach, describe, expect, it } from "vitest";
import {
  uneQuestion,
  uneReponsePossible,
  unReferentiel,
  unReferentielAuContexteVide,
} from "../constructeurs/constructeurReferentiel";
import { unDiagnostic } from "../constructeurs/constructeurDiagnostic";
import { ServiceDiagnostic } from "../../src/diagnostic/ServiceDiagnostic";
import { AdaptateurReferentielDeTest } from "../adaptateurs/AdaptateurReferentielDeTest";
import { Entrepots } from "../../src/domaine/Entrepots";
import { EntrepotsMemoire } from "../../src/infrastructure/entrepots/memoire/Entrepots";

describe("Le service de diagnostic", () => {
  let adaptateurReferentiel: AdaptateurReferentielDeTest;
  let entrepots: Entrepots;

  beforeEach(() => {
    adaptateurReferentiel = new AdaptateurReferentielDeTest();
    entrepots = new EntrepotsMemoire();
  });

  describe("Lorsque l'on veut accéder à un diagnostic", () => {
    it("retourne un diagnostic contenant une réponse avec une question à tiroir", async () => {
      const reponseAttendue = uneReponsePossible()
        .avecQuestionATiroir(
          uneQuestion()
            .aChoixMultiple("Quelles réponses ?", [
              { identifiant: "reponse-a", libelle: "Réponse A" },
              { identifiant: "reponse-b", libelle: "Réponse B" },
              { identifiant: "reponse-c", libelle: "Réponse C" },
            ])
            .construis(),
        )
        .construis();
      const question = uneQuestion()
        .avecReponsesPossibles([
          uneReponsePossible().construis(),
          reponseAttendue,
        ])
        .construis();
      const diagnostic = unDiagnostic()
        .avecUnReferentiel(
          unReferentielAuContexteVide()
            .ajouteUneQuestionAuContexte(uneQuestion().construis())
            .ajouteUneQuestionAuContexte(question)
            .construis(),
        )
        .construis();
      adaptateurReferentiel.ajoute(diagnostic.referentiel);
      entrepots.diagnostic().persiste(diagnostic);
      const serviceDiagnostic = new ServiceDiagnostic(
        adaptateurReferentiel,
        entrepots,
      );

      const diagnosticRetourne = await serviceDiagnostic.diagnostic(
        diagnostic.identifiant,
      );

      expect(
        diagnosticRetourne.referentiel.contexte.questions[1]
          .reponsesPossibles[1],
      ).toMatchObject({
        identifiant: reponseAttendue.identifiant,
        libelle: reponseAttendue.libelle,
        ordre: reponseAttendue.ordre,
        question: {
          identifiant: "quelles-reponses-",
          libelle: "Quelles réponses ?",
          reponsesPossibles: [
            { identifiant: "reponse-a", libelle: "Réponse A", ordre: 0 },
            { identifiant: "reponse-b", libelle: "Réponse B", ordre: 1 },
            { identifiant: "reponse-c", libelle: "Réponse C", ordre: 2 },
          ],
          type: "choixMultiple",
        },
      });
    });
  });

  describe("Lorsque l'on veut lancer un diagnostic", () => {
    it("copie le référentiel disponible et le persiste", async () => {
      const referentiel = unReferentiel().construis();
      adaptateurReferentiel.ajoute(referentiel);

      const diagnostic = await new ServiceDiagnostic(
        adaptateurReferentiel,
        entrepots,
      ).cree();

      const diagnosticRetourne = await entrepots
        .diagnostic()
        .lis(diagnostic.identifiant);
      expect(diagnosticRetourne.identifiant).not.toBeUndefined();
      expect(diagnosticRetourne.referentiel).toStrictEqual(referentiel);
    });
  });
});