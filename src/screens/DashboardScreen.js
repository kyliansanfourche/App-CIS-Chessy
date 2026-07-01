import React from 'react';
import { ScrollView, Text, View, TouchableOpacity, Alert } from 'react-native';
import { Clock, Trash2 } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { safeAction } from '../utils/errors';

export default function DashboardScreen({ colors, styles, currentUser, shifts, interventions }) {
  const isManager = currentUser.role === 'admin' || currentUser.role === 'superviseur';
  const activeInters = interventions.filter((i) => i.status === 'En cours');

  const displayedShifts = isManager ? [...shifts] : shifts.filter((s) => s.userId === currentUser.id);
  const groupedShifts = displayedShifts.reduce((acc, shift) => {
    if (!acc[shift.date]) acc[shift.date] = [];
    acc[shift.date].push(shift);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedShifts).sort((a, b) => a.localeCompare(b));

  const addShift = (date, slot) => safeAction(
    () => addDoc(collection(db, 'shifts'), { userId: currentUser.id, userName: currentUser.name, date, slot }),
    { errorTitle: "Impossible d'ajouter la garde" }
  );

  const onDayPress = (day) => {
    Alert.alert(`Garde ${day.dateString}`, 'Créneau :', [
      { text: 'Jour (07h-19h)', onPress: () => addShift(day.dateString, 'Jour (07h-19h)') },
      { text: 'Nuit (19h-07h)', onPress: () => addShift(day.dateString, 'Nuit (19h-07h)') },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const closeIntervention = (interId) => safeAction(
    () => updateDoc(doc(db, 'interventions', interId), { status: 'Terminée' }),
    { errorTitle: 'Impossible de clôturer' }
  );

  const removeShift = (shiftId) => safeAction(
    () => deleteDoc(doc(db, 'shifts', shiftId)),
    { errorTitle: 'Suppression impossible' }
  );

  return (
    <ScrollView>
      {activeInters.length > 0 && (
        <View style={[styles.padding, styles.dangerZone]}>
          <Text style={[styles.subTitle, { color: colors.primary }]}>DÉPARTS EN COURS :</Text>
          {activeInters.map((inter) => (
            <View key={inter.id} style={styles.interCard}>
              <View style={styles.interHeader}>
                <Text style={styles.interType}>{inter.type}</Text>
                {isManager && (
                  <TouchableOpacity onPress={() => closeIntervention(inter.id)} style={styles.endBtn}>
                    <Text style={styles.endBtnText}>Clôturer</Text>
                  </TouchableOpacity>
                )}
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
        onDayPress={onDayPress}
      />

      <View style={styles.padding}>
        <Text style={styles.subTitle}>{isManager ? 'Planning du personnel :' : 'Mes prochaines gardes :'}</Text>
        {sortedDates.length === 0 && <Text style={styles.emptyText}>Aucune garde prévue.</Text>}

        {sortedDates.map((date) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{date}</Text>
            {groupedShifts[date].map((s) => (
              <View key={s.id} style={styles.myShiftRowGrouped}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Clock size={14} color={colors.primary} />
                  <Text style={{ color: colors.textMain, flexShrink: 1 }}>
                    {isManager && <Text style={{ fontWeight: 'bold' }}>{s.userName} - </Text>}
                    {s.slot}
                  </Text>
                </View>
                {(currentUser.role === 'admin' || s.userId === currentUser.id) && (
                  <TouchableOpacity onPress={() => removeShift(s.id)} style={{ padding: 5 }}>
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
