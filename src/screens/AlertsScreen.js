import React from 'react';
import { ScrollView, Text, View, TouchableOpacity, Alert } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ALERT_LEVELS } from '../constants';
import { safeAction } from '../utils/errors';

export default function AlertsScreen({ colors, styles, currentUser, alerts }) {
  const markAlertAsRead = (alertItem) => {
    if (!alertItem.readBy?.includes(currentUser.id)) {
      safeAction(
        () => updateDoc(doc(db, 'alerts', alertItem.id), { readBy: [...(alertItem.readBy || []), currentUser.id] }),
        { errorTitle: "Impossible de marquer l'alerte comme lue" }
      );
    }
    Alert.alert(alertItem.title, alertItem.content);
  };

  const handleDelete = (alertItem) => {
    Alert.alert('Supprimer', "Supprimer cette alerte ?", [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => safeAction(() => deleteDoc(doc(db, 'alerts', alertItem.id)), { errorTitle: 'Suppression impossible' }) },
    ]);
  };

  return (
    <ScrollView style={styles.padding}>
      <Text style={styles.sectionTitle}>Alertes</Text>
      {alerts.length === 0 ? <Text style={styles.emptyText}>Aucune alerte.</Text> : (
        alerts.map((a) => {
          const level = ALERT_LEVELS[a.level] || ALERT_LEVELS[0];
          const isRead = a.readBy?.includes(currentUser.id);
          return (
            <TouchableOpacity
              key={a.id}
              style={[styles.alertItem, { borderLeftColor: level.color }, isRead && { opacity: 0.6 }]}
              onPress={() => markAlertAsRead(a)}
            >
              <View style={styles.alertHeader}>
                <level.icon size={18} color={level.color} />
                <Text style={[styles.alertLevelText, { color: level.color }]}>{level.label}</Text>
                {!isRead && <View style={styles.unreadBadge} />}
              </View>
              <Text style={styles.alertTitleText}>{a.title}</Text>
              <Text style={styles.alertDate}>{a.date}</Text>
              {currentUser.role === 'admin' && (
                <TouchableOpacity onPress={() => handleDelete(a)} style={styles.deleteAlertBtn}>
                  <Trash2 size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}
