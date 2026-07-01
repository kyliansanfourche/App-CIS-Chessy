import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { ChevronRight, CheckSquare, Square, Mail } from 'lucide-react-native';
import { doc, updateDoc } from 'firebase/firestore';
import * as MailComposer from 'expo-mail-composer';
import { db } from '../firebase';
import { TRAINING_STRUCTURE } from '../constants';
import { calculateProgress } from '../utils/training';
import { safeAction } from '../utils/errors';

export default function TrainingScreen({ colors, styles, currentUser, users, selectedStagiaire, setSelectedStagiaire }) {
  const [newCustomGoal, setNewCustomGoal] = useState('');
  const isManager = currentUser.role === 'admin' || currentUser.role === 'superviseur';

  const toggleGoal = (target, goal, done) => safeAction(
    () => updateDoc(doc(db, 'users', target.id), {
      completedGoals: done ? target.completedGoals.filter((x) => x !== goal) : [...(target.completedGoals || []), goal]
    }),
    { errorTitle: "Impossible de mettre à jour l'objectif" }
  );

  const addCustomGoal = (target) => {
    const goal = newCustomGoal.trim();
    if (!goal) return;
    safeAction(
      () => updateDoc(doc(db, 'users', target.id), { customGoals: [...(target.customGoals || []), goal] }),
      { errorTitle: "Impossible d'ajouter la compétence" }
    ).then((ok) => { if (ok) setNewCustomGoal(''); });
  };

  if ((isManager && selectedStagiaire) || !isManager) {
    const target = isManager ? users.find((u) => u.id === selectedStagiaire.id) : currentUser;
    if (!target) {
      return (
        <ScrollView style={styles.padding}>
          <TouchableOpacity onPress={() => setSelectedStagiaire(null)}><Text style={styles.backLink}>← Retour</Text></TouchableOpacity>
          <Text style={styles.emptyText}>Ce stagiaire n'existe plus.</Text>
        </ScrollView>
      );
    }
    const prog = calculateProgress(target);
    return (
      <ScrollView style={styles.padding}>
        {isManager && <TouchableOpacity onPress={() => setSelectedStagiaire(null)}><Text style={styles.backLink}>← Retour</Text></TouchableOpacity>}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.sectionTitle}>{isManager ? `Dossier ${target.name}` : 'Mon Livret'}</Text>
          {prog === 100 && (
            <TouchableOpacity onPress={() => MailComposer.composeAsync({
              recipients: ['archives@chessy.fr'],
              subject: `Attestation - ${target.name}`,
              body: 'Validation 100% de la formation.'
            }).catch(() => Alert.alert('Erreur', "Impossible d'ouvrir l'application mail."))}>
              <Mail color={colors.success} size={24} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${prog}%` }]} /></View>
        <Text style={styles.percentText}>{prog}% validé</Text>

        {TRAINING_STRUCTURE.map((m) => (
          <View key={m.id} style={styles.folderSection}>
            <Text style={styles.folderSubtitle}>{m.title}</Text>
            {m.goals.map((g) => {
              const done = target.completedGoals?.includes(g);
              return (
                <TouchableOpacity key={g} style={styles.goalRow} disabled={!isManager} onPress={() => toggleGoal(target, g, done)}>
                  {done ? <CheckSquare size={20} color={colors.info} /> : <Square size={20} color={colors.iconDef} />}
                  <Text style={[styles.goalText, done && { color: colors.info, fontWeight: 'bold' }]}>{g}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
        {isManager && (
          <View style={styles.adminForm}>
            <TextInput
              placeholderTextColor={colors.textMuted}
              placeholder="Compétence spécifique..."
              value={newCustomGoal}
              onChangeText={setNewCustomGoal}
              style={styles.input}
              onSubmitEditing={() => addCustomGoal(target)}
            />
            <TouchableOpacity onPress={() => addCustomGoal(target)}>
              <Text style={{ color: colors.textSub, fontWeight: 'bold' }}>+ Ajouter</Text>
            </TouchableOpacity>
          </View>
        )}
        {target.customGoals?.map((g) => {
          const done = target.completedGoals?.includes(g);
          return (
            <TouchableOpacity key={g} style={styles.goalRow} disabled={!isManager} onPress={() => toggleGoal(target, g, done)}>
              {done ? <CheckSquare size={20} color={colors.info} /> : <Square size={20} color={colors.iconDef} />}
              <Text style={[styles.goalText, done && { color: colors.info, fontWeight: 'bold' }]}>{g} (Spé)</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <View style={styles.padding}>
      <Text style={styles.sectionTitle}>État de formation</Text>
      {users.filter((u) => u.role === 'user').map((u) => (
        <TouchableOpacity key={u.id} style={styles.userFolderCard} onPress={() => setSelectedStagiaire(u)}>
          <View>
            <Text style={styles.userName}>{u.name}</Text>
            <Text style={styles.userSub}>{calculateProgress(u)}% validé</Text>
          </View>
          <ChevronRight color={colors.iconDef} />
        </TouchableOpacity>
      ))}
    </View>
  );
}
