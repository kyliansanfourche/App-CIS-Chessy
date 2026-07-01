import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { addDoc, collection } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { db } from './src/firebase';
import { useAppData } from './src/hooks/useAppData';
import { getColors, getStyles } from './src/theme';
import { safeAction } from './src/utils/errors';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import DocumentsScreen from './src/screens/DocumentsScreen';
import TrainingScreen from './src/screens/TrainingScreen';
import AdminScreen from './src/screens/AdminScreen';
import TopNav from './src/components/TopNav';
import BottomNav from './src/components/BottomNav';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Normalise un identifiant pour la comparaison de connexion (espaces superflus, casse d'email).
// Appliqué uniquement à la comparaison, jamais aux données déjà stockées : les comptes créés
// avant cette mise à jour continuent de fonctionner sans migration.
const normalizeIdentifier = (value) => (value || '').trim().toLowerCase();

export default function App() {
  const { loading, error, retry, users, shifts, alerts, documents, interventions } = useAppData();

  const [currentPage, setCurrentPage] = useState('login');
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedStagiaire, setSelectedStagiaire] = useState(null);

  const [idInput, setIdInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  const colors = getColors(isDarkMode);
  const styles = getStyles(colors);

  const handleLogin = async () => {
    const normalizedInput = normalizeIdentifier(idInput);
    const password = passInput.trim();
    const user = users.find(
      (u) => normalizeIdentifier(u.identifier) === normalizedInput && u.password === password
    );
    if (!user) return Alert.alert('Erreur', 'Identifiant ou mot de passe incorrect.');
    if (!user.isValidated) return Alert.alert('Accès Refusé', 'Compte en attente de validation.');
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleSignUp = async () => {
    const name = nameInput.trim();
    const identifier = idInput.trim();
    const password = passInput.trim();
    if (!identifier || !password || !name) return Alert.alert('Erreur', 'Veuillez tout remplir.');
    if (password.length < 4) return Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 4 caractères.');

    const alreadyExists = users.some((u) => normalizeIdentifier(u.identifier) === normalizeIdentifier(identifier));
    if (alreadyExists) return Alert.alert('Erreur', 'Un compte existe déjà avec cet identifiant.');

    const ok = await safeAction(
      () => addDoc(collection(db, 'users'), {
        name, identifier, password, role: 'user', isValidated: false, completedGoals: [], customGoals: []
      }),
      { errorTitle: "Impossible d'envoyer la demande" }
    );
    if (!ok) return;
    Alert.alert('Succès', 'Demande envoyée au centre.');
    setIsRegistering(false);
    setIdInput(''); setPassInput(''); setNameInput('');
  };

  const addDocument = (title, url) => addDoc(collection(db, 'documents'), { title, url, timestamp: new Date() });

  const handleLogout = () => {
    setCurrentPage('login');
    setCurrentUser(null);
    setIdInput('');
    setPassInput('');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centerPadded}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retry}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const renderContent = () => {
    if (currentPage === 'login' || !currentUser) {
      return (
        <LoginScreen
          colors={colors} styles={styles}
          isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode((v) => !v)}
          isRegistering={isRegistering} setIsRegistering={setIsRegistering}
          idInput={idInput} setIdInput={setIdInput}
          passInput={passInput} setPassInput={setPassInput}
          nameInput={nameInput} setNameInput={setNameInput}
          onLogin={handleLogin} onSignUp={handleSignUp}
        />
      );
    }

    switch (currentPage) {
      case 'documents':
        return <DocumentsScreen colors={colors} styles={styles} currentUser={currentUser} documents={documents} addDocument={addDocument} />;
      case 'alerts':
        return <AlertsScreen colors={colors} styles={styles} currentUser={currentUser} alerts={alerts} />;
      case 'admin':
        return currentUser.role === 'admin'
          ? <AdminScreen colors={colors} styles={styles} currentUser={currentUser} users={users} />
          : null;
      case 'training':
        return (
          <TrainingScreen
            colors={colors} styles={styles} currentUser={currentUser} users={users}
            selectedStagiaire={selectedStagiaire} setSelectedStagiaire={setSelectedStagiaire}
          />
        );
      case 'dashboard':
      default:
        return <DashboardScreen colors={colors} styles={styles} currentUser={currentUser} shifts={shifts} interventions={interventions} />;
    }
  };

  if (currentPage === 'login' || !currentUser) {
    return (
      <SafeAreaView style={styles.mainContainer}>
        {renderContent()}
      </SafeAreaView>
    );
  }

  const unreadAlertsCount = alerts.filter((a) => !a.readBy?.includes(currentUser.id)).length;

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <TopNav
        currentUser={currentUser} isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((v) => !v)} onLogout={handleLogout}
        colors={colors} styles={styles}
      />
      <View style={{ flex: 1 }}>{renderContent()}</View>
      <BottomNav
        currentPage={currentPage}
        onNavigate={(page) => { setCurrentPage(page); if (page === 'training') setSelectedStagiaire(null); }}
        currentUser={currentUser} unreadAlertsCount={unreadAlertsCount}
        colors={colors} styles={styles}
      />
    </SafeAreaView>
  );
}
