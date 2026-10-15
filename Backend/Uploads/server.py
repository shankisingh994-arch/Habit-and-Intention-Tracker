from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import Column, Integer, String, Boolean, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, EmailStr
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/hit_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
ph = PasswordHasher()
app = FastAPI()

# Allow React to call this
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)

Base.metadata.create_all(bind=engine)

class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# YOUR REQUIRED PATHS
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

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username")
    try:
        ph.verify(user.password_hash, payload.password)
    except VerifyMismatchError:
        raise HTTPException(status_code=401, detail="Invalid password")
    # For now returning fake token - you can add real JWT later
    return {"access_token": f"dummy_token_for_{user.username}", "username": user.username}

@app.get("/")
def root():
    return {"status": "Running - use /auth/register"}