import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar as CalendarIcon, Bell, BookOpen, GraduationCap, Users } from 'lucide-react-native';

export default function BottomNav({ currentPage, onNavigate, currentUser, unreadAlertsCount, colors, styles }) {
  return (
    <View style={styles.bottomBar}>
      <TouchableOpacity onPress={() => onNavigate('dashboard')} style={styles.navItem}>
        <CalendarIcon size={22} color={currentPage === 'dashboard' ? colors.primary : colors.textSub} />
        <Text style={[styles.navText, currentPage === 'dashboard' && { color: colors.primary }]}>ACCUEIL</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onNavigate('alerts')} style={styles.navItem}>
        <View>
          <Bell size={22} color={currentPage === 'alerts' ? colors.primary : colors.textSub} />
          {unreadAlertsCount > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{unreadAlertsCount}</Text></View>
          )}
        </View>
        <Text style={[styles.navText, currentPage === 'alerts' && { color: colors.primary }]}>ALERTES</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onNavigate('documents')} style={styles.navItem}>
        <BookOpen size={22} color={currentPage === 'documents' ? colors.primary : colors.textSub} />
        <Text style={[styles.navText, currentPage === 'documents' && { color: colors.primary }]}>DOCS</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onNavigate('training')} style={styles.navItem}>
        <GraduationCap size={22} color={currentPage === 'training' ? colors.primary : colors.textSub} />
        <Text style={[styles.navText, currentPage === 'training' && { color: colors.primary }]}>
          {currentUser?.role === 'user' ? 'LIVRET' : 'FORMATION'}
        </Text>
      </TouchableOpacity>

      {currentUser?.role === 'admin' && (
        <TouchableOpacity onPress={() => onNavigate('admin')} style={styles.navItem}>
          <Users size={22} color={currentPage === 'admin' ? colors.primary : colors.textSub} />
          <Text style={[styles.navText, currentPage === 'admin' && { color: colors.primary }]}>ADMIN</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
