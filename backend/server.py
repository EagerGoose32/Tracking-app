from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# Models
class Substance(BaseModel):
    id: Optional[str] = None
    name: str
    isCustom: bool = False
    color: str = "#8B5CF6"

class Entry(BaseModel):
    id: Optional[str] = None
    substanceId: str
    substanceName: str
    date: str  # ISO date string
    time: str  # HH:mm format
    amount: float
    unit: str  # mg, g, ml, pills, drops, etc
    mood: Optional[str] = ""
    effects: Optional[str] = ""
    location: Optional[str] = ""
    comments: Optional[str] = ""
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Reminder(BaseModel):
    id: Optional[str] = None
    time: str  # HH:mm format
    enabled: bool = True
    frequency: str = "daily"  # daily, weekly

class Stats(BaseModel):
    totalEntries: int
    substanceBreakdown: dict
    weeklyAverage: float
    mostUsedSubstance: str

# Substance routes
@api_router.get("/substances", response_model=List[Substance])
async def get_substances():
    substances = await db.substances.find(
        {}, 
        {'name': 1, 'isCustom': 1, 'color': 1}
    ).to_list(1000)
    return [Substance(**serialize_doc(s), id=str(s["_id"])) for s in substances]

@api_router.post("/substances", response_model=Substance)
async def create_substance(substance: Substance):
    substance_dict = substance.dict(exclude={"id"})
    result = await db.substances.insert_one(substance_dict)
    substance_dict["_id"] = result.inserted_id
    return Substance(**serialize_doc(substance_dict), id=str(result.inserted_id))

@api_router.delete("/substances/{substance_id}")
async def delete_substance(substance_id: str):
    result = await db.substances.delete_one({"_id": ObjectId(substance_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Substance not found")
    return {"message": "Substance deleted"}

# Entry routes
@api_router.get("/entries", response_model=List[Entry])
async def get_entries(start_date: Optional[str] = None, end_date: Optional[str] = None):
    query = {}
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    entries = await db.entries.find(
        query,
        {
            'substanceId': 1, 'substanceName': 1, 'date': 1, 'time': 1,
            'amount': 1, 'unit': 1, 'mood': 1, 'effects': 1,
            'location': 1, 'comments': 1, 'createdAt': 1
        }
    ).sort("date", -1).to_list(1000)
    return [Entry(**serialize_doc(e), id=str(e["_id"])) for e in entries]

@api_router.post("/entries", response_model=Entry)
async def create_entry(entry: Entry):
    entry_dict = entry.dict(exclude={"id"})
    result = await db.entries.insert_one(entry_dict)
    entry_dict["_id"] = result.inserted_id
    return Entry(**serialize_doc(entry_dict), id=str(result.inserted_id))

@api_router.put("/entries/{entry_id}", response_model=Entry)
async def update_entry(entry_id: str, entry: Entry):
    entry_dict = entry.dict(exclude={"id"})
    result = await db.entries.update_one(
        {"_id": ObjectId(entry_id)},
        {"$set": entry_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    entry_dict["_id"] = ObjectId(entry_id)
    return Entry(**serialize_doc(entry_dict), id=entry_id)

@api_router.delete("/entries/{entry_id}")
async def delete_entry(entry_id: str):
    result = await db.entries.delete_one({"_id": ObjectId(entry_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Entry deleted"}

# Reminder routes
@api_router.get("/reminders", response_model=List[Reminder])
async def get_reminders():
    reminders = await db.reminders.find(
        {},
        {'time': 1, 'enabled': 1, 'frequency': 1}
    ).to_list(100)
    return [Reminder(**serialize_doc(r), id=str(r["_id"])) for r in reminders]

@api_router.post("/reminders", response_model=Reminder)
async def create_reminder(reminder: Reminder):
    reminder_dict = reminder.dict(exclude={"id"})
    result = await db.reminders.insert_one(reminder_dict)
    reminder_dict["_id"] = result.inserted_id
    return Reminder(**serialize_doc(reminder_dict), id=str(result.inserted_id))

@api_router.put("/reminders/{reminder_id}", response_model=Reminder)
async def update_reminder(reminder_id: str, reminder: Reminder):
    reminder_dict = reminder.dict(exclude={"id"})
    result = await db.reminders.update_one(
        {"_id": ObjectId(reminder_id)},
        {"$set": reminder_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")
    reminder_dict["_id"] = ObjectId(reminder_id)
    return Reminder(**serialize_doc(reminder_dict), id=reminder_id)

@api_router.delete("/reminders/{reminder_id}")
async def delete_reminder(reminder_id: str):
    result = await db.reminders.delete_one({"_id": ObjectId(reminder_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"message": "Reminder deleted"}

# Stats route
@api_router.get("/stats")
async def get_stats():
    entries = await db.entries.find(
        {},
        {'substanceName': 1, 'date': 1}
    ).to_list(10000)
    
    if not entries:
        return {
            "totalEntries": 0,
            "substanceBreakdown": {},
            "weeklyAverage": 0,
            "mostUsedSubstance": "None"
        }
    
    # Calculate stats
    substance_counts = {}
    for entry in entries:
        substance = entry.get("substanceName", "Unknown")
        substance_counts[substance] = substance_counts.get(substance, 0) + 1
    
    most_used = max(substance_counts.items(), key=lambda x: x[1])[0] if substance_counts else "None"
    weekly_avg = len(entries) / max(1, len(set(e["date"] for e in entries)) / 7)
    
    return {
        "totalEntries": len(entries),
        "substanceBreakdown": substance_counts,
        "weeklyAverage": round(weekly_avg, 2),
        "mostUsedSubstance": most_used
    }

# Export route
@api_router.get("/export/csv")
async def export_csv():
    entries = await db.entries.find(
        {},
        {
            'date': 1, 'time': 1, 'substanceName': 1, 'amount': 1,
            'unit': 1, 'mood': 1, 'effects': 1, 'location': 1, 'comments': 1
        }
    ).sort("date", -1).to_list(10000)
    
    csv_lines = ["Date,Time,Substance,Amount,Unit,Mood,Effects,Location,Comments"]
    for entry in entries:
        line = f"{entry.get('date','')},{entry.get('time','')},{entry.get('substanceName','')},{entry.get('amount','')},{entry.get('unit','')},{entry.get('mood','')},{entry.get('effects','')},{entry.get('location','')},{entry.get('comments','')}"
        csv_lines.append(line)
    
    return {"data": "\n".join(csv_lines)}

# Initialize default substances
@api_router.post("/initialize")
async def initialize_data():
    # Check if substances already exist
    existing = await db.substances.find_one()
    if existing:
        return {"message": "Data already initialized"}
    
    default_substances = [
        {"name": "Weed", "isCustom": False, "color": "#10B981"},
        {"name": "Kratom", "isCustom": False, "color": "#8B5CF6"},
        {"name": "Benzos", "isCustom": False, "color": "#3B82F6"},
        {"name": "Psychedelics", "isCustom": False, "color": "#EC4899"},
        {"name": "Alcohol", "isCustom": False, "color": "#F59E0B"},
        {"name": "Stimulants", "isCustom": False, "color": "#EF4444"},
    ]
    
    await db.substances.insert_many(default_substances)
    return {"message": "Default substances initialized"}

@api_router.get("/")
async def root():
    return {"message": "Substance Tracker API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
