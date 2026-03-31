import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, SafeAreaView, ScrollView, Alert, ActivityIndicator, Platform, Linking, StatusBar } from 'react-native';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import * as Notifications from 'expo-notifications';
import * as MailComposer from 'expo-mail-composer';
import { Calendar } from 'react-native-calendars';
import { 
  GraduationCap, Calendar as CalendarIcon, Users, ListChecks, Clock, 
  CheckCircle, Folder, ChevronRight, CheckSquare, Square, ShieldCheck, 
  Trash2, LogOut, Bell, TriangleAlert, Info, UserCog, Mail, XCircle, BookOpen, Phone,
  Moon, Sun
} from 'lucide-react-native';

const firebaseConfig = {
  apiKey: "AIzaSyCqv0evg0gO43oTiVpyi2Lp_6PbpQTFkpc",
  authDomain: "cis-chessy-app.firebaseapp.com",
  projectId: "cis-chessy-app",
  storageBucket: "cis-chessy-app.firebasestorage.app",
  messagingSenderId: "6719045910",
  appId: "1:6719045910:web:29fc060fccd06ee3e25037",
  measurementId: "G-DKV2KYG7DY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const TRAINING_STRUCTURE = [
  { id: 'm1', title: 'INCENDIE', goals: ['Établissement Lance', 'Port de l\'ARI', 'Sauvetage'] },
  { id: 'm2', title: 'SECOURS (SUAP)', goals: ['Bilan ABCDE', 'Arrêt Hémorragie', 'Réanimation'] },
  { id: 'm3', title: 'CONDUITE', goals: ['Vérification VL', 'Utilisation VSAV', 'Manœuvre PL'] },
  { id: 'm4', title: 'HABILITATIONS', goals: ['HDR - Radio', 'CATE - Tronçonneuse', 'CA1E'] },
];

const ALERT_LEVELS = [
  { label: 'INFO', color: '#2A9D8F', icon: Info },
  { label: 'URGENT', color: '#F4A261', icon: Clock },
  { label: 'CRITIQUE', color: '#E63946', icon: TriangleAlert },
];

