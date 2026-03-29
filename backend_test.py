#!/usr/bin/env python3
"""
Comprehensive backend API testing for Substance Tracker
Tests all endpoints with proper data validation and error handling
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import uuid

# Use the production URL from frontend .env
BASE_URL = "https://intake-tracker-6.preview.emergentagent.com/api"

class SubstanceTrackerTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_data = {}
        self.results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }
    
    def log_result(self, test_name, success, message=""):
        if success:
            self.results["passed"] += 1
            print(f"✅ {test_name}")
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {message}")
            print(f"❌ {test_name}: {message}")
    
    def test_api_health(self):
        """Test basic API connectivity"""
        try:
            response = self.session.get(f"{BASE_URL}/")
            if response.status_code == 200:
                data = response.json()
                self.log_result("API Health Check", True)
                return True
            else:
                self.log_result("API Health Check", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("API Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_initialize_data(self):
        """Test data initialization"""
        try:
            response = self.session.post(f"{BASE_URL}/initialize")
            if response.status_code == 200:
                self.log_result("Initialize Data", True)
                return True
            else:
                self.log_result("Initialize Data", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Initialize Data", False, f"Error: {str(e)}")
            return False
    
    def test_get_substances(self):
        """Test getting all substances"""
        try:
            response = self.session.get(f"{BASE_URL}/substances")
            if response.status_code == 200:
                substances = response.json()
                if isinstance(substances, list) and len(substances) > 0:
                    self.test_data["substances"] = substances
                    self.log_result("Get Substances", True)
                    return True
                else:
                    self.log_result("Get Substances", False, "No substances returned")
                    return False
            else:
                self.log_result("Get Substances", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get Substances", False, f"Error: {str(e)}")
            return False
    
    def test_create_custom_substance(self):
        """Test creating a custom substance"""
        try:
            custom_substance = {
                "name": "Test Custom Substance",
                "isCustom": True,
                "color": "#FF5733"
            }
            response = self.session.post(f"{BASE_URL}/substances", json=custom_substance)
            if response.status_code == 200:
                substance = response.json()
                if substance.get("id") and substance.get("name") == custom_substance["name"]:
                    self.test_data["custom_substance"] = substance
                    self.log_result("Create Custom Substance", True)
                    return True
                else:
                    self.log_result("Create Custom Substance", False, "Invalid response data")
                    return False
            else:
                self.log_result("Create Custom Substance", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Create Custom Substance", False, f"Error: {str(e)}")
            return False
    
    def test_delete_custom_substance(self):
        """Test deleting a custom substance"""
        if "custom_substance" not in self.test_data:
            self.log_result("Delete Custom Substance", False, "No custom substance to delete")
            return False
        
        try:
            substance_id = self.test_data["custom_substance"]["id"]
            response = self.session.delete(f"{BASE_URL}/substances/{substance_id}")
            if response.status_code == 200:
                self.log_result("Delete Custom Substance", True)
                return True
            else:
                self.log_result("Delete Custom Substance", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Delete Custom Substance", False, f"Error: {str(e)}")
            return False
    
    def test_create_entry(self):
        """Test creating a new entry"""
        if "substances" not in self.test_data or not self.test_data["substances"]:
            self.log_result("Create Entry", False, "No substances available")
            return False
        
        try:
            substance = self.test_data["substances"][0]
            today = datetime.now().strftime("%Y-%m-%d")
            current_time = datetime.now().strftime("%H:%M")
            
            entry_data = {
                "substanceId": substance["id"],
                "substanceName": substance["name"],
                "date": today,
                "time": current_time,
                "amount": 2.5,
                "unit": "mg",
                "mood": "relaxed",
                "effects": "mild euphoria",
                "location": "home",
                "comments": "Test entry for API validation"
            }
            
            response = self.session.post(f"{BASE_URL}/entries", json=entry_data)
            if response.status_code == 200:
                entry = response.json()
                if entry.get("id") and entry.get("substanceName") == entry_data["substanceName"]:
                    self.test_data["entry"] = entry
                    self.log_result("Create Entry", True)
                    return True
                else:
                    self.log_result("Create Entry", False, "Invalid response data")
                    return False
            else:
                self.log_result("Create Entry", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Create Entry", False, f"Error: {str(e)}")
            return False
    
    def test_get_entries(self):
        """Test getting all entries"""
        try:
            response = self.session.get(f"{BASE_URL}/entries")
            if response.status_code == 200:
                entries = response.json()
                if isinstance(entries, list):
                    self.log_result("Get Entries", True)
                    return True
                else:
                    self.log_result("Get Entries", False, "Invalid response format")
                    return False
            else:
                self.log_result("Get Entries", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get Entries", False, f"Error: {str(e)}")
            return False
    
    def test_get_entries_with_date_filter(self):
        """Test getting entries with date range filter"""
        try:
            today = datetime.now().strftime("%Y-%m-%d")
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            
            response = self.session.get(f"{BASE_URL}/entries?start_date={yesterday}&end_date={today}")
            if response.status_code == 200:
                entries = response.json()
                if isinstance(entries, list):
                    self.log_result("Get Entries with Date Filter", True)
                    return True
                else:
                    self.log_result("Get Entries with Date Filter", False, "Invalid response format")
                    return False
            else:
                self.log_result("Get Entries with Date Filter", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get Entries with Date Filter", False, f"Error: {str(e)}")
            return False
    
    def test_update_entry(self):
        """Test updating an entry"""
        if "entry" not in self.test_data:
            self.log_result("Update Entry", False, "No entry to update")
            return False
        
        try:
            entry_id = self.test_data["entry"]["id"]
            updated_data = self.test_data["entry"].copy()
            updated_data["amount"] = 5.0
            updated_data["mood"] = "very relaxed"
            updated_data["comments"] = "Updated test entry"
            
            response = self.session.put(f"{BASE_URL}/entries/{entry_id}", json=updated_data)
            if response.status_code == 200:
                updated_entry = response.json()
                if updated_entry.get("amount") == 5.0 and updated_entry.get("mood") == "very relaxed":
                    self.test_data["entry"] = updated_entry
                    self.log_result("Update Entry", True)
                    return True
                else:
                    self.log_result("Update Entry", False, "Entry not properly updated")
                    return False
            else:
                self.log_result("Update Entry", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Update Entry", False, f"Error: {str(e)}")
            return False
    
    def test_get_stats(self):
        """Test getting usage statistics"""
        try:
            response = self.session.get(f"{BASE_URL}/stats")
            if response.status_code == 200:
                stats = response.json()
                required_fields = ["totalEntries", "substanceBreakdown", "weeklyAverage", "mostUsedSubstance"]
                if all(field in stats for field in required_fields):
                    self.log_result("Get Stats", True)
                    return True
                else:
                    self.log_result("Get Stats", False, f"Missing required fields. Got: {list(stats.keys())}")
                    return False
            else:
                self.log_result("Get Stats", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get Stats", False, f"Error: {str(e)}")
            return False
    
    def test_create_reminder(self):
        """Test creating a reminder"""
        try:
            reminder_data = {
                "time": "09:00",
                "enabled": True,
                "frequency": "daily"
            }
            
            response = self.session.post(f"{BASE_URL}/reminders", json=reminder_data)
            if response.status_code == 200:
                reminder = response.json()
                if reminder.get("id") and reminder.get("time") == "09:00":
                    self.test_data["reminder"] = reminder
                    self.log_result("Create Reminder", True)
                    return True
                else:
                    self.log_result("Create Reminder", False, "Invalid response data")
                    return False
            else:
                self.log_result("Create Reminder", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Create Reminder", False, f"Error: {str(e)}")
            return False
    
    def test_get_reminders(self):
        """Test getting all reminders"""
        try:
            response = self.session.get(f"{BASE_URL}/reminders")
            if response.status_code == 200:
                reminders = response.json()
                if isinstance(reminders, list):
                    self.log_result("Get Reminders", True)
                    return True
                else:
                    self.log_result("Get Reminders", False, "Invalid response format")
                    return False
            else:
                self.log_result("Get Reminders", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get Reminders", False, f"Error: {str(e)}")
            return False
    
    def test_update_reminder(self):
        """Test updating a reminder"""
        if "reminder" not in self.test_data:
            self.log_result("Update Reminder", False, "No reminder to update")
            return False
        
        try:
            reminder_id = self.test_data["reminder"]["id"]
            updated_data = self.test_data["reminder"].copy()
            updated_data["time"] = "10:30"
            updated_data["enabled"] = False
            
            response = self.session.put(f"{BASE_URL}/reminders/{reminder_id}", json=updated_data)
            if response.status_code == 200:
                updated_reminder = response.json()
                if updated_reminder.get("time") == "10:30" and updated_reminder.get("enabled") == False:
                    self.test_data["reminder"] = updated_reminder
                    self.log_result("Update Reminder", True)
                    return True
                else:
                    self.log_result("Update Reminder", False, "Reminder not properly updated")
                    return False
            else:
                self.log_result("Update Reminder", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Update Reminder", False, f"Error: {str(e)}")
            return False
    
    def test_export_csv(self):
        """Test CSV export functionality"""
        try:
            response = self.session.get(f"{BASE_URL}/export/csv")
            if response.status_code == 200:
                export_data = response.json()
                if "data" in export_data and isinstance(export_data["data"], str):
                    csv_content = export_data["data"]
                    if "Date,Time,Substance,Amount,Unit,Mood,Effects,Location,Comments" in csv_content:
                        self.log_result("Export CSV", True)
                        return True
                    else:
                        self.log_result("Export CSV", False, "Invalid CSV format")
                        return False
                else:
                    self.log_result("Export CSV", False, "Invalid response format")
                    return False
            else:
                self.log_result("Export CSV", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Export CSV", False, f"Error: {str(e)}")
            return False
    
    def test_delete_reminder(self):
        """Test deleting a reminder"""
        if "reminder" not in self.test_data:
            self.log_result("Delete Reminder", False, "No reminder to delete")
            return False
        
        try:
            reminder_id = self.test_data["reminder"]["id"]
            response = self.session.delete(f"{BASE_URL}/reminders/{reminder_id}")
            if response.status_code == 200:
                self.log_result("Delete Reminder", True)
                return True
            else:
                self.log_result("Delete Reminder", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Delete Reminder", False, f"Error: {str(e)}")
            return False
    
    def test_delete_entry(self):
        """Test deleting an entry"""
        if "entry" not in self.test_data:
            self.log_result("Delete Entry", False, "No entry to delete")
            return False
        
        try:
            entry_id = self.test_data["entry"]["id"]
            response = self.session.delete(f"{BASE_URL}/entries/{entry_id}")
            if response.status_code == 200:
                self.log_result("Delete Entry", True)
                return True
            else:
                self.log_result("Delete Entry", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Delete Entry", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in proper sequence"""
        print("🧪 Starting Substance Tracker Backend API Tests")
        print(f"🌐 Testing against: {BASE_URL}")
        print("=" * 60)
        
        # Test sequence - order matters for dependencies
        tests = [
            self.test_api_health,
            self.test_initialize_data,
            self.test_get_substances,
            self.test_create_custom_substance,
            self.test_delete_custom_substance,
            self.test_create_entry,
            self.test_get_entries,
            self.test_get_entries_with_date_filter,
            self.test_update_entry,
            self.test_get_stats,
            self.test_create_reminder,
            self.test_get_reminders,
            self.test_update_reminder,
            self.test_export_csv,
            self.test_delete_reminder,
            self.test_delete_entry,
        ]
        
        for test in tests:
            test()
        
        print("=" * 60)
        print(f"📊 Test Results: {self.results['passed']} passed, {self.results['failed']} failed")
        
        if self.results["errors"]:
            print("\n❌ Failed Tests:")
            for error in self.results["errors"]:
                print(f"   • {error}")
        
        return self.results["failed"] == 0

if __name__ == "__main__":
    tester = SubstanceTrackerTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)