import { UUID } from '../../types/Types.ts';
import { useNavigate } from 'react-router';
import { useCallback } from 'react';

export const QuitterLeDiagnostic = ({
  idDiagnostic,
  surAnnuler,
}: {
  idDiagnostic: UUID;
  surAnnuler: () => void;
}) => {
  const navigate = useNavigate();

  const surQuitterLeDiagnostic = useCallback(() => {
    surAnnuler();
    navigate(`/diagnostic/${idDiagnostic}/restitution/`);
  }, [idDiagnostic, navigate, surAnnuler]);
  return (
    <>
      <section>
        <div>
          Vous vous apprêtez à quitter le diagnostic. Votre progression est
          enregistrée, vous pourrez reprendre et modifier le diagnostic à votre
          convenance.
        </div>
        <div className="fr-pt-4w">
          <button
            type="button"
            key="annule-quitter-le-diagnostic"
            className="fr-btn bouton-mac bouton-mac-secondaire fr-mr-2w"
            onClick={surAnnuler}
          >
            Annuler
          </button>
          <button
            type="button"
            key="connexion-aidant"
            className="fr-btn bouton-mac bouton-mac-primaire"
            onClick={surQuitterLeDiagnostic}
          >
            Quitter le diagnostic
          </button>
        </div>
      </section>
    </>
  );
};