const getColors = (isDark) => ({
  background: isDark ? '#0F172A' : '#FFF',
  cardBg: isDark ? '#1E293B' : '#FFF',
  cardBgAlt: isDark ? '#334155' : '#F8FAFC',
  textMain: isDark ? '#F8FAFC' : '#1D3557',
  textSub: isDark ? '#94A3B8' : '#457B9D',
  textMuted: isDark ? '#64748B' : '#94A3B8',
  border: isDark ? '#334155' : '#F0F0F0',
  borderAlt: isDark ? '#475569' : '#EEE',
  primary: isDark ? '#EF4444' : '#E63946',
  navBg: isDark ? '#1E293B' : '#FFF',
  inputBg: isDark ? '#0F172A' : '#F1F5F9',
  loginBg: isDark ? '#020617' : '#1D3557',
  success: '#22C55E',
  successBg: isDark ? '#064E3B' : '#F0FDF4',
  dangerBg: isDark ? '#450A0A' : '#FEF2F2',
  dangerBorder: isDark ? '#7F1D1D' : '#FECACA',
  iconDef: isDark ? '#94A3B8' : '#CCC'
});

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('login'); 
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // NOUVEAU : État du Mode Sombre
  const [isDarkMode, setIsDarkMode] = useState(false);
  const colors = getColors(isDarkMode);
  const styles = getStyles(colors);
  
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]); 
  const [alerts, setAlerts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [selectedStagiaire, setSelectedStagiaire] = useState(null);

  const [idInput, setIdInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [newCustomGoal, setNewCustomGoal] = useState('');
  
  const [alertTitle, setAlertTitle] = useState('');
  const [alertContent, setAlertContent] = useState('');
  const [alertLevel, setAlertLevel] = useState(0);

  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');

  useEffect(() => {
    (async () => { await Notifications.requestPermissionsAsync(); })();

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubShifts = onSnapshot(collection(db, "shifts"), (snap) => setShifts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubDocs = onSnapshot(query(collection(db, "documents"), orderBy("timestamp", "desc")), (snap) => setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    let isInitialAlertsLoad = true;
    const unsubAlerts = onSnapshot(query(collection(db, "alerts"), orderBy("timestamp", "desc")), (snap) => {
      if (!isInitialAlertsLoad) {
        snap.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            Notifications.scheduleNotificationAsync({ 
              content: { title: `ALERTE CENTRE`, body: data.title, sound: true }, trigger: null 
            });
          }
        });
      }
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      isInitialAlertsLoad = false;
    });

    let isInitialIntersLoad = true;
    const unsubInters = onSnapshot(query(collection(db, "interventions"), orderBy("timestamp", "desc")), (snap) => {
      if (!isInitialIntersLoad) {
        snap.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            Notifications.scheduleNotificationAsync({ 
              content: { title: `DÉPART : ${data.type}`, body: `${data.location}`, sound: true }, trigger: null 
            });
          }
        });
      }
      setInterventions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      isInitialIntersLoad = false;
    });

    setLoading(false);
    return () => { unsubUsers(); unsubAlerts(); unsubShifts(); unsubDocs(); unsubInters(); };
  }, []);

  const handleLogin = () => {
    const user = users.find(u => u.identifier === idInput && u.password === passInput);
    if (!user) return Alert.alert("Erreur", "Identifiant ou mot de passe incorrect.");
    if (!user.isValidated) return Alert.alert("Accès Refusé", "Compte en attente de validation.");
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleSignUp = async () => {
    if (!idInput || !passInput || !nameInput) return Alert.alert("Erreur", "Veuillez tout remplir.");
    await addDoc(collection(db, "users"), { name: nameInput, identifier: idInput, password: passInput, role: 'user', isValidated: false, completedGoals: [], customGoals: [] });
    Alert.alert("Succès", "Demande envoyée au centre.");
    setIsRegistering(false);
  };

  const sendAutomaticEmail = async (destinataire, titre, contenu) => {
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: 'service_z4oavne',
          template_id: 'template_f18d7j2',
          user_id: 'yNjIitSuBAUsWX0br', 
          template_params: { to_email: destinataire, titre_alerte: titre, message_alerte: contenu }
        }),
      });
      if (!response.ok) console.log('Erreur serveur EmailJS');
    } catch (error) {
      console.error('Erreur réseau EmailJS :', error);
    }
  };

  const createAlert = async () => {
    if (!alertTitle || !alertContent) return Alert.alert("Erreur", "Champs requis.");
    await addDoc(collection(db, "alerts"), { title: alertTitle, content: alertContent, level: alertLevel, date: new Date().toLocaleDateString('fr-FR'), readBy: [], timestamp: new Date() });
    users.filter(u => u.identifier.includes('@')).forEach(user => sendAutomaticEmail(user.identifier, alertTitle, alertContent));
    setAlertTitle(''); setAlertContent('');
    Alert.alert("Alerte Diffusée", "Les notifications Push et les emails ont été envoyés !");
  };

  const generateDemoInterventions = async () => {
    const demos = [
      { type: "Feu de Bâtiment", location: "Avenue Paul Séramy, Chessy", vehicles: "FPT, EPA, VSAV", status: "En cours" },
      { type: "Malaise Voie Publique", location: "Gare Marne-la-Vallée", vehicles: "VSAV 1", status: "En cours" },
      { type: "AVP (Accident)", location: "A4 - PK 12 (Vers Paris)", vehicles: "VSR, VSAV 2", status: "En cours" }
    ];
    for (let d of demos) { await addDoc(collection(db, "interventions"), { ...d, timestamp: new Date() }); }
    Alert.alert("Succès", "Interventions générées.");
  };

  const addDocument = async () => {
    if (!docTitle || !docUrl) return Alert.alert("Erreur", "Titre et lien requis.");
    await addDoc(collection(db, "documents"), { title: docTitle, url: docUrl, timestamp: new Date() });
    setDocTitle(''); setDocUrl('');
  };

  const markAlertAsRead = async (alert) => {
    if (!alert.readBy?.includes(currentUser.id)) {
      await updateDoc(doc(db, "alerts", alert.id), { readBy: [...(alert.readBy || []), currentUser.id] });
    }
    Alert.alert(alert.title, alert.content);
  };

  const calculateProgress = (user) => {
    if (!user) return 0;
    const baseTotal = TRAINING_STRUCTURE.reduce((acc, m) => acc + m.goals.length, 0);
    return Math.round(((user.completedGoals?.length || 0) / (baseTotal + (user.customGoals?.length || 0))) * 100) || 0;
  };

  const contactUser = (user) => {
    Alert.alert(`Contacter ${user.name}`, "Comment joindre cet agent ?", [
      { text: "Appeler", onPress: () => Linking.openURL(`tel:${user.identifier}`) },
      { text: "SMS", onPress: () => Linking.openURL(`sms:${user.identifier}`) },
      { text: "Email", onPress: () => Linking.openURL(`mailto:${user.identifier}`) },
      { text: "Annuler", style: "cancel" }
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  const renderContent = () => {
    if (currentPage === 'login') {
      return (
        <SafeAreaView style={styles.loginContainer}>
          <StatusBar barStyle="light-content" />
          {/* BOUTON MODE SOMBRE SUR LE LOGIN */}
          <TouchableOpacity style={styles.themeToggleLogin} onPress={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? <Sun color="#FFF" size={26} /> : <Moon color="#FFF" size={26} />}
          </TouchableOpacity>

          <View style={styles.headerLogin}><ShieldCheck size={70} color="#FFF" /><Text style={styles.brandTitle}>CIS CHESSY</Text></View>
          <View style={styles.loginCard}>
            <Text style={styles.loginCardTitle}>{isRegistering ? "Inscription" : "Connexion"}</Text>
            {isRegistering && <TextInput style={styles.input} placeholderTextColor={colors.textMuted} value={nameInput} onChangeText={setNameInput} placeholder="Nom Complet" />}
            <TextInput style={styles.input} placeholderTextColor={colors.textMuted} value={idInput} onChangeText={setIdInput} placeholder="Identifiant (Tél ou Email)" />
            <TextInput style={styles.input} placeholderTextColor={colors.textMuted} value={passInput} onChangeText={setPassInput} secureTextEntry placeholder="Mot de passe" />
            <TouchableOpacity style={styles.primaryButton} onPress={isRegistering ? handleSignUp : handleLogin}>
              <Text style={styles.buttonText}>{isRegistering ? "ENVOYER DEMANDE" : "SE CONNECTER"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={{marginTop: 20}}>
              <Text style={styles.switchText}>{isRegistering ? "Retour" : "Créer un compte"}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    if (currentPage === 'documents') {
      const isManager = currentUser.role === 'admin' || currentUser.role === 'superviseur';
      return (
        <ScrollView style={styles.padding}>
          <Text style={styles.sectionTitle}>Documents</Text>
          {isManager && (
            <View style={styles.adminForm}>
              <TextInput style={styles.input} placeholderTextColor={colors.textMuted} placeholder="Titre" value={docTitle} onChangeText={setDocTitle} />
              <TextInput style={styles.input} placeholderTextColor={colors.textMuted} placeholder="Lien URL" value={docUrl} onChangeText={setDocUrl} autoCapitalize="none" />
              <TouchableOpacity style={styles.alertSubmit} onPress={addDocument}><Text style={styles.buttonText}>AJOUTER</Text></TouchableOpacity>
            </View>
          )}
          {documents.map(d => (
            <TouchableOpacity key={d.id} style={styles.documentCard} onPress={() => Linking.openURL(d.url).catch(() => Alert.alert("Erreur", "Lien invalide"))}>
              <View style={{flex: 1}}><Text style={styles.documentTitle}>{d.title}</Text><Text style={styles.documentUrl} numberOfLines={1}>{d.url}</Text></View>
              {isManager && <TouchableOpacity onPress={() => deleteDoc(doc(db, "documents", d.id))} style={{padding: 10}}><Trash2 size={20} color={colors.primary} /></TouchableOpacity>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    }

    if (currentPage === 'alerts') {
      return (
        <ScrollView style={styles.padding}>
          <Text style={styles.sectionTitle}>Alertes</Text>
          {alerts.length === 0 ? <Text style={styles.emptyText}>Aucune alerte.</Text> : 
            alerts.map(a => {
              const level = ALERT_LEVELS[a.level];
              const isRead = a.readBy?.includes(currentUser.id);
              return (
                <TouchableOpacity key={a.id} style={[styles.alertItem, { borderLeftColor: level.color }, isRead && {opacity: 0.6}]} onPress={() => markAlertAsRead(a)}>
                  <View style={styles.alertHeader}>
                    <level.icon size={18} color={level.color} /><Text style={[styles.alertLevelText, { color: level.color }]}>{level.label}</Text>
                    {!isRead && <View style={styles.unreadBadge} />}
                  </View>
                  <Text style={styles.alertTitleText}>{a.title}</Text>
                  <Text style={styles.alertDate}>{a.date}</Text>
                  {currentUser.role === 'admin' && <TouchableOpacity onPress={() => deleteDoc(doc(db, "alerts", a.id))} style={styles.deleteAlertBtn}><Trash2 size={16} color={colors.textMuted} /></TouchableOpacity>}
                </TouchableOpacity>
              );
            })
          }
        </ScrollView>
      );
    }

    if (currentPage === 'admin') {
      const pending = users.filter(u => !u.isValidated);
      const members = users.filter(u => u.isValidated && u.id !== currentUser.id);
      return (
        <ScrollView style={styles.padding}>
          <Text style={styles.sectionTitle}>Opérationnel (Démo)</Text>
          <View style={styles.demoCard}>
            <TouchableOpacity style={styles.demoButton} onPress={generateDemoInterventions}>
              <Text style={styles.demoButtonText}>Lancer Interventions (Démo)</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, {marginTop: 30}]}>Diffuser Alerte</Text>
          <View style={styles.adminForm}>
            <TextInput style={styles.input} placeholderTextColor={colors.textMuted} placeholder="Titre" value={alertTitle} onChangeText={setAlertTitle} />
            <TextInput style={[styles.input, {height: 80}]} placeholderTextColor={colors.textMuted} placeholder="Message..." multiline value={alertContent} onChangeText={setAlertContent} />
            <View style={styles.levelRow}>
              {ALERT_LEVELS.map((l, i) => <TouchableOpacity key={l.label} onPress={() => setAlertLevel(i)} style={[styles.levelBtn, alertLevel === i && {backgroundColor: l.color, borderColor: l.color}]}><Text style={[styles.levelBtnText, alertLevel === i && {color: '#FFF'}]}>{l.label}</Text></TouchableOpacity>)}
            </View>
            <TouchableOpacity style={styles.alertSubmit} onPress={createAlert}><Text style={styles.buttonText}>ENVOYER</Text></TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, {marginTop: 30}]}>Recrues</Text>
          {pending.length === 0 && <Text style={styles.emptyText}>Aucune demande en attente.</Text>}
          {pending.map(u => (
            <View key={u.id} style={styles.userCard}>
              <View style={{flex:1}}><Text style={styles.userName}>{u.name}</Text><Text style={styles.userRole}>{u.identifier}</Text></View>
              <View style={{flexDirection:'row', gap: 15, alignItems: 'center'}}>
                <TouchableOpacity onPress={() => contactUser(u)}><Phone size={24} color={colors.info} /></TouchableOpacity>
                <TouchableOpacity onPress={() => deleteDoc(doc(db, "users", u.id))}><XCircle size={28} color={colors.primary} /></TouchableOpacity>
                <TouchableOpacity onPress={() => updateDoc(doc(db, "users", u.id), {isValidated: true})}><CheckCircle size={28} color={colors.success} /></TouchableOpacity>
              </View>
            </View>
          ))}
          
          <Text style={[styles.sectionTitle, {marginTop: 30}]}>Personnel</Text>
          {members.map(u => (
            <View key={u.id} style={styles.userCardMember}>
              <View style={{flex:1}}><Text style={styles.userName}>{u.name}</Text><Text style={[styles.roleBadge, u.role === 'admin' && {color: colors.primary}]}>{u.role.toUpperCase()}</Text></View>
              <View style={{flexDirection:'row', gap: 15, alignItems: 'center'}}>
                <TouchableOpacity onPress={() => contactUser(u)}><Phone size={20} color={colors.info} /></TouchableOpacity>
                <TouchableOpacity onPress={() => Alert.alert("Grade", `Rôle pour ${u.name} :`, [{ text: "Pompier", onPress: () => updateDoc(doc(db, "users", u.id), { role: 'user' }) }, { text: "Superviseur", onPress: () => updateDoc(doc(db, "users", u.id), { role: 'superviseur' }) }, { text: "Admin", onPress: () => updateDoc(doc(db, "users", u.id), { role: 'admin' }) }, { text: "Annuler", style: "cancel" }])}><UserCog size={20} color={colors.textMuted} /></TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      );
    }

    if (currentPage === 'dashboard') {
      const isManager = currentUser.role === 'admin' || currentUser.role === 'superviseur';
      const activeInters = interventions.filter(i => i.status === 'En cours');
      
      let displayedShifts = isManager ? [...shifts] : shifts.filter(s => s.userId === currentUser.id);
      
      const groupedShifts = displayedShifts.reduce((acc, shift) => {
        if (!acc[shift.date]) { acc[shift.date] = []; }
        acc[shift.date].push(shift);
        return acc;
      }, {});
      const sortedDates = Object.keys(groupedShifts).sort((a, b) => a.localeCompare(b));

      return (
        <ScrollView>
          {activeInters.length > 0 && (
            <View style={[styles.padding, styles.dangerZone]}>
              <Text style={[styles.subTitle, {color: colors.primary}]}>DÉPARTS EN COURS :</Text>
              {activeInters.map(inter => (
                <View key={inter.id} style={styles.interCard}>
                  <View style={styles.interHeader}>
                    <Text style={styles.interType}>{inter.type}</Text>
                    {isManager && <TouchableOpacity onPress={() => updateDoc(doc(db, "interventions", inter.id), {status: 'Terminée'})} style={styles.endBtn}><Text style={styles.endBtnText}>Clôturer</Text></TouchableOpacity>}
                  </View>
                  <Text style={styles.interLocation}>{inter.location}</Text>
                  <Text style={styles.interVehicles}>Engins engagés : {inter.vehicles}</Text>
                </View>
              ))}
            </View>
          )}

          <Calendar 
            theme={{ 
              calendarBackground: colors.background,
              textSectionTitleColor: colors.textSub,
              dayTextColor: colors.textMain,
              todayTextColor: colors.primary, 
              selectedDayBackgroundColor: colors.primary,
              monthTextColor: colors.textMain,
              arrowColor: colors.primary,
            }} 
            onDayPress={(day) => Alert.alert(`Garde ${day.dateString}`, "Créneau :", [{ text: "Jour (07h-19h)", onPress: () => addDoc(collection(db, "shifts"), { userId: currentUser.id, userName: currentUser.name, date: day.dateString, slot: "Jour (07h-19h)" }) }, { text: "Nuit (19h-07h)", onPress: () => addDoc(collection(db, "shifts"), { userId: currentUser.id, userName: currentUser.name, date: day.dateString, slot: "Nuit (19h-07h)" }) }, { text: "Annuler", style: "cancel" }])} 
          />
          
          <View style={styles.padding}>
            <Text style={styles.subTitle}>{isManager ? "Planning du personnel :" : "Mes prochaines gardes :"}</Text>
            {sortedDates.length === 0 && <Text style={styles.emptyText}>Aucune garde prévue.</Text>}
            
            {sortedDates.map(date => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>{date}</Text>
                {groupedShifts[date].map(s => (
                  <View key={s.id} style={styles.myShiftRowGrouped}>
                    <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10}}>
                      <Clock size={14} color={colors.primary} />
                      <Text style={{color: colors.textMain, flexShrink: 1}}>
                        {isManager && <Text style={{fontWeight: 'bold'}}>{s.userName} - </Text>}
                        {s.slot}
                      </Text>
                    </View>
                    {(currentUser.role === 'admin' || s.userId === currentUser.id) && (
                      <TouchableOpacity onPress={() => deleteDoc(doc(db, "shifts", s.id))} style={{padding: 5}}>
                        <Trash2 size={18} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      );
    }

    if (currentPage === 'training') {
      const isManager = currentUser.role === 'admin' || currentUser.role === 'superviseur';
      if ((isManager && selectedStagiaire) || !isManager) {
        const target = isManager ? users.find(u => u.id === selectedStagiaire.id) : currentUser;
        const prog = calculateProgress(target);
        return (
          <ScrollView style={styles.padding}>
            {isManager && <TouchableOpacity onPress={() => setSelectedStagiaire(null)}><Text style={styles.backLink}>← Retour</Text></TouchableOpacity>}
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
              <Text style={styles.sectionTitle}>{isManager ? `Dossier ${target.name}` : 'Mon Livret'}</Text>
              {prog === 100 && <TouchableOpacity onPress={() => MailComposer.composeAsync({ recipients: ['archives@chessy.fr'], subject: `Attestation - ${target.name}`, body: `Validation 100% de la formation.` })}><Mail color={colors.success} size={24} /></TouchableOpacity>}
            </View>
            <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${prog}%` }]} /></View>
            <Text style={styles.percentText}>{prog}% validé</Text>
            
            {TRAINING_STRUCTURE.map(m => (
              <View key={m.id} style={styles.folderSection}>
                <Text style={styles.folderSubtitle}>{m.title}</Text>
                {m.goals.map(g => {
                  const done = target.completedGoals?.includes(g);
                  return (
                    <TouchableOpacity key={g} style={styles.goalRow} disabled={!isManager} onPress={() => updateDoc(doc(db, "users", target.id), { completedGoals: done ? target.completedGoals.filter(x => x !== g) : [...(target.completedGoals || []), g] })}>
                      {done ? <CheckSquare size={20} color={colors.info} /> : <Square size={20} color={colors.iconDef} />}
                      <Text style={[styles.goalText, done && {color: colors.info, fontWeight: 'bold'}]}>{g}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            {isManager && (
              <View style={styles.adminForm}>
                <TextInput placeholderTextColor={colors.textMuted} placeholder="Compétence spécifique..." value={newCustomGoal} onChangeText={setNewCustomGoal} style={styles.input} />
                <TouchableOpacity onPress={() => { if(newCustomGoal) { updateDoc(doc(db, "users", target.id), { customGoals: [...(target.customGoals || []), newCustomGoal] }); setNewCustomGoal(''); } }}><Text style={{color: colors.textSub, fontWeight:'bold'}}>+ Ajouter</Text></TouchableOpacity>
              </View>
            )}
            {target.customGoals?.map(g => {
              const done = target.completedGoals?.includes(g);
              return (
                <TouchableOpacity key={g} style={styles.goalRow} disabled={!isManager} onPress={() => updateDoc(doc(db, "users", target.id), { completedGoals: done ? target.completedGoals.filter(x => x !== g) : [...(target.completedGoals || []), g] })}>
                  {done ? <CheckSquare size={20} color={colors.info} /> : <Square size={20} color={colors.iconDef} />}
                  <Text style={[styles.goalText, done && {color: colors.info, fontWeight: 'bold'}]}>{g} (Spé)</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        );
      }
      return (
        <View style={styles.padding}>
          <Text style={styles.sectionTitle}>État de formation</Text>
          {users.filter(u => u.role === 'user').map(u => (
            <TouchableOpacity key={u.id} style={styles.userFolderCard} onPress={() => setSelectedStagiaire(u)}>
              <View><Text style={styles.userName}>{u.name}</Text><Text style={styles.userSub}>{calculateProgress(u)}% validé</Text></View><ChevronRight color={colors.iconDef} />
            </TouchableOpacity>
          ))}
        </View>
      );
    }
  };

  if (!currentUser && !isRegistering && currentPage !== 'login') return null;
  const unreadAlertsCount = alerts.filter(a => !a.readBy?.includes(currentUser?.id)).length;

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      {currentPage !== 'login' && (
        <View style={styles.topNav}>
          <View><Text style={styles.navTitle}>{currentUser?.name || 'CIS CHESSY'}</Text><Text style={styles.roleTag}>{currentUser?.role?.toUpperCase()}</Text></View>
          
          <View style={styles.navActions}>
            <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun color={colors.textMain} size={22} /> : <Moon color={colors.textMain} size={22} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {setCurrentPage('login'); setCurrentUser(null); setIdInput(''); setPassInput('');}} style={styles.logoutBtn}>
              <LogOut size={16} color={colors.primary} />
              <Text style={{color: colors.primary, fontWeight:'bold', marginLeft:5}}>Quitter</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={{flex: 1}}>{renderContent()}</View>
      {currentPage !== 'login' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={() => setCurrentPage('dashboard')} style={styles.navItem}><CalendarIcon size={22} color={currentPage === 'dashboard' ? colors.primary : colors.textSub} /><Text style={[styles.navText, currentPage === 'dashboard' && {color: colors.primary}]}>ACCUEIL</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentPage('alerts')} style={styles.navItem}><View><Bell size={22} color={currentPage === 'alerts' ? colors.primary : colors.textSub} />{unreadAlertsCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadAlertsCount}</Text></View>}</View><Text style={[styles.navText, currentPage === 'alerts' && {color: colors.primary}]}>ALERTES</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentPage('documents')} style={styles.navItem}><BookOpen size={22} color={currentPage === 'documents' ? colors.primary : colors.textSub} /><Text style={[styles.navText, currentPage === 'documents' && {color: colors.primary}]}>DOCS</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => {setCurrentPage('training'); setSelectedStagiaire(null);}} style={styles.navItem}><GraduationCap size={22} color={currentPage === 'training' ? colors.primary : colors.textSub} /><Text style={[styles.navText, currentPage === 'training' && {color: colors.primary}]}>{currentUser?.role === 'user' ? 'LIVRET' : 'FORMATION'}</Text></TouchableOpacity>
          {currentUser?.role === 'admin' && (<TouchableOpacity onPress={() => setCurrentPage('admin')} style={styles.navItem}><Users size={22} color={currentPage === 'admin' ? colors.primary : colors.textSub} /><Text style={[styles.navText, currentPage === 'admin' && {color: colors.primary}]}>ADMIN</Text></TouchableOpacity>)}
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loginContainer: { flex: 1, backgroundColor: colors.loginBg, justifyContent: 'center' },
  themeToggleLogin: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 25, zIndex: 10, padding: 10 },
  headerLogin: { alignItems: 'center', marginBottom: 30 },
  brandTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  loginCard: { backgroundColor: colors.cardBg, marginHorizontal: 30, padding: 25, borderRadius: 25 },
  loginCardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textMain, marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: colors.inputBg, color: colors.textMain, padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: colors.borderAlt },
  primaryButton: { backgroundColor: colors.primary, padding: 18, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: 'bold' },
  switchText: { color: colors.textSub, textAlign: 'center', fontWeight: 'bold' },
  mainContainer: { flex: 1, backgroundColor: colors.background },
  topNav: { paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.navBg, flexDirection: 'row', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 50 : 20 },
  navTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textMain },
  roleTag: { fontSize: 10, color: colors.primary, fontWeight: 'bold' },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center' },
  padding: { padding: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textMain, marginBottom: 15 },
  subTitle: { fontWeight: 'bold', color: colors.textSub, marginBottom: 15 },
  
  dateGroup: { marginBottom: 15, backgroundColor: colors.cardBg, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, elevation: 1 },
  dateHeader: { backgroundColor: colors.loginBg, paddingVertical: 10, paddingHorizontal: 15, color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  myShiftRowGrouped: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.borderAlt, backgroundColor: colors.cardBg },
  
  userName: { fontWeight: 'bold', color: colors.textMain },
  userCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, backgroundColor: colors.successBg, borderRadius: 15, marginBottom: 10 },
  userCardMember: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: colors.cardBg, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.borderAlt },
  roleBadge: { fontSize: 10, fontWeight: '900', color: colors.textSub, marginTop: 4 },
  progressBg: { height: 10, backgroundColor: colors.borderAlt, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.success },
  percentText: { textAlign: 'right', fontSize: 12, fontWeight: 'bold', color: colors.success, marginTop: 5, marginBottom: 20 },
  bottomBar: { flexDirection: 'row', height: 90, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.navBg, justifyContent: 'space-around', alignItems: 'center', paddingBottom: 25 },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 9, marginTop: 5, fontWeight: 'bold', color: colors.textSub },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 20 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  moduleCard: { width: '48%', backgroundColor: colors.cardBgAlt, padding: 12, borderRadius: 15, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.borderAlt },
  moduleTitle: { fontSize: 10, fontWeight: 'bold', marginTop: 5, textAlign: 'center', color: colors.textMain },
  moduleCount: { fontSize: 9, color: colors.primary, fontWeight: 'bold' },
  userFolderCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, backgroundColor: colors.cardBg, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  userSub: { fontSize: 12, color: colors.success, fontWeight: 'bold' },
  backLink: { color: colors.primary, marginBottom: 15, fontWeight: 'bold' },
  folderSection: { marginBottom: 20 },
  folderSubtitle: { fontSize: 16, fontWeight: 'bold', borderBottomWidth: 2, borderBottomColor: colors.borderAlt, color: colors.textMain, paddingBottom: 5, marginBottom: 10 },
  goalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 15 },
  goalText: { fontSize: 14, color: colors.textMain },
  alertItem: { padding: 15, backgroundColor: colors.cardBg, borderRadius: 12, marginBottom: 12, borderLeftWidth: 6, elevation: 2 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 8 },
  alertLevelText: { fontWeight: 'bold', fontSize: 12 },
  alertTitleText: { fontSize: 16, fontWeight: 'bold', color: colors.textMain },
  alertDate: { fontSize: 10, color: colors.textMuted, marginTop: 5 },
  unreadBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  badge: { position: 'absolute', right: -6, top: -4, backgroundColor: colors.primary, borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  adminForm: { backgroundColor: colors.cardBgAlt, padding: 15, borderRadius: 15, borderWidth: 1, borderColor: colors.borderAlt, marginBottom: 20 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  levelBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  levelBtnText: { fontSize: 11, fontWeight: 'bold', color: colors.textMuted },
  alertSubmit: { backgroundColor: colors.loginBg, padding: 12, borderRadius: 10, alignItems: 'center' },
  deleteAlertBtn: { position: 'absolute', right: 10, bottom: 10 },
  userRole: { color: colors.textMuted, fontSize: 12 },
  documentCard: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: colors.cardBg, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.borderAlt, borderLeftWidth: 5, borderLeftColor: colors.textSub },
  documentTitle: { fontSize: 14, fontWeight: 'bold', color: colors.textMain },
  documentUrl: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  demoCard: { backgroundColor: colors.dangerBg, padding: 15, borderRadius: 15, borderWidth: 2, borderColor: colors.dangerBorder, borderStyle: 'dashed' },
  demoButton: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  demoButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  dangerZone: { backgroundColor: colors.dangerBg, borderBottomWidth: 1, borderColor: colors.dangerBorder },
  interCard: { backgroundColor: colors.cardBg, padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.dangerBorder, borderLeftWidth: 6, borderLeftColor: colors.primary, elevation: 2 },
  interHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  interType: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  interLocation: { fontSize: 13, color: colors.textMain, fontWeight: 'bold', marginTop: 5 },
  interVehicles: { fontSize: 12, color: colors.textMuted, marginTop: 5 },
  endBtn: { backgroundColor: colors.inputBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: colors.borderAlt },
  endBtnText: { fontSize: 10, fontWeight: 'bold', color: colors.textMuted }
});