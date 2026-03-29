import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { format, parseISO, startOfWeek, addDays, subWeeks } from 'date-fns';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { getAllEntries, getStats } from '../services/database';

const screenWidth = Dimensions.get('window').width;

export default function TrendsScreen() {
  const [entries, setEntries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const entriesData = await getAllEntries();
      const statsData = await getStats();
      setEntries(entriesData);
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

  const getWeeklyData = () => {
    const weeks = [];
    const now = new Date();
    
    // Get last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      
      const weekEntries = entries.filter((entry) => {
        const entryDate = parseISO(entry.date);
        return entryDate >= weekStart && entryDate <= weekEnd;
      });
      
      weeks.push({
        label: format(weekStart, 'MMM d'),
        value: weekEntries.length,
        frontColor: '#8B5CF6',
      });
    }
    
    return weeks;
  };

  const getSubstanceData = () => {
    if (!stats || !stats.substanceBreakdown) return [];
    
    const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];
    
    return Object.entries(stats.substanceBreakdown).map(([name, count], index) => ({
      label: name.length > 10 ? name.substring(0, 10) + '...' : name,
      value: count as number,
      frontColor: colors[index % colors.length],
    }));
  };

  const getDailyTrendData = () => {
    const days = [];
    const now = new Date();
    
    // Get last 14 days
    for (let i = 13; i >= 0; i--) {
      const date = addDays(now, -i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayEntries = entries.filter((entry) => entry.date === dateStr);
      
      days.push({
        value: dayEntries.length,
        dataPointText: dayEntries.length > 0 ? dayEntries.length.toString() : '',
      });
    }
    
    return days;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  const weeklyData = getWeeklyData();
  const substanceData = getSubstanceData();
  const dailyTrendData = getDailyTrendData();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Trends & Analytics</Text>
        <Text style={styles.subtitle}>Visualize your patterns • Local data</Text>
      </View>

      {/* Statistics Cards */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalEntries}</Text>
            <Text style={styles.statLabel}>Total Entries</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.weeklyAverage}</Text>
            <Text style={styles.statLabel}>Weekly Avg</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {Object.keys(stats.substanceBreakdown || {}).length}
            </Text>
            <Text style={styles.statLabel}>Substances</Text>
          </View>
        </View>
      )}

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data to display</Text>
          <Text style={styles.emptySubtext}>Start tracking to see trends</Text>
        </View>
      ) : (
        <>
          {/* Daily Trend Line Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>14-Day Activity Trend</Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={dailyTrendData}
                width={screenWidth - 80}
                height={200}
                spacing={((screenWidth - 80) / 14) - 10}
                thickness={3}
                color="#8B5CF6"
                hideDataPoints={false}
                dataPointsColor="#8B5CF6"
                dataPointsRadius={4}
                startFillColor="#8B5CF6"
                endFillColor="#1F2937"
                startOpacity={0.4}
                endOpacity={0.1}
                initialSpacing={10}
                noOfSections={4}
                yAxisColor="#374151"
                xAxisColor="#374151"
                yAxisTextStyle={styles.axisText}
                hideRules={true}
                curved={true}
                areaChart={true}
              />
            </View>
          </View>

          {/* Weekly Bar Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>8-Week Overview</Text>
            <View style={styles.chartContainer}>
              <BarChart
                data={weeklyData}
                width={screenWidth - 80}
                height={200}
                barWidth={(screenWidth - 120) / 8 - 10}
                spacing={(screenWidth - 120) / 8 - 10}
                noOfSections={4}
                barBorderRadius={4}
                frontColor="#8B5CF6"
                yAxisColor="#374151"
                xAxisColor="#374151"
                yAxisTextStyle={styles.axisText}
                xAxisLabelTextStyle={styles.axisLabelText}
                hideRules={true}
                initialSpacing={10}
              />
            </View>
          </View>

          {/* Substance Breakdown */}
          {substanceData.length > 0 && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Substance Breakdown</Text>
              <View style={styles.chartContainer}>
                <BarChart
                  data={substanceData}
                  width={screenWidth - 80}
                  height={200}
                  barWidth={40}
                  spacing={20}
                  noOfSections={4}
                  barBorderRadius={4}
                  yAxisColor="#374151"
                  xAxisColor="#374151"
                  yAxisTextStyle={styles.axisText}
                  xAxisLabelTextStyle={styles.axisLabelText}
                  hideRules={true}
                  initialSpacing={10}
                />
              </View>
            </View>
          )}

          {/* Most Used Substance */}
          {stats && stats.mostUsedSubstance !== 'None' && (
            <View style={styles.highlightCard}>
              <Text style={styles.highlightLabel}>Most Used Substance</Text>
              <Text style={styles.highlightValue}>{stats.mostUsedSubstance}</Text>
              <Text style={styles.highlightCount}>
                {stats.substanceBreakdown[stats.mostUsedSubstance]} entries
              </Text>
            </View>
          )}
        </>
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
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
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  chartCard: {
    backgroundColor: '#1F2937',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  axisText: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  axisLabelText: {
    color: '#9CA3AF',
    fontSize: 10,
    textAlign: 'center',
  },
  highlightCard: {
    backgroundColor: '#1F2937',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  highlightLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  highlightValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  highlightCount: {
    fontSize: 14,
    color: '#E5E7EB',
  },
});
