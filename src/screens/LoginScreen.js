import React, { useState } from 'react';
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity, StatusBar,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { ShieldCheck, Moon, Sun, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen({
  colors, styles, isDarkMode, onToggleTheme,
  isRegistering, setIsRegistering,
  idInput, setIdInput, passInput, setPassInput, nameInput, setNameInput,
  onLogin, onSignUp,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (isRegistering) {
        await onSignUp();
      } else {
        await onLogin();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.loginContainer}>
      <StatusBar barStyle="light-content" />
      <TouchableOpacity style={styles.themeToggleLogin} onPress={onToggleTheme} accessibilityLabel="Changer de thème">
        {isDarkMode ? <Sun color="#FFF" size={26} /> : <Moon color="#FFF" size={26} />}
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View style={styles.headerLogin}>
            <ShieldCheck size={70} color="#FFF" />
            <Text style={styles.brandTitle}>CIS CHESSY</Text>
          </View>
          <View style={styles.loginCard}>
            <Text style={styles.loginCardTitle}>{isRegistering ? 'Inscription' : 'Connexion'}</Text>

            {isRegistering && (
              <TextInput
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Nom Complet"
                autoCapitalize="words"
              />
            )}
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              value={idInput}
              onChangeText={setIdInput}
              placeholder="Identifiant (Tél ou Email)"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            <View style={styles.inputRow}>
              <TextInput
                style={styles.inputRowField}
                placeholderTextColor={colors.textMuted}
                value={passInput}
                onChangeText={setPassInput}
                secureTextEntry={!showPassword}
                placeholder="Mot de passe"
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.inputRowIcon} onPress={() => setShowPassword((v) => !v)} accessibilityLabel="Afficher le mot de passe">
                {showPassword ? <EyeOff size={20} color={colors.textMuted} /> : <Eye size={20} color={colors.textMuted} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.buttonText}>{isRegistering ? 'ENVOYER DEMANDE' : 'SE CONNECTER'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={{ marginTop: 20 }} disabled={submitting}>
              <Text style={styles.switchText}>{isRegistering ? 'Retour' : 'Créer un compte'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
