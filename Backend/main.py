from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import Column, Integer, String, Boolean, create_engine, Text, Date, TIMESTAMP, ForeignKey, func, Time, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, EmailStr
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from datetime import datetime, timedelta, date, time
from typing import Optional, List
from collections import defaultdict

DATABASE_URL = "postgresql+pg8000://postgres:Postgres123@localhost:5432/hit_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
ph = PasswordHasher()

# IMPORTANT: app created first
app = FastAPI()

# CORS MUST be before any routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# --- MODELS ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)

class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(String(20), default="active")
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

class DailyHabit(Base):
    __tablename__ = "daily_habits"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="SET NULL"), nullable=True)
    habit_name = Column(String(150), nullable=False)
    description = Column(Text)
    frequency = Column(String(20), default="daily") # daily/weekly
    streak_count = Column(Integer, default=0)
    last_completed_date = Column(Date, nullable=True)
    is_completed_today = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

class HabitLog(Base):
    __tablename__ = "habit_logs"
    id = Column(Integer, primary_key=True)
    habit_id = Column(Integer, ForeignKey("daily_habits.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    completed_date = Column(Date, default=datetime.utcnow)
    is_completed = Column(Boolean, default=True)

# --- NEW MODELS: Intentions + Reminder Rules ---
class Intention(Base):
    __tablename__ = "intentions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    intention_text = Column(Text, nullable=False)
    intention_type = Column(String(50), default="general") # learning, health, work
    planned_date = Column(Date, nullable=True)
    is_done = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

class ReminderRule(Base):
    __tablename__ = "reminder_rules"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    habit_id = Column(Integer, nullable=True)
    habit_type = Column(String(20), default="daily") # daily / weekly
    reminder_time = Column(Time, nullable=False)
    reminder_days = Column(String(50), default="Daily") # Mon,Wed,Fri or Daily
    is_active = Column(Boolean, default=True)
    extra_data = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# --- SCHEMAS ---
class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
class LoginRequest(BaseModel):
    username: str
    password: str
class HabitCreate(BaseModel):
    habit_name: str
    description: Optional[str] = None
    goal_id: Optional[int] = None
    frequency: str = "daily"

class HabitUpdate(BaseModel):
    habit_name: Optional[str] = None
    description: Optional[str] = None
    goal_id: Optional[int] = None
    frequency: Optional[str] = None

class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None

# --- NEW SCHEMAS ---
class IntentionCreate(BaseModel):
    intention_text: str
    intention_type: Optional[str] = "general"
    planned_date: Optional[date] = None

class IntentionUpdate(BaseModel):
    intention_text: Optional[str] = None
    intention_type: Optional[str] = None
    planned_date: Optional[date] = None
    is_done: Optional[bool] = None

class ReminderCreate(BaseModel):
    habit_id: Optional[int] = None
    habit_type: str = "daily"
    reminder_time: time
    reminder_days: str = "Daily"
    is_active: Optional[bool] = True

class ReminderUpdate(BaseModel):
    habit_id: Optional[int] = None
    habit_type: Optional[str] = None
    reminder_time: Optional[time] = None
    reminder_days: Optional[str] = None
    is_active: Optional[bool] = None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token.startswith("dummy_token_for_"):
        raise HTTPException(status_code=401, detail="Invalid token")
    username = token.replace("dummy_token_for_", "")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.post("/auth/register", status_code=201)
def register(payload: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter((User.email == payload.email) | (User.username == payload.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    hashed = ph.hash(payload.password)
    new_user = User(username=payload.username, email=payload.email, password_hash=hashed)
    db.add(new_user); db.commit(); db.refresh(new_user)
    return {"message": "User registered", "user_id": new_user.id}

@app.post("/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user: raise HTTPException(status_code=401, detail="Invalid username")
    try:
        ph.verify(user.password_hash, payload.password)
    except VerifyMismatchError:
        raise HTTPException(status_code=401, detail="Invalid password")
    return {"access_token": f"dummy_token_for_{user.username}", "username": user.username, "user_id": user.id}

@app.get("/dashboard")
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total = db.query(DailyHabit).filter(DailyHabit.user_id == user.id).count()
    completed = db.query(DailyHabit).filter(DailyHabit.user_id == user.id, DailyHabit.is_completed_today==True).count()
    streak = db.query(func.max(DailyHabit.streak_count)).filter(DailyHabit.user_id == user.id).scalar() or 0
    return {"username": user.username, "today_completed": completed, "today_total": total, "streak": streak, "total_habits": total}

# --- FULL CRUD FOR HABITS ---
@app.post("/habits", status_code=201)
def create_habit(payload: HabitCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    h = DailyHabit(user_id=user.id, habit_name=payload.habit_name, description=payload.description, goal_id=payload.goal_id, frequency=payload.frequency)
    db.add(h); db.commit(); db.refresh(h)
    return h

@app.get("/habits")
def list_habits(frequency: Optional[str] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(DailyHabit).filter(DailyHabit.user_id==user.id)
    if frequency: query = query.filter(DailyHabit.frequency == frequency)
    return query.order_by(DailyHabit.created_at.desc()).all()

@app.put("/habits/{habit_id}")
def update_habit(habit_id: int, payload: HabitUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    habit = db.query(DailyHabit).filter(DailyHabit.id==habit_id, DailyHabit.user_id==user.id).first()
    if not habit: raise HTTPException(404, "Habit not found")
    if payload.habit_name is not None: habit.habit_name = payload.habit_name
    if payload.description is not None: habit.description = payload.description
    if payload.frequency is not None: habit.frequency = payload.frequency
    if payload.goal_id is not None: habit.goal_id = payload.goal_id
    db.commit(); db.refresh(habit)
    return habit

@app.patch("/habits/{habit_id}/toggle")
def toggle_habit(habit_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    habit = db.query(DailyHabit).filter(DailyHabit.id==habit_id, DailyHabit.user_id==user.id).first()
    if not habit: raise HTTPException(404, "Habit not found")
    today = datetime.utcnow().date()
    if not habit.is_completed_today:
        habit.is_completed_today = True; habit.streak_count += 1; habit.last_completed_date = today
        db.add(HabitLog(habit_id=habit.id, user_id=user.id, completed_date=today, is_completed=True))
    else:
        habit.is_completed_today = False; habit.streak_count = max(0, habit.streak_count - 1)
        db.query(HabitLog).filter(HabitLog.habit_id==habit.id, HabitLog.completed_date==today).delete()
    db.commit(); db.refresh(habit)
    return habit

@app.delete("/habits/{habit_id}")
def delete_habit(habit_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    habit = db.query(DailyHabit).filter(DailyHabit.id==habit_id, DailyHabit.user_id==user.id).first()
    if not habit: raise HTTPException(404, "Not found")
    db.delete(habit); db.commit()
    return {"message": "Deleted"}

@app.get("/calendar")
def get_calendar(month: int = datetime.utcnow().month, year: int = datetime.utcnow().year, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(HabitLog).filter(HabitLog.user_id==user.id, func.extract('month', HabitLog.completed_date)==month, func.extract('year', HabitLog.completed_date)==year).all()
    data = defaultdict(list)
    for log in logs: data[str(log.completed_date)].append(log.habit_id)
    return {"logs": data, "month": month, "year": year}

# ======================================================
# --- NEW: INTENTIONS ---
# ======================================================
@app.post("/intentions", status_code=201)
def create_intention(payload: IntentionCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = Intention(user_id=user.id, intention_text=payload.intention_text, intention_type=payload.intention_type, planned_date=payload.planned_date or datetime.utcnow().date())
    db.add(item); db.commit(); db.refresh(item)
    return item

@app.get("/intentions")
def list_intentions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Intention).filter(Intention.user_id==user.id).order_by(Intention.created_at.desc()).all()

@app.put("/intentions/{intention_id}")
def update_intention(intention_id: int, payload: IntentionUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Intention).filter(Intention.id==intention_id, Intention.user_id==user.id).first()
    if not item: raise HTTPException(404, "Intention not found")
    if payload.intention_text is not None: item.intention_text = payload.intention_text
    if payload.intention_type is not None: item.intention_type = payload.intention_type
    if payload.planned_date is not None: item.planned_date = payload.planned_date
    if payload.is_done is not None: item.is_done = payload.is_done
    db.commit(); db.refresh(item)
    return item

@app.put("/intentions/{intention_id}/done")
def done_intention(intention_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Intention).filter(Intention.id==intention_id, Intention.user_id==user.id).first()
    if not item: raise HTTPException(404, "Intention not found")
    item.is_done = True
    db.commit(); db.refresh(item)
    return item

@app.delete("/intentions/{intention_id}")
def delete_intention(intention_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Intention).filter(Intention.id==intention_id, Intention.user_id==user.id).first()
    if not item: raise HTTPException(404, "Not found")
    db.delete(item); db.commit()
    return {"message": "Deleted"}

# ======================================================
# --- NEW: REMINDER RULES ---
# ======================================================
@app.post("/reminders", status_code=201)
def create_reminder(payload: ReminderCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # agar habit_id diya hai to check karo habit user ki hai
    if payload.habit_id:
        h = db.query(DailyHabit).filter(DailyHabit.id==payload.habit_id, DailyHabit.user_id==user.id).first()
        if not h: raise HTTPException(404, "Habit not found")
    r = ReminderRule(user_id=user.id, habit_id=payload.habit_id, habit_type=payload.habit_type, reminder_time=payload.reminder_time, reminder_days=payload.reminder_days, is_active=payload.is_active)
    db.add(r); db.commit(); db.refresh(r)
    return r

@app.get("/reminders")
def list_reminders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(ReminderRule).filter(ReminderRule.user_id==user.id).order_by(ReminderRule.created_at.desc()).all()

@app.put("/reminders/{reminder_id}")
def update_reminder(reminder_id: int, payload: ReminderUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(ReminderRule).filter(ReminderRule.id==reminder_id, ReminderRule.user_id==user.id).first()
    if not r: raise HTTPException(404, "Reminder not found")
    if payload.habit_id is not None: r.habit_id = payload.habit_id
    if payload.habit_type is not None: r.habit_type = payload.habit_type
    if payload.reminder_time is not None: r.reminder_time = payload.reminder_time
    if payload.reminder_days is not None: r.reminder_days = payload.reminder_days
    if payload.is_active is not None: r.is_active = payload.is_active
    db.commit(); db.refresh(r)
    return r

@app.delete("/reminders/{reminder_id}")
def delete_reminder(reminder_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(ReminderRule).filter(ReminderRule.id==reminder_id, ReminderRule.user_id==user.id).first()
    if not r: raise HTTPException(404, "Not found")
    db.delete(r); db.commit()
    return {"message": "Deleted"}

# ======================================================
# --- NEW: SUMMARY / DASHBOARD WITH CHART.JS ---
# ======================================================
@app.get("/summary/weekly")
def weekly_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Dashboard.js ko [Mon, Tue, Wed, Thu, Fri, Sat, Sun] = 7 numbers chahiye
    today = datetime.utcnow().date()
    monday = today - timedelta(days=today.weekday()) # Monday of this week
    result = []
    labels = []
    for i in range(7):
        day = monday + timedelta(days=i)
        count = db.query(HabitLog).filter(HabitLog.user_id==user.id, HabitLog.completed_date==day).count()
        result.append(count)
        labels.append(day.strftime("%a"))
    return result

@app.get("/summary")
def summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total = db.query(DailyHabit).filter(DailyHabit.user_id==user.id).count()
    completed_today = db.query(DailyHabit).filter(DailyHabit.user_id==user.id, DailyHabit.is_completed_today==True).count()
    streak = db.query(func.max(DailyHabit.streak_count)).filter(DailyHabit.user_id==user.id).scalar() or 0
    total_intentions = db.query(Intention).filter(Intention.user_id==user.id).count()
    done_intentions = db.query(Intention).filter(Intention.user_id==user.id, Intention.is_done==True).count()
    total_reminders = db.query(ReminderRule).filter(ReminderRule.user_id==user.id, ReminderRule.is_active==True).count()

    # Weekly chart data
    today = datetime.utcnow().date()
    monday = today - timedelta(days=today.weekday())
    weekly = []
    for i in range(7):
        day = monday + timedelta(days=i)
        c = db.query(HabitLog).filter(HabitLog.user_id==user.id, HabitLog.completed_date==day).count()
        weekly.append({"day": day.strftime("%a"), "date": str(day), "completed": c})

    return {
        "today_completed": completed_today,
        "today_total": total,
        "streak": streak,
        "total_habits": total,
        "intentions_total": total_intentions,
        "intentions_done": done_intentions,
        "active_reminders": total_reminders,
        "weekly": weekly,
        "weekly_counts": [w["completed"] for w in weekly]
    }