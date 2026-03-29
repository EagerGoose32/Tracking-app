import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function SettingsScreen() {
  const [substances, setSubstances] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [newSubstanceName, setNewSubstanceName] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('20:00');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  useFocusEffect(() => {
    fetchSubstances();
    fetchReminders();
  });

  const requestNotificationPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    setNotificationsEnabled(finalStatus === 'granted');
  };

  const fetchSubstances = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/substances`);
      const data = await response.json();
      setSubstances(data);
    } catch (error) {
      console.error('Error fetching substances:', error);
    }
  };

  const fetchReminders = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/reminders`);
      const data = await response.json();
      setReminders(data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const handleAddSubstance = async () => {
    if (!newSubstanceName.trim()) {
      Alert.alert('Error', 'Please enter a substance name');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/substances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubstanceName.trim(),
          isCustom: true,
          color: '#8B5CF6',
        }),
      });

      if (response.ok) {
        setNewSubstanceName('');
        fetchSubstances();
        Alert.alert('Success', 'Substance added');
      }
    } catch (error) {
      console.error('Error adding substance:', error);
      Alert.alert('Error', 'Failed to add substance');
    }
  };

  const handleDeleteSubstance = (id, name) => {
    Alert.alert('Delete Substance', `Delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${BACKEND_URL}/api/substances/${id}`, {
              method: 'DELETE',
            });
            fetchSubstances();
          } catch (error) {
            console.error('Error deleting substance:', error);
          }
        },
      },
    ]);
  };

  const handleAddReminder = async () => {
    if (!notificationsEnabled) {
      Alert.alert('Notifications Disabled', 'Please enable notifications to add reminders');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time: newReminderTime,
          enabled: true,
          frequency: 'daily',
        }),
      });

      if (response.ok) {
        const reminder = await response.json();
        await scheduleNotification(reminder);
        fetchReminders();
        Alert.alert('Success', 'Reminder added');
      }
    } catch (error) {
      console.error('Error adding reminder:', error);
      Alert.alert('Error', 'Failed to add reminder');
    }
  };

  const scheduleNotification = async (reminder) => {
    const [hours, minutes] = reminder.time.split(':');
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Track Your Usage',
        body: 'Remember to log your substance use today',
        sound: true,
      },
      trigger: {
        hour: parseInt(hours),
        minute: parseInt(minutes),
        repeats: true,
      },
    });
  };

  const handleToggleReminder = async (id, enabled) => {
    try {
      const reminder = reminders.find((r) => r.id === id);
      await fetch(`${BACKEND_URL}/api/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reminder, enabled: !enabled }),
      });
      fetchReminders();
    } catch (error) {
      console.error('Error toggling reminder:', error);
    }
  };

  const handleDeleteReminder = (id) => {
    Alert.alert('Delete Reminder', 'Remove this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${BACKEND_URL}/api/reminders/${id}`, {
              method: 'DELETE',
            });
            fetchReminders();
          } catch (error) {
            console.error('Error deleting reminder:', error);
          }
        },
      },
    ]);
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/export/csv`);
      const data = await response.json();
      
      const fileUri = FileSystem.documentDirectory + 'substance_tracker_export.csv';
      await FileSystem.writeAsStringAsync(fileUri, data.data);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', 'Export saved to: ' + fileUri);
      }
    } catch (error) {
      console.error('Error exporting:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleInitializeData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/initialize`, {
        method: 'POST',
      });
      const data = await response.json();
      Alert.alert('Success', data.message);
      fetchSubstances();
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your tracking</Text>
      </View>

      {/* Manage Substances */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manage Substances</Text>
        
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            value={newSubstanceName}
            onChangeText={setNewSubstanceName}
            placeholder="Add custom substance..."
            placeholderTextColor="#6B7280"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddSubstance}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.substanceList}>
          {substances.map((substance) => (
            <View key={substance.id} style={styles.substanceItem}>
              <View style={styles.substanceInfo}>
                <View
                  style={[styles.colorDot, { backgroundColor: substance.color }]}
                />
                <Text style={styles.substanceName}>{substance.name}</Text>
                {substance.isCustom && (
                  <View style={styles.customBadge}>
                    <Text style={styles.customBadgeText}>Custom</Text>
                  </View>
                )}
              </View>
              {substance.isCustom && (
                <TouchableOpacity
                  onPress={() => handleDeleteSubstance(substance.id, substance.name)}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.initButton} onPress={handleInitializeData}>
          <Text style={styles.initButtonText}>Initialize Default Substances</Text>
        </TouchableOpacity>
      </View>

      {/* Reminders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tracking Reminders</Text>
        
        {!notificationsEnabled && (
          <View style={styles.warningCard}>
            <Ionicons name="warning-outline" size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              Enable notifications to use reminders
            </Text>
          </View>
        )}

        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            value={newReminderTime}
            onChangeText={setNewReminderTime}
            placeholder="HH:MM"
            placeholderTextColor="#6B7280"
          />
          <TouchableOpacity
            style={[styles.addButton, !notificationsEnabled && styles.addButtonDisabled]}
            onPress={handleAddReminder}
            disabled={!notificationsEnabled}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.reminderList}>
          {reminders.map((reminder) => (
            <View key={reminder.id} style={styles.reminderItem}>
              <View style={styles.reminderInfo}>
                <Ionicons name="time-outline" size={20} color="#8B5CF6" />
                <Text style={styles.reminderTime}>{reminder.time}</Text>
                <Text style={styles.reminderFrequency}>Daily</Text>
              </View>
              <View style={styles.reminderActions}>
                <Switch
                  value={reminder.enabled}
                  onValueChange={() => handleToggleReminder(reminder.id, reminder.enabled)}
                  trackColor={{ false: '#374151', true: '#8B5CF6' }}
                  thumbColor="#FFFFFF"
                />
                <TouchableOpacity onPress={() => handleDeleteReminder(reminder.id)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Export Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Export</Text>
        <TouchableOpacity style={styles.exportButton} onPress={handleExportCSV}>
          <Ionicons name="download-outline" size={20} color="#FFFFFF" />
          <Text style={styles.exportButtonText}>Export as CSV</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>Substance Use Tracker v1.0</Text>
          <Text style={styles.infoSubtext}>Track, analyze, and improve your habits</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  section: {
    padding: 20,
    paddingTop: 0,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 16,
  },
  addRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    color: '#F9FAFB',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  substanceList: {
    gap: 8,
  },
  substanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
  },
  substanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  substanceName: {
    fontSize: 16,
    color: '#F9FAFB',
    fontWeight: '500',
  },
  customBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  customBadgeText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  initButton: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  initButtonText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#F59E0B',
    flex: 1,
  },
  reminderList: {
    gap: 8,
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderTime: {
    fontSize: 16,
    color: '#F9FAFB',
    fontWeight: '600',
  },
  reminderFrequency: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  exportButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#F9FAFB',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
