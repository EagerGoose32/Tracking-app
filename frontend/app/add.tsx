import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const UNITS = ['mg', 'g', 'ml', 'pills', 'drops', 'puffs', 'doses', 'other'];

export default function AddScreen() {
  const router = useRouter();
  const [substances, setSubstances] = useState([]);
  const [selectedSubstance, setSelectedSubstance] = useState(null);
  const [substanceName, setSubstanceName] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('g');
  const [mood, setMood] = useState('');
  const [effects, setEffects] = useState('');
  const [location, setLocation] = useState('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubstances();
  }, []);

  const fetchSubstances = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/substances`);
      const data = await response.json();
      setSubstances(data);
    } catch (error) {
      console.error('Error fetching substances:', error);
    }
  };

  const handleSubmit = async () => {
    const finalSubstanceName = substanceName.trim() || selectedSubstance?.name;
    
    if (!finalSubstanceName) {
      Alert.alert('Error', 'Please select a substance or enter a name');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const entry = {
        substanceId: selectedSubstance?.id || 'custom',
        substanceName: finalSubstanceName,
        date,
        time,
        amount: parseFloat(amount),
        unit,
        mood,
        effects,
        location,
        comments,
      };

      const response = await fetch(`${BACKEND_URL}/api/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (response.ok) {
        Alert.alert('Success', 'Entry added successfully', [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSelectedSubstance(null);
              setSubstanceName('');
              setDate(format(new Date(), 'yyyy-MM-dd'));
              setTime(format(new Date(), 'HH:mm'));
              setAmount('');
              setUnit('g');
              setMood('');
              setEffects('');
              setLocation('');
              setComments('');
              router.push('/');
            },
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to add entry');
      }
    } catch (error) {
      console.error('Error adding entry:', error);
      Alert.alert('Error', 'Failed to add entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Substance Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Substance *</Text>
            
            {/* Quick Select Chips */}
            <Text style={styles.sublabel}>Quick Select:</Text>
            <View style={styles.substanceGrid}>
              {substances.map((substance) => (
                <TouchableOpacity
                  key={substance.id}
                  style={[
                    styles.substanceChip,
                    selectedSubstance?.id === substance.id && styles.substanceChipSelected,
                    { borderColor: substance.color },
                  ]}
                  onPress={() => {
                    setSelectedSubstance(substance);
                    setSubstanceName(substance.name);
                  }}
                >
                  <Text
                    style={[
                      styles.substanceChipText,
                      selectedSubstance?.id === substance.id &&
                        styles.substanceChipTextSelected,
                    ]}
                  >
                    {substance.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Editable Substance Name */}
            <Text style={[styles.sublabel, { marginTop: 16 }]}>Or type/edit name:</Text>
            <TextInput
              style={styles.input}
              value={substanceName}
              onChangeText={setSubstanceName}
              placeholder="Enter substance name..."
              placeholderTextColor="#6B7280"
            />
          </View>

          {/* Date and Time */}
          <View style={styles.section}>
            <Text style={styles.label}>Date & Time *</Text>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#6B7280"
                />
              </View>
              <View style={styles.halfInput}>
                <TextInput
                  style={styles.input}
                  value={time}
                  onChangeText={setTime}
                  placeholder="HH:MM"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>
          </View>

          {/* Amount and Unit */}
          <View style={styles.section}>
            <Text style={styles.label}>Amount *</Text>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.0"
                  placeholderTextColor="#6B7280"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.halfInput}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.unitRow}>
                    {UNITS.map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[
                          styles.unitButton,
                          unit === u && styles.unitButtonSelected,
                        ]}
                        onPress={() => setUnit(u)}
                      >
                        <Text
                          style={[
                            styles.unitButtonText,
                            unit === u && styles.unitButtonTextSelected,
                          ]}
                        >
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>

          {/* Mood */}
          <View style={styles.section}>
            <Text style={styles.label}>Mood/State</Text>
            <TextInput
              style={styles.input}
              value={mood}
              onChangeText={setMood}
              placeholder="How were you feeling?"
              placeholderTextColor="#6B7280"
            />
          </View>

          {/* Effects */}
          <View style={styles.section}>
            <Text style={styles.label}>Effects</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={effects}
              onChangeText={setEffects}
              placeholder="Describe the effects..."
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.label}>Location Context</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Where were you?"
              placeholderTextColor="#6B7280"
            />
          </View>

          {/* Comments */}
          <View style={styles.section}>
            <Text style={styles.label}>Comments/Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={comments}
              onChangeText={setComments}
              placeholder="Any additional notes..."
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding...' : 'Add Entry'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  sublabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  substanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  substanceChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    borderWidth: 2,
    borderColor: '#374151',
  },
  substanceChipSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  substanceChipText: {
    fontSize: 14,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  substanceChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  input: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    color: '#F9FAFB',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  unitRow: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  unitButtonSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  unitButtonText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  unitButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
