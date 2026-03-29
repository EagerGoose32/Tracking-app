import * as SQLite from 'expo-sqlite';

const DB_NAME = 'substanceTracker.db';

let db: SQLite.SQLiteDatabase | null = null;

// Initialize database
export const initDatabase = async () => {
  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    
    // Create tables
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS substances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        isCustom INTEGER DEFAULT 0,
        color TEXT DEFAULT '#8B5CF6'
      );
      
      CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        substanceId TEXT NOT NULL,
        substanceName TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        amount REAL NOT NULL,
        unit TEXT NOT NULL,
        mood TEXT,
        effects TEXT,
        location TEXT,
        comments TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        time TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        frequency TEXT DEFAULT 'daily'
      );
      
      CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
      CREATE INDEX IF NOT EXISTS idx_entries_substance ON entries(substanceName);
    `);
    
    // Initialize default substances if table is empty
    const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM substances');
    if (result && (result as any).count === 0) {
      await initializeDefaultSubstances();
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Initialize default substances
const initializeDefaultSubstances = async () => {
  if (!db) return;
  
  const defaultSubstances = [
    { name: 'Weed', isCustom: 0, color: '#10B981' },
    { name: 'Kratom', isCustom: 0, color: '#8B5CF6' },
    { name: 'Benzos', isCustom: 0, color: '#3B82F6' },
    { name: 'Psychedelics', isCustom: 0, color: '#EC4899' },
    { name: 'Alcohol', isCustom: 0, color: '#F59E0B' },
    { name: 'Stimulants', isCustom: 0, color: '#EF4444' },
  ];
  
  for (const substance of defaultSubstances) {
    await db.runAsync(
      'INSERT INTO substances (name, isCustom, color) VALUES (?, ?, ?)',
      [substance.name, substance.isCustom, substance.color]
    );
  }
};

// Substances CRUD
export const getAllSubstances = async () => {
  if (!db) throw new Error('Database not initialized');
  return await db.getAllAsync('SELECT * FROM substances ORDER BY isCustom, name');
};

export const createSubstance = async (substance: { name: string; isCustom: boolean; color: string }) => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.runAsync(
    'INSERT INTO substances (name, isCustom, color) VALUES (?, ?, ?)',
    [substance.name, substance.isCustom ? 1 : 0, substance.color]
  );
  return { id: result.lastInsertRowId, ...substance };
};

export const deleteSubstance = async (id: number) => {
  if (!db) throw new Error('Database not initialized');
  await db.runAsync('DELETE FROM substances WHERE id = ?', [id]);
};

// Entries CRUD
export const getAllEntries = async (startDate?: string, endDate?: string) => {
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM entries';
  const params: any[] = [];
  
  if (startDate && endDate) {
    query += ' WHERE date >= ? AND date <= ?';
    params.push(startDate, endDate);
  }
  
  query += ' ORDER BY date DESC, time DESC';
  
  return await db.getAllAsync(query, params);
};

export const createEntry = async (entry: any) => {
  if (!db) throw new Error('Database not initialized');
  
  const result = await db.runAsync(
    `INSERT INTO entries (substanceId, substanceName, date, time, amount, unit, mood, effects, location, comments)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.substanceId,
      entry.substanceName,
      entry.date,
      entry.time,
      entry.amount,
      entry.unit,
      entry.mood || '',
      entry.effects || '',
      entry.location || '',
      entry.comments || '',
    ]
  );
  
  return { id: result.lastInsertRowId, ...entry };
};

export const updateEntry = async (id: number, entry: any) => {
  if (!db) throw new Error('Database not initialized');
  
  await db.runAsync(
    `UPDATE entries SET substanceId = ?, substanceName = ?, date = ?, time = ?, 
     amount = ?, unit = ?, mood = ?, effects = ?, location = ?, comments = ?
     WHERE id = ?`,
    [
      entry.substanceId,
      entry.substanceName,
      entry.date,
      entry.time,
      entry.amount,
      entry.unit,
      entry.mood || '',
      entry.effects || '',
      entry.location || '',
      entry.comments || '',
      id,
    ]
  );
  
  return { id, ...entry };
};

export const deleteEntry = async (id: number) => {
  if (!db) throw new Error('Database not initialized');
  await db.runAsync('DELETE FROM entries WHERE id = ?', [id]);
};

// Stats
export const getStats = async () => {
  if (!db) throw new Error('Database not initialized');
  
  const entries = await db.getAllAsync('SELECT substanceName, date FROM entries');
  
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      substanceBreakdown: {},
      weeklyAverage: 0,
      mostUsedSubstance: 'None',
    };
  }
  
  const substanceBreakdown: { [key: string]: number } = {};
  const uniqueDates = new Set<string>();
  
  entries.forEach((entry: any) => {
    substanceBreakdown[entry.substanceName] = (substanceBreakdown[entry.substanceName] || 0) + 1;
    uniqueDates.add(entry.date);
  });
  
  const mostUsed = Object.entries(substanceBreakdown).sort((a, b) => b[1] - a[1])[0];
  const weeklyAverage = entries.length / Math.max(1, uniqueDates.size / 7);
  
  return {
    totalEntries: entries.length,
    substanceBreakdown,
    weeklyAverage: Math.round(weeklyAverage * 100) / 100,
    mostUsedSubstance: mostUsed ? mostUsed[0] : 'None',
  };
};

// Reminders CRUD
export const getAllReminders = async () => {
  if (!db) throw new Error('Database not initialized');
  return await db.getAllAsync('SELECT * FROM reminders ORDER BY time');
};

export const createReminder = async (reminder: { time: string; enabled: boolean; frequency: string }) => {
  if (!db) throw new Error('Database not initialized');
  
  const result = await db.runAsync(
    'INSERT INTO reminders (time, enabled, frequency) VALUES (?, ?, ?)',
    [reminder.time, reminder.enabled ? 1 : 0, reminder.frequency]
  );
  
  return { id: result.lastInsertRowId, ...reminder };
};

export const updateReminder = async (id: number, reminder: any) => {
  if (!db) throw new Error('Database not initialized');
  
  await db.runAsync(
    'UPDATE reminders SET time = ?, enabled = ?, frequency = ? WHERE id = ?',
    [reminder.time, reminder.enabled ? 1 : 0, reminder.frequency, id]
  );
  
  return { id, ...reminder };
};

export const deleteReminder = async (id: number) => {
  if (!db) throw new Error('Database not initialized');
  await db.runAsync('DELETE FROM reminders WHERE id = ?', [id]);
};

// Export data
export const exportToCSV = async () => {
  if (!db) throw new Error('Database not initialized');
  
  const entries = await db.getAllAsync('SELECT * FROM entries ORDER BY date DESC');
  
  const csvLines = ['Date,Time,Substance,Amount,Unit,Mood,Effects,Location,Comments'];
  entries.forEach((entry: any) => {
    csvLines.push(
      `${entry.date},${entry.time},${entry.substanceName},${entry.amount},${entry.unit},${entry.mood || ''},${entry.effects || ''},${entry.location || ''},${entry.comments || ''}`
    );
  });
  
  return csvLines.join('\n');
};
