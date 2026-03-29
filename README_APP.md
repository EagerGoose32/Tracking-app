# Substance Use Tracker - Mobile App

A comprehensive mobile app for tracking substance use, visualizing trends, and building better habits. Built with Expo React Native, FastAPI, and MongoDB.

## Features

### 📅 Weekly Calendar View
- Visual representation of usage with 7-day weekly dots
- Navigate through past and future weeks
- Quick overview of entries per day
- Highlighted current day and week

### ➕ Add Entries
- Select from predefined substances: Weed, Kratom, Benzos, Psychedelics, Alcohol, Stimulants
- Add custom substances
- Track detailed information:
  - Date and time
  - Amount with customizable units (mg, g, ml, pills, drops, puffs, doses)
  - Mood/emotional state
  - Effects experienced
  - Location context
  - Additional comments/notes

### 📊 Trends & Analytics
- **14-Day Activity Trend**: Line chart showing daily usage patterns
- **8-Week Overview**: Bar chart of weekly entries
- **Substance Breakdown**: Visual breakdown by substance type
- **Statistics**:
  - Total entries
  - Weekly average
  - Most used substance
  - Substance-specific counts

### 📜 History
- Chronological list of all entries grouped by date
- Expandable entries showing full details
- Edit and delete functionality
- Pull-to-refresh to update data

### ⚙️ Settings
- **Manage Substances**: Add/remove custom substances
- **Tracking Reminders**: Set daily notifications to track usage
- **Data Export**: Export all data as CSV file
- **Notifications**: Permission management for reminders

## Tech Stack

**Frontend:**
- Expo React Native
- expo-router (file-based routing)
- react-native-gifted-charts (data visualization)
- expo-notifications (reminders)
- date-fns (date handling)
- expo-file-system & expo-sharing (data export)

**Backend:**
- FastAPI
- Motor (async MongoDB driver)
- Pydantic (data validation)

**Database:**
- MongoDB

## API Endpoints

### Substances
- `GET /api/substances` - List all substances
- `POST /api/substances` - Create custom substance
- `DELETE /api/substances/{id}` - Delete substance

### Entries
- `GET /api/entries` - List entries (with optional date filtering)
- `POST /api/entries` - Create entry
- `PUT /api/entries/{id}` - Update entry
- `DELETE /api/entries/{id}` - Delete entry

### Statistics
- `GET /api/stats` - Get usage statistics

### Reminders
- `GET /api/reminders` - List reminders
- `POST /api/reminders` - Create reminder
- `PUT /api/reminders/{id}` - Update reminder
- `DELETE /api/reminders/{id}` - Delete reminder

### Data Export
- `GET /api/export/csv` - Export data as CSV

### Initialization
- `POST /api/initialize` - Initialize default substances

## Running the App

### Backend
```bash
cd /app/backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001
```

### Frontend
```bash
cd /app/frontend
yarn install
expo start
```

### Preview URL
The app is accessible at: https://intake-tracker-6.preview.emergentagent.com

## Dark Theme
The entire app features a dark theme optimized for:
- Reduced eye strain
- Better battery life on OLED screens
- Modern aesthetic
- Clear contrast for important information

## Mobile-First Design
- Touch-friendly UI elements (minimum 44px touch targets)
- Swipe gestures for navigation
- Pull-to-refresh on data screens
- Responsive layouts for different screen sizes
- Keyboard-aware forms
- Safe area handling for notched devices

## Data Privacy
- All data stored locally in MongoDB
- No external data sharing
- Export functionality for data portability
- Full control over entry deletion

## Future Enhancements
- Goal setting (e.g., reduction targets)
- Pattern recognition and insights
- Mood correlation analysis
- Multi-user support with authentication
- Cloud sync
- PDF export with charts
- Widget support for quick entry

## License
MIT

## Support
For issues or questions, please refer to the documentation or contact support.
