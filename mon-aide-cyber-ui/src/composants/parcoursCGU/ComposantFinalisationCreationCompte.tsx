import { Header } from '../Header.tsx';
import { Footer } from '../Footer.tsx';
import { FormEvent, useCallback, useEffect, useReducer } from 'react';
import {
  useActionsUtilisateur,
  useEntrepots,
} from '../../fournisseurs/hooks.ts';
import {
  extraisLesActions,
  trouveParmiLesLiens,
} from '../../domaine/Actions.ts';
import { useNavigate } from 'react-router-dom';
import {
  cguCliquees,
  finalisationCreationCompteInvalidee,
  finalisationCreationCompteTransmise,
  finalisationCreationCompteValidee,
  reducteurFinalisationCreationCompte,
} from './reducteurFinalisationCreationCompte.tsx';

export const ComposantFinalisationCreationCompte = () => {
  const actions = useActionsUtilisateur();
  const entrepots = useEntrepots();
  const [etatFinalisationCreationCompte, envoie] = useReducer(
    reducteurFinalisationCreationCompte,
    {
      cguSignees: false,
      saisieValide: () => false,
      erreur: {},
    },
  );
  const navigate = useNavigate();

  const finaliseCreationCompte = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    envoie(finalisationCreationCompteValidee());
  }, []);

  useEffect(() => {
    if (
      etatFinalisationCreationCompte.saisieValide() &&
      etatFinalisationCreationCompte.finalisationCreationCompteATransmettre
    ) {
      const parametresAPI = trouveParmiLesLiens(
        actions,
        'finaliser-creation-compte',
      );
      entrepots
        .utilisateur()
        .finaliseCreationCompte(parametresAPI, {
          cguSignees: etatFinalisationCreationCompte.cguSignees,
        })
        .then((reponse) => {
          envoie(finalisationCreationCompteTransmise());
          return navigate(reponse.liens.suite.url, {
            state: extraisLesActions(reponse.liens),
          });
        })
        .catch((erreur) => envoie(finalisationCreationCompteInvalidee(erreur)));
    }
  }, [actions, entrepots, etatFinalisationCreationCompte, navigate]);

  const surCGUSignees = useCallback(() => {
    envoie(cguCliquees());
  }, []);

  return (
    <>
      <Header />
      <main role="main">
        <div className="mode-fonce fr-pt-md-6w fr-pb-md-7w">
          <div className="fr-container">
            <div className="fr-grid-row">
              <div>
                <h3>Création de votre espace Aidant MonAideCyber</h3>
                <p>Bienvenue dans la communauté !</p>
              </div>
            </div>
          </div>
        </div>
        <div className="fond-clair-mac finalisation-compte">
          <div className="fr-container">
            <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center">
              <div className="fr-col-8">
                <form onSubmit={finaliseCreationCompte}>
                  <fieldset className="fr-fieldset section">
                    <label className="fr-label">
                      <h5>Création de votre espace Aidant</h5>
                    </label>
                    <div className="fr-fieldset__content">
                      <div className="fr-checkbox-group mac-radio-group">
                        <input
                          type="checkbox"
                          id="cgu-aidant"
                          name="cgu-aidant"
                          onClick={surCGUSignees}
                          checked={etatFinalisationCreationCompte.cguSignees}
                        />
                        <label className="fr-label" htmlFor="cgu-aidant">
                          J&apos;accepte les &nbsp;
                          <b>
                            <a href="/cgu">
                              conditions générales d&apos;utilisation
                            </a>
                          </b>
                          &nbsp; de MonAideCyber
                        </label>
                        {
                          etatFinalisationCreationCompte.erreur?.cguSignees
                            ?.texteExplicatif
                        }
                      </div>
                      <div className="fr-grid-row fr-grid-row--right">
                        <button
                          type="submit"
                          key="finalise-creation-compte"
                          className="fr-btn bouton-mac bouton-mac-primaire"
                        >
                          Valider
                        </button>
                      </div>
                    </div>
                    <div className="fr-mt-2w">
                      {etatFinalisationCreationCompte.champsErreur}
                    </div>
                  </fieldset>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};