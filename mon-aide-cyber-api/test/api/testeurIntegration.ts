import serveur from '../../src/serveur';
import { AdaptateurReferentielDeTest } from '../adaptateurs/AdaptateurReferentielDeTest';
import { AdaptateurTranscripteurDeTest } from '../adaptateurs/adaptateurTranscripteur';
import { AdaptateurMesuresTest } from '../adaptateurs/AdaptateurMesuresTest';
import { Express } from 'express';
import { fakerFR } from '@faker-js/faker';
import { EntrepotsMemoire } from '../../src/infrastructure/entrepots/memoire/EntrepotsMemoire';
import { BusEvenementDeTest } from '../infrastructure/bus/BusEvenementDeTest';
import { AdaptateurGestionnaireErreursMemoire } from '../../src/infrastructure/adaptateurs/AdaptateurGestionnaireErreursMemoire';
import { FauxGestionnaireDeJeton } from '../infrastructure/authentification/FauxGestionnaireDeJeton';
import { AdaptateurDeVerificationDeSessionDeTest } from '../adaptateurs/AdaptateurDeVerificationDeSessionDeTest';
import { unAdaptateurDeRestitutionHTML } from '../adaptateurs/ConstructeurAdaptateurRestitutionHTML';
import { AdaptateursRestitution } from '../../src/adaptateurs/AdaptateursRestitution';
import { unAdaptateurRestitutionPDF } from '../adaptateurs/ConstructeurAdaptateurRestitutionPDF';
import { BusCommandeMAC } from '../../src/infrastructure/bus/BusCommandeMAC';
import { AdaptateurEnvoiMail } from '../../src/adaptateurs/AdaptateurEnvoiMail';
import { AdaptateurEnvoiMailMemoire } from '../../src/infrastructure/adaptateurs/AdaptateurEnvoiMailMemoire';
import { AdapatateurDeVerificationDeCGUDeTest } from '../adaptateurs/AdaptateurDeVerificationDeCGUDeTest';
import { AdaptateurDeGestionDeCookiesDeTest } from '../adaptateurs/AdaptateurDeGestionDeCookiesDeTest';
import { AdaptateurRelationsMAC } from '../../src/relation/AdaptateurRelationsMAC';
import { EntrepotRelationMemoire } from '../../src/relation/infrastructure/EntrepotRelationMemoire';
import { AdaptateurDeVerificationDesAccesDeTest } from '../adaptateurs/AdaptateurDeVerificationDesAccesDeTest';

class TesteurIntegrationMAC {
  private serveurDeTest:
    | {
        app: Express;
        arreteEcoute: () => void;
        ecoute: (port: number, succes: () => void) => void;
      }
    | undefined = undefined;
  constructor(
    public adaptateurRelations = new AdaptateurRelationsMAC(
      new EntrepotRelationMemoire(),
    ),
    public adaptateurReferentiel = new AdaptateurReferentielDeTest(),
    public adaptateurMesures = new AdaptateurMesuresTest(),
    public adaptateurTranscripteurDonnees = new AdaptateurTranscripteurDeTest(),
    public entrepots = new EntrepotsMemoire(),
    public busEvenement = new BusEvenementDeTest(),
    public gestionnaireDeJeton = new FauxGestionnaireDeJeton(),
    public adaptateurDeVerificationDeCGU = new AdapatateurDeVerificationDeCGUDeTest(),
    public adaptateurDeVerificationDeSession = new AdaptateurDeVerificationDeSessionDeTest(),
    public adaptateurDeVerificationDeRelations = new AdaptateurDeVerificationDesAccesDeTest(),
    public gestionnaireErreurs = new AdaptateurGestionnaireErreursMemoire(),
    public adaptateurEnvoieMessage: AdaptateurEnvoiMail = new AdaptateurEnvoiMailMemoire(),
    public adaptateurDeGestionDeCookies: AdaptateurDeGestionDeCookiesDeTest = new AdaptateurDeGestionDeCookiesDeTest(),
    public adaptateursRestitution: AdaptateursRestitution = {
      html() {
        return unAdaptateurDeRestitutionHTML().construis();
      },

      pdf() {
        return unAdaptateurRestitutionPDF();
      },
    },
  ) {}

  initialise() {
    this.serveurDeTest = serveur.creeServeur({
      adaptateurRelations: this.adaptateurRelations,
      adaptateurReferentiel: this.adaptateurReferentiel,
      adaptateurTranscripteurDonnees: this.adaptateurTranscripteurDonnees,
      adaptateurMesures: this.adaptateurMesures,
      entrepots: this.entrepots,
      busCommande: new BusCommandeMAC(
        this.entrepots,
        this.busEvenement,
        this.adaptateurEnvoieMessage,
      ),
      busEvenement: this.busEvenement,
      gestionnaireErreurs: this.gestionnaireErreurs,
      gestionnaireDeJeton: this.gestionnaireDeJeton,
      adaptateurDeGestionDeCookies: this.adaptateurDeGestionDeCookies,
      adaptateurDeVerificationDeCGU: this.adaptateurDeVerificationDeCGU,
      adaptateurDeVerificationDeSession: this.adaptateurDeVerificationDeSession,
      adaptateurDeVerificationDeRelations:
        this.adaptateurDeVerificationDeRelations,
      adaptateursRestitution: this.adaptateursRestitution,
      avecProtectionCsrf: false,
      adaptateurEnvoiMessage: this.adaptateurEnvoieMessage,
    });
    const portEcoute = fakerFR.number.int({ min: 10000, max: 20000 });
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.serveurDeTest.ecoute(portEcoute, () => {});
    return { portEcoute: portEcoute, app: this.serveurDeTest.app };
  }

  arrete() {
    this.serveurDeTest?.arreteEcoute();
  }
}

const testeurIntegration = () => new TesteurIntegrationMAC();

export default testeurIntegration;
