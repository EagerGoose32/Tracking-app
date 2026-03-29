import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function HistoryScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState(null);

  const fetchEntries = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/entries`);
      const data = await response.json();
      setEntries(data);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(() => {
    fetchEntries();
  });

  const onRefresh = () => {
    setRefreshing(true);
    fetchEntries();
  };

  const handleDelete = (entryId, substanceName) => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete this ${substanceName} entry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${BACKEND_URL}/api/entries/${entryId}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                fetchEntries();
              } else {
                Alert.alert('Error', 'Failed to delete entry');
              }
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  const toggleExpand = (entryId) => {
    setExpandedEntry(expandedEntry === entryId ? null : entryId);
  };

  const groupEntriesByDate = () => {
    const grouped = {};
    entries.forEach((entry) => {
      const dateKey = entry.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(entry);
    });
    return grouped;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  const groupedEntries = groupEntriesByDate();
  const dates = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Entry History</Text>
        <Text style={styles.subtitle}>All your tracked entries</Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color="#4B5563" />
          <Text style={styles.emptyText}>No entries yet</Text>
          <Text style={styles.emptySubtext}>Start tracking to see your history</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {dates.map((date) => (
            <View key={date} style={styles.dateGroup}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateText}>
                  {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                </Text>
                <Text style={styles.dateCount}>{groupedEntries[date].length} entries</Text>
              </View>

              {groupedEntries[date].map((entry) => {
                const isExpanded = expandedEntry === entry.id;
                return (
                  <View key={entry.id} style={styles.entryCard}>
                    <TouchableOpacity
                      style={styles.entryHeader}
                      onPress={() => toggleExpand(entry.id)}
                    >
                      <View style={styles.entryLeft}>
                        <Text style={styles.entrySubstance}>{entry.substanceName}</Text>
                        <View style={styles.entryMeta}>
                          <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                          <Text style={styles.entryTime}>{entry.time}</Text>
                          <Text style={styles.entryAmount}>
                            {entry.amount} {entry.unit}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.entryRight}>
                        <TouchableOpacity
                          onPress={() => handleDelete(entry.id, entry.substanceName)}
                          style={styles.deleteButton}
                        >
                          <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color="#9CA3AF"
                        />
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.entryDetails}>
                        {entry.mood && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Mood:</Text>
                            <Text style={styles.detailValue}>{entry.mood}</Text>
                          </View>
                        )}
                        {entry.effects && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Effects:</Text>
                            <Text style={styles.detailValue}>{entry.effects}</Text>
                          </View>
                        )}
                        {entry.location && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Location:</Text>
                            <Text style={styles.detailValue}>{entry.location}</Text>
                          </View>
                        )}
                        {entry.comments && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Comments:</Text>
                            <Text style={styles.detailValue}>{entry.comments}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    padding: 20,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  dateCount: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  entryCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  entryLeft: {
    flex: 1,
  },
  entrySubstance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryTime: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  entryAmount: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 4,
  },
  entryDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  detailRow: {
    marginTop: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#E5E7EB',
    lineHeight: 20,
  },
});
