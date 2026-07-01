import { Alert } from 'react-native';

const FIREBASE_ERROR_MESSAGES = {
  'permission-denied': "Accès refusé par le serveur. Vérifiez votre connexion ou contactez un administrateur.",
  unavailable: "Service momentanément indisponible. Vérifiez votre connexion internet et réessayez.",
  'deadline-exceeded': "La demande a expiré. Vérifiez votre connexion et réessayez.",
  'not-found': "Élément introuvable, il a peut-être déjà été supprimé.",
};

export function describeFirebaseError(error) {
  const code = error?.code?.replace('firestore/', '').replace('auth/', '');
  return FIREBASE_ERROR_MESSAGES[code] || "Une erreur inattendue est survenue. Merci de réessayer.";
}

// Exécute une action Firestore/Firebase en capturant les erreurs pour afficher un message
// utilisateur clair au lieu de laisser l'action échouer silencieusement (write "perdue" sans
// aucun retour, ou crash non géré).
export async function safeAction(action, { errorTitle = 'Erreur' } = {}) {
  try {
    await action();
    return true;
  } catch (error) {
    console.error(error);
    Alert.alert(errorTitle, describeFirebaseError(error));
    return false;
  }
}
