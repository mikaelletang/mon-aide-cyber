import {
  ContexteModale,
  ElementModale,
} from '../../fournisseurs/ContexteModale.ts';
import { createPortal } from 'react-dom';
import {
  ForwardedRef,
  forwardRef,
  PropsWithChildren,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

type ProprietesElementModale = ElementModale & {
  boutonFermer: ReactElement;
  surClickEnDehors: () => void;
};

export const Modale = forwardRef(function Modale(
  proprietes: PropsWithChildren<ProprietesElementModale>,
  referenceDialogue: ForwardedRef<any>,
) {
  const ref = useRef<HTMLDivElement | null>(null);

  const clickEnDehors = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      proprietes.surClickEnDehors();
    }
  };

  useEffect(() => {
    addEventListener('click', clickEnDehors, true);

    return () => {
      removeEventListener('click', clickEnDehors);
    };
  });

  const taille = proprietes.taille
    ? proprietes.taille === 'centree'
      ? 'fr-col-6'
      : 'fr-col-12'
    : 'fr-col-6';

  return (
    <div className="fr-container fr-container--fluid">
      <div className="fr-grid-row fr-grid-row--center">
        <div ref={ref} className={taille}>
          <div
            ref={referenceDialogue}
            className="fr-modal__body modale-mac fr-m-0 fr-p-0"
          >
            <div className="fr-modal__header">{proprietes.boutonFermer}</div>
            <div className="fr-modal__content">
              {proprietes.titre && (
                <h1 id="titre-modale">{proprietes.titre}</h1>
              )}
              {proprietes.corps}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const PortailModale = ({ children }: PropsWithChildren) => {
  const [elementModale, setElementModale] = useState<null | ElementModale>(
    null,
  );
  const [classModale, setClasseModale] = useState<string | undefined>(
    undefined,
  );
  const [ariaModale, setAriaModale] = useState<boolean>(false);
  const [modaleOuverte, setModaleOuverte] = useState<boolean>(false);
  const ref = useRef<HTMLDialogElement | null>(null);

  const fermeModale = useCallback(() => {
    setClasseModale('');
    setAriaModale(false);
    setModaleOuverte(false);
    setElementModale(null);
  }, []);

  useEffect(() => {
    const modaleCourante = ref.current;
    if (modaleOuverte && modaleCourante) {
      const focusable: NodeListOf<HTMLElement> | undefined =
        modaleCourante.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );

      const premierElement = focusable?.[0];
      const premierElementInput =
        Array.from(focusable.values()).find(
          (element) => element instanceof HTMLInputElement,
        ) || focusable?.[0];
      const dernierElement = focusable?.[focusable.length - 1];
      const timeoutSurPremierChamps = setTimeout(
        () => premierElementInput?.focus(),
        10,
      );

      const surTabulation = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === premierElementInput) {
            e.preventDefault();
            dernierElement.focus();
          } else if (!e.shiftKey && document.activeElement === dernierElement) {
            e.preventDefault();
            premierElement.focus();
          }
        }
      };

      const surEchappe = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          fermeModale();
        }
      };

      modaleCourante.addEventListener('keydown', surTabulation);
      modaleCourante.addEventListener('keydown', surEchappe);

      return () => {
        clearTimeout(timeoutSurPremierChamps);
        modaleCourante.removeEventListener('keydown', surTabulation);
        modaleCourante.removeEventListener('keydown', surEchappe);
      };
    }
  }, [fermeModale, modaleOuverte]);

  return (
    <ContexteModale.Provider
      value={{
        ferme: () => fermeModale(),
        affiche: (element: ElementModale) => {
          setClasseModale('fr-modal--opened');
          setAriaModale(true);
          setModaleOuverte(true);
          setElementModale(element);
        },
      }}
    >
      {children}
      <dialog
        aria-labelledby="titre-modale"
        id="modale"
        className={`fr-modal ${classModale}`}
        aria-modal={ariaModale}
        open={modaleOuverte}
        role="dialog"
      ></dialog>
      {elementModale
        ? createPortal(
            <Modale
              ref={ref}
              titre={elementModale.titre}
              corps={elementModale.corps}
              taille={elementModale.taille}
              boutonFermer={
                <button
                  className="fr-btn fr-btn--close"
                  type="button"
                  aria-controls="modale"
                  title="Fermer"
                  onClick={() => fermeModale()}
                />
              }
              surClickEnDehors={fermeModale}
            />,
            document.getElementById('modale') as Element,
          )
        : null}
    </ContexteModale.Provider>
  );
};
