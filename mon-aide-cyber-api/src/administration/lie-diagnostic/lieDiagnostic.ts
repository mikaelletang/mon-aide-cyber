import { AdaptateurRelations } from '../../relation/AdaptateurRelations';
import crypto from 'crypto';
import { EntrepotDiagnostic } from '../../diagnostic/Diagnostic';
import { EntrepotAidant } from '../../authentification/Aidant';

export type Relation = {
  mailAidant: string;
  identifiantAidant: crypto.UUID;
  identifiantDiagnostic: crypto.UUID;
  estPersiste: boolean;
  message?: string;
};

export const lieDiagnostic = async (
  adaptateurRelations: AdaptateurRelations,
  entrepotDiagnostic: EntrepotDiagnostic,
  entrepotAidant: EntrepotAidant,
  relation: Relation,
): Promise<Relation> => {
  const identifiantDiagnostic = relation.identifiantDiagnostic;
  const identifiantAidant = relation.identifiantAidant;

  try {
    await entrepotAidant.lis(identifiantAidant);
  } catch (_) {
    return {
      ...relation,
      message: `l'aidant '${identifiantAidant}' n'a pas été trouvé`,
    };
  }

  try {
    await entrepotDiagnostic.lis(identifiantDiagnostic);
  } catch (_) {
    return {
      ...relation,
      message: `le diagnostic '${identifiantDiagnostic}' n'a pas été trouvé`,
    };
  }

  const identifiantDiagnosticInitieTrouve = (
    await adaptateurRelations.diagnosticsInitiePar(identifiantAidant)
  ).find((diagnosticInitie) => diagnosticInitie === identifiantDiagnostic);

  if (!identifiantDiagnosticInitieTrouve) {
    try {
      await adaptateurRelations.aidantInitieDiagnostic(
        identifiantAidant,
        identifiantDiagnostic,
      );
    } catch (erreur) {
      return { ...relation, message: 'erreur pendant la persistence' };
    }
  }

  return {
    ...relation,
    estPersiste: true,
  };
};
