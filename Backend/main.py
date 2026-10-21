from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import Column, Integer, String, Boolean, create_engine, Text, Date, TIMESTAMP, ForeignKey, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, EmailStr
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from datetime import datetime
from typing import Optional

DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/hit_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
ph = PasswordHasher()

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    streak_count = Column(Integer, default=0)
    last_completed_date = Column(Date, nullable=True)
    is_completed_today = Column(Boolean, default=False)
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
class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # Works with your dummy_token_for_username
    if not token.startswith("dummy_token_for_"):
        raise HTTPException(status_code=401, detail="Invalid token")
    username = token.replace("dummy_token_for_", "")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# --- YOUR EXISTING AUTH ---
@app.post("/auth/register", status_code=201)
def register(payload: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter((User.email == payload.email) | (User.username == payload.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    hashed = ph.hash(payload.password)
    new_user = User(username=payload.username, email=payload.email, password_hash=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered", "user_id": new_user.id}

@app.post("/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username")
    try:
        ph.verify(user.password_hash, payload.password)
    except VerifyMismatchError:
        raise HTTPException(status_code=401, detail="Invalid password")
    return {"access_token": f"dummy_token_for_{user.username}", "username": user.username, "user_id": user.id}

# --- NEW ENDPOINTS FOR YOUR DASHBOARD ---

@app.get("/dashboard")
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total = db.query(DailyHabit).filter(DailyHabit.user_id == user.id).count()
    completed = db.query(DailyHabit).filter(DailyHabit.user_id == user.id, DailyHabit.is_completed_today==True).count()
    streak = db.query(func.max(DailyHabit.streak_count)).filter(DailyHabit.user_id == user.id).scalar() or 0
    return {"username": user.username, "today_completed": completed, "today_total": total, "streak": streak, "total_habits": total}

# Goals
@app.post("/goals")
def create_goal(payload: GoalCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    g = Goal(user_id=user.id, title=payload.title, description=payload.description)
    db.add(g); db.commit(); db.refresh(g)
    return g

@app.get("/goals")
def list_goals(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Goal).filter(Goal.user_id==user.id).all()

# Habits - My Habits + New Habit
@app.post("/habits", status_code=201)
def create_habit(payload: HabitCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    h = DailyHabit(user_id=user.id, habit_name=payload.habit_name, description=payload.description, goal_id=payload.goal_id)
    db.add(h); db.commit(); db.refresh(h)
    return h

@app.get("/habits")
def list_habits(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(DailyHabit).filter(DailyHabit.user_id==user.id).order_by(DailyHabit.created_at.desc()).all()

@app.patch("/habits/{habit_id}/toggle")
def toggle_habit(habit_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    habit = db.query(DailyHabit).filter(DailyHabit.id==habit_id, DailyHabit.user_id==user.id).first()
    if not habit: raise HTTPException(404, "Habit not found")
    
    if habit.is_completed_today == False:
        habit.is_completed_today = True
        habit.streak_count += 1
        habit.last_completed_date = datetime.utcnow().date()
    else:
        habit.is_completed_today = False
        habit.streak_count = max(0, habit.streak_count - 1)
    
    db.commit(); db.refresh(habit)
    return habit

@app.delete("/habits/{habit_id}")
def delete_habit(habit_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    habit = db.query(DailyHabit).filter(DailyHabit.id==habit_id, DailyHabit.user_id==user.id).first()
    if not habit: raise HTTPException(404, "Not found")
    db.delete(habit); db.commit()
    return {"message": "Deleted"}
    
# Add new model for Calendar history
class HabitLog(Base):
    __tablename__ = "habit_logs"
    id = Column(Integer, primary_key=True)
    habit_id = Column(Integer, ForeignKey("daily_habits.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    completed_date = Column(Date, default=datetime.utcnow)
    is_completed = Column(Boolean, default=True)

Base.metadata.create_all(bind=engine)

# Replace your toggle endpoint with this - now it logs for calendar
@app.patch("/habits/{habit_id}/toggle")
def toggle_habit(habit_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    habit = db.query(DailyHabit).filter(DailyHabit.id==habit_id, DailyHabit.user_id==user.id).first()
    if not habit: raise HTTPException(404, "Habit not found")
    today = datetime.utcnow().date()
    
    if not habit.is_completed_today:
        habit.is_completed_today = True
        habit.streak_count += 1
        habit.last_completed_date = today
        # Add log for calendar
        log = HabitLog(habit_id=habit.id, user_id=user.id, completed_date=today, is_completed=True)
        db.add(log)
    else:
        habit.is_completed_today = False
        habit.streak_count = max(0, habit.streak_count - 1)
        db.query(HabitLog).filter(HabitLog.habit_id==habit.id, HabitLog.completed_date==today).delete()
    
    db.commit(); db.refresh(habit)
    return habit

# CALENDAR API - This powers your Calendar Tab
@app.get("/calendar")
def get_calendar(month: int = datetime.utcnow().month, year: int = datetime.utcnow().year, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get all logs for this month
    logs = db.query(HabitLog).filter(HabitLog.user_id==user.id, func.extract('month', HabitLog.completed_date)==month, func.extract('year', HabitLog.completed_date)==year).all()
    # Return as {date: count}
    from collections import defaultdict
    data = defaultdict(list)
    for log in logs:
        data[str(log.completed_date)].append(log.habit_id)
    
    return {"logs": data, "month": month, "year": year}