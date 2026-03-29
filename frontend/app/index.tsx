import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { startOfWeek, addDays, format, isSameDay, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { getAllEntries, getStats } from '../services/database';

export default function HomeScreen() {
  const [entries, setEntries] = useState<any[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const fetchData = async () => {
    try {
      const entriesData = await getAllEntries();
      setEntries(entriesData);

      const statsData = await getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(() => {
    fetchData();
  });

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const goToNextWeek = () => {
    const nextWeek = addDays(currentWeekStart, 7);
    if (nextWeek <= new Date()) {
      setCurrentWeekStart(nextWeek);
    }
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const hasEntryOnDay = (date: Date) => {
    return entries.some((entry) => {
      try {
        const entryDate = parseISO(entry.date);
        return isSameDay(entryDate, date);
      } catch {
        return false;
      }
    });
  };

  const getEntriesForDay = (date: Date) => {
    return entries.filter((entry) => {
      try {
        const entryDate = parseISO(entry.date);
        return isSameDay(entryDate, date);
      } catch {
        return false;
      }
    });
  };

  const currentWeekEntries = entries.filter((entry) => {
    try {
      const entryDate = parseISO(entry.date);
      return (
        entryDate >= currentWeekStart &&
        entryDate < addDays(currentWeekStart, 7)
      );
    } catch {
      return false;
    }
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Substance Tracker</Text>
        <Text style={styles.subtitle}>Track your usage and build better habits • Offline Mode</Text>
      </View>

      {/* Week Navigation */}
      <View style={styles.weekNavigation}>
        <TouchableOpacity onPress={goToPreviousWeek} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#8B5CF6" />
        </TouchableOpacity>
        <View style={styles.weekInfo}>
          <Text style={styles.weekText}>
            {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
          </Text>
          {!isSameDay(currentWeekStart, startOfWeek(new Date(), { weekStartsOn: 1 })) && (
            <TouchableOpacity onPress={goToCurrentWeek}>
              <Text style={styles.todayButton}>Today</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={goToNextWeek}
          style={[
            styles.navButton,
            addDays(currentWeekStart, 7) > new Date() && styles.navButtonDisabled,
          ]}
          disabled={addDays(currentWeekStart, 7) > new Date()}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={addDays(currentWeekStart, 7) > new Date() ? '#4B5563' : '#8B5CF6'}
          />
        </TouchableOpacity>
      </View>

      {/* Week View with Dots */}
      <View style={styles.weekContainer}>
        {weekDays.map((day, index) => {
          const hasEntry = hasEntryOnDay(day);
          const dayEntries = getEntriesForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <View key={index} style={styles.dayColumn}>
              <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>
                {format(day, 'EEE')}
              </Text>
              <Text style={[styles.dateLabel, isToday && styles.todayLabel]}>
                {format(day, 'd')}
              </Text>
              <View style={styles.dotContainer}>
                <View
                  style={[
                    styles.dot,
                    hasEntry && styles.dotActive,
                    isToday && styles.dotToday,
                  ]}
                >
                  {dayEntries.length > 1 && (
                    <Text style={styles.dotCount}>{dayEntries.length}</Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Week Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>This Week</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{currentWeekEntries.length}</Text>
            <Text style={styles.summaryLabel}>Entries</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {new Set(currentWeekEntries.map((e) => e.substanceName)).size}
            </Text>
            <Text style={styles.summaryLabel}>Substances</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {currentWeekEntries.filter((e) => hasEntryOnDay(parseISO(e.date))).length > 0
                ? Math.round(
                    (new Set(
                      currentWeekEntries.map((e) => format(parseISO(e.date), 'yyyy-MM-dd'))
                    ).size /
                      7) *
                      100
                  ) + '%'
                : '0%'}
            </Text>
            <Text style={styles.summaryLabel}>Days Active</Text>
          </View>
        </View>
      </View>

      {/* Overall Stats */}
      {stats && (
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Overall Statistics</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Entries:</Text>
            <Text style={styles.statValue}>{stats.totalEntries}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Weekly Average:</Text>
            <Text style={styles.statValue}>{stats.weeklyAverage}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Most Used:</Text>
            <Text style={styles.statValue}>{stats.mostUsedSubstance}</Text>
          </View>
        </View>
      )}

      {/* Recent Entries */}
      {currentWeekEntries.length > 0 && (
        <View style={styles.recentCard}>
          <Text style={styles.cardTitle}>Recent Entries This Week</Text>
          {currentWeekEntries.slice(0, 5).map((entry, index) => (
            <View key={index} style={styles.entryItem}>
              <View style={styles.entryLeft}>
                <Text style={styles.entrySubstance}>{entry.substanceName}</Text>
                <Text style={styles.entryDetails}>
                  {entry.amount} {entry.unit}
                </Text>
              </View>
              <View style={styles.entryRight}>
                <Text style={styles.entryDate}>{format(parseISO(entry.date), 'MMM d')}</Text>
                <Text style={styles.entryTime}>{entry.time}</Text>
              </View>
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
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  weekInfo: {
    alignItems: 'center',
  },
  weekText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  todayButton: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  dayColumn: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '600',
  },
  dateLabel: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 8,
  },
  todayLabel: {
    color: '#8B5CF6',
  },
  dotContainer: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4B5563',
  },
  dotActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#A78BFA',
  },
  dotToday: {
    borderColor: '#10B981',
    borderWidth: 3,
  },
  dotCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#1F2937',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statsCard: {
    backgroundColor: '#1F2937',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  recentCard: {
    backgroundColor: '#1F2937',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  entryLeft: {
    flex: 1,
  },
  entrySubstance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  entryDetails: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  entryRight: {
    alignItems: 'flex-end',
  },
  entryDate: {
    fontSize: 14,
    color: '#8B5CF6',
    marginBottom: 2,
  },
  entryTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
