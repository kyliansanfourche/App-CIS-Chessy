import React, { useState } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { Phone, XCircle, CheckCircle, UserCog } from 'lucide-react-native';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ALERT_LEVELS } from '../constants';
import { safeAction } from '../utils/errors';
import { sendAutomaticEmail } from '../utils/emailjs';

const contactUser = (user) => {
  Alert.alert(`Contacter ${user.name}`, 'Comment joindre cet agent ?', [
    { text: 'Appeler', onPress: () => Linking.openURL(`tel:${user.identifier}`) },
    { text: 'SMS', onPress: () => Linking.openURL(`sms:${user.identifier}`) },
    { text: 'Email', onPress: () => Linking.openURL(`mailto:${user.identifier}`) },
    { text: 'Annuler', style: 'cancel' },
  ]);
};

const DEMO_INTERVENTIONS = [
  { type: 'Feu de Bâtiment', location: 'Avenue Paul Séramy, Chessy', vehicles: 'FPT, EPA, VSAV', status: 'En cours' },
  { type: 'Malaise Voie Publique', location: 'Gare Marne-la-Vallée', vehicles: 'VSAV 1', status: 'En cours' },
  { type: 'AVP (Accident)', location: 'A4 - PK 12 (Vers Paris)', vehicles: 'VSR, VSAV 2', status: 'En cours' },
];

export default function AdminScreen({ colors, styles, currentUser, users }) {
  const [alertTitle, setAlertTitle] = useState('');
  const [alertContent, setAlertContent] = useState('');
  const [alertLevel, setAlertLevel] = useState(0);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [generatingDemo, setGeneratingDemo] = useState(false);

  const pending = users.filter((u) => !u.isValidated);
  const members = users.filter((u) => u.isValidated && u.id !== currentUser.id);

  const generateDemoInterventions = async () => {
    setGeneratingDemo(true);
    const ok = await safeAction(async () => {
      for (const d of DEMO_INTERVENTIONS) {
        await addDoc(collection(db, 'interventions'), { ...d, timestamp: new Date() });
      }
    }, { errorTitle: 'Impossible de générer les interventions' });
    setGeneratingDemo(false);
    if (ok) Alert.alert('Succès', 'Interventions générées.');
  };

  const createAlert = async () => {
    const title = alertTitle.trim();
    const content = alertContent.trim();
    if (!title || !content) return Alert.alert('Erreur', 'Champs requis.');

    setSendingAlert(true);
    const ok = await safeAction(
      () => addDoc(collection(db, 'alerts'), {
        title, content, level: alertLevel, date: new Date().toLocaleDateString('fr-FR'), readBy: [], timestamp: new Date()
      }),
      { errorTitle: "Impossible d'envoyer l'alerte" }
    );
    setSendingAlert(false);
    if (!ok) return;

    users.filter((u) => u.identifier.includes('@')).forEach((user) => sendAutomaticEmail(user.identifier, title, content));
    setAlertTitle(''); setAlertContent('');
    Alert.alert('Alerte Diffusée', 'Les notifications Push et les emails ont été envoyés !');
  };

  const validateUser = (user) => safeAction(
    () => updateDoc(doc(db, 'users', user.id), { isValidated: true }),
    { errorTitle: 'Impossible de valider ce compte' }
  );

  const rejectUser = (user) => {
    Alert.alert('Refuser', `Refuser la demande de ${user.name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Refuser', style: 'destructive', onPress: () => safeAction(() => deleteDoc(doc(db, 'users', user.id)), { errorTitle: 'Impossible de refuser cette demande' }) },
    ]);
  };

  const changeRole = (user) => {
    Alert.alert('Grade', `Rôle pour ${user.name} :`, [
      { text: 'Pompier', onPress: () => safeAction(() => updateDoc(doc(db, 'users', user.id), { role: 'user' }), { errorTitle: 'Impossible de changer le rôle' }) },
      { text: 'Superviseur', onPress: () => safeAction(() => updateDoc(doc(db, 'users', user.id), { role: 'superviseur' }), { errorTitle: 'Impossible de changer le rôle' }) },
      { text: 'Admin', onPress: () => safeAction(() => updateDoc(doc(db, 'users', user.id), { role: 'admin' }), { errorTitle: 'Impossible de changer le rôle' }) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  return (
    <ScrollView style={styles.padding}>
      <Text style={styles.sectionTitle}>Opérationnel (Démo)</Text>
      <View style={styles.demoCard}>
        <TouchableOpacity style={styles.demoButton} onPress={generateDemoInterventions} disabled={generatingDemo}>
          {generatingDemo ? <ActivityIndicator color="#FFF" /> : <Text style={styles.demoButtonText}>Lancer Interventions (Démo)</Text>}
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Diffuser Alerte</Text>
      <View style={styles.adminForm}>
        <TextInput style={styles.input} placeholderTextColor={colors.textMuted} placeholder="Titre" value={alertTitle} onChangeText={setAlertTitle} />
        <TextInput style={[styles.input, { height: 80 }]} placeholderTextColor={colors.textMuted} placeholder="Message..." multiline value={alertContent} onChangeText={setAlertContent} />
        <View style={styles.levelRow}>
          {ALERT_LEVELS.map((l, i) => (
            <TouchableOpacity key={l.label} onPress={() => setAlertLevel(i)} style={[styles.levelBtn, alertLevel === i && { backgroundColor: l.color, borderColor: l.color }]}>
              <Text style={[styles.levelBtnText, alertLevel === i && { color: '#FFF' }]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.alertSubmit} onPress={createAlert} disabled={sendingAlert}>
          {sendingAlert ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>ENVOYER</Text>}
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Recrues</Text>
      {pending.length === 0 && <Text style={styles.emptyText}>Aucune demande en attente.</Text>}
      {pending.map((u) => (
        <View key={u.id} style={styles.userCard}>
          <View style={{ flex: 1 }}><Text style={styles.userName}>{u.name}</Text><Text style={styles.userRole}>{u.identifier}</Text></View>
          <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => contactUser(u)}><Phone size={24} color={colors.info} /></TouchableOpacity>
            <TouchableOpacity onPress={() => rejectUser(u)}><XCircle size={28} color={colors.primary} /></TouchableOpacity>
            <TouchableOpacity onPress={() => validateUser(u)}><CheckCircle size={28} color={colors.success} /></TouchableOpacity>
          </View>
        </View>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Personnel</Text>
      {members.map((u) => (
        <View key={u.id} style={styles.userCardMember}>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{u.name}</Text>
            <Text style={[styles.roleBadge, u.role === 'admin' && { color: colors.primary }]}>{u.role.toUpperCase()}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => contactUser(u)}><Phone size={20} color={colors.info} /></TouchableOpacity>
            <TouchableOpacity onPress={() => changeRole(u)}><UserCog size={20} color={colors.textMuted} /></TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
