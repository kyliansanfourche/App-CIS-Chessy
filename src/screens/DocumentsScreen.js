import React, { useState } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { safeAction } from '../utils/errors';

const isLikelyUrl = (value) => /^https?:\/\/.+/i.test(value.trim());

export default function DocumentsScreen({ colors, styles, currentUser, documents, addDocument }) {
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isManager = currentUser.role === 'admin' || currentUser.role === 'superviseur';

  const handleAdd = async () => {
    const title = docTitle.trim();
    const url = docUrl.trim();
    if (!title || !url) return Alert.alert('Erreur', 'Titre et lien requis.');
    if (!isLikelyUrl(url)) return Alert.alert('Erreur', "Le lien doit commencer par http:// ou https://");

    setSubmitting(true);
    const ok = await safeAction(() => addDocument(title, url), { errorTitle: "Impossible d'ajouter le document" });
    setSubmitting(false);
    if (ok) { setDocTitle(''); setDocUrl(''); }
  };

  const handleDelete = (docItem) => {
    Alert.alert('Supprimer', `Supprimer "${docItem.title}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => safeAction(() => deleteDoc(doc(db, 'documents', docItem.id)), { errorTitle: 'Suppression impossible' }) },
    ]);
  };

  return (
    <ScrollView style={styles.padding}>
      <Text style={styles.sectionTitle}>Documents</Text>
      {isManager && (
        <View style={styles.adminForm}>
          <TextInput style={styles.input} placeholderTextColor={colors.textMuted} placeholder="Titre" value={docTitle} onChangeText={setDocTitle} />
          <TextInput style={styles.input} placeholderTextColor={colors.textMuted} placeholder="Lien URL" value={docUrl} onChangeText={setDocUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
          <TouchableOpacity style={styles.alertSubmit} onPress={handleAdd} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>AJOUTER</Text>}
          </TouchableOpacity>
        </View>
      )}
      {documents.length === 0 && <Text style={styles.emptyText}>Aucun document.</Text>}
      {documents.map((d) => (
        <TouchableOpacity
          key={d.id}
          style={styles.documentCard}
          onPress={() => Linking.openURL(d.url).catch(() => Alert.alert('Erreur', 'Lien invalide'))}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.documentTitle}>{d.title}</Text>
            <Text style={styles.documentUrl} numberOfLines={1}>{d.url}</Text>
          </View>
          {isManager && (
            <TouchableOpacity onPress={() => handleDelete(d)} style={{ padding: 10 }}>
              <Trash2 size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
