import { useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { db, ensureAnonymousAuth } from '../firebase';

// Centralise l'authentification et les abonnements Firestore temps réel utilisés par toute
// l'app. Expose un état d'erreur explicite (au lieu d'un écran de chargement infini) si
// l'authentification ou l'accès aux données échoue, par ex. si les règles de sécurité
// Firestore changent côté console.
export function useAppData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [interventions, setInterventions] = useState([]);

  const retry = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    const unsubscribers = [];

    setLoading(true);
    setError(null);

    (async () => {
      try {
        await Notifications.requestPermissionsAsync();
      } catch (permError) {
        console.warn('Notifications non autorisées :', permError);
      }

      try {
        await ensureAnonymousAuth();
      } catch (authError) {
        console.error(authError);
        if (!cancelled) {
          setError("Impossible de se connecter au serveur. Vérifiez votre connexion internet.");
          setLoading(false);
        }
        return;
      }

      if (cancelled) return;

      const onError = (label) => (err) => {
        console.error(`Erreur Firestore (${label}) :`, err);
        if (!cancelled) setError("Impossible de charger les données du centre. Réessayez dans un instant.");
      };

      unsubscribers.push(onSnapshot(
        collection(db, 'users'),
        (snap) => !cancelled && setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        onError('users')
      ));
      unsubscribers.push(onSnapshot(
        collection(db, 'shifts'),
        (snap) => !cancelled && setShifts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        onError('shifts')
      ));
      unsubscribers.push(onSnapshot(
        query(collection(db, 'documents'), orderBy('timestamp', 'desc')),
        (snap) => !cancelled && setDocuments(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        onError('documents')
      ));

      let isInitialAlertsLoad = true;
      unsubscribers.push(onSnapshot(
        query(collection(db, 'alerts'), orderBy('timestamp', 'desc')),
        (snap) => {
          if (cancelled) return;
          if (!isInitialAlertsLoad) {
            snap.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const data = change.doc.data();
                Notifications.scheduleNotificationAsync({
                  content: { title: 'ALERTE CENTRE', body: data.title, sound: true }, trigger: null
                });
              }
            });
          }
          setAlerts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          isInitialAlertsLoad = false;
        },
        onError('alerts')
      ));

      let isInitialIntersLoad = true;
      unsubscribers.push(onSnapshot(
        query(collection(db, 'interventions'), orderBy('timestamp', 'desc')),
        (snap) => {
          if (cancelled) return;
          if (!isInitialIntersLoad) {
            snap.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const data = change.doc.data();
                Notifications.scheduleNotificationAsync({
                  content: { title: `DÉPART : ${data.type}`, body: `${data.location}`, sound: true }, trigger: null
                });
              }
            });
          }
          setInterventions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          isInitialIntersLoad = false;
        },
        onError('interventions')
      ));

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [reloadToken]);

  return { loading, error, retry, users, shifts, alerts, documents, interventions };
}
