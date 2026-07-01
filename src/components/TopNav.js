import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LogOut, Moon, Sun } from 'lucide-react-native';

export default function TopNav({ currentUser, isDarkMode, onToggleTheme, onLogout, colors, styles }) {
  return (
    <View style={styles.topNav}>
      <View>
        <Text style={styles.navTitle}>{currentUser?.name || 'CIS CHESSY'}</Text>
        <Text style={styles.roleTag}>{currentUser?.role?.toUpperCase()}</Text>
      </View>

      <View style={styles.navActions}>
        <TouchableOpacity onPress={onToggleTheme} accessibilityLabel="Changer de thème">
          {isDarkMode ? <Sun color={colors.textMain} size={22} /> : <Moon color={colors.textMain} size={22} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <LogOut size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: 'bold', marginLeft: 5 }}>Quitter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
