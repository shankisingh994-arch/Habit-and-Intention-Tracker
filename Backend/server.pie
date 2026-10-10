from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# CORS - React ko allow karna hai (Port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schema - data kaisa aayega
class UserData(BaseModel):
    username: str
    email: str = None  # login me email nahi hoga
    password: str

@app.get("/")
def home():
    return {"message": "FastAPI running - No DB yet"}

@app.post("/auth/register")
def register(data: UserData):
    print("====== REGISTER DATA RECEIVED ======")
    print(f"Username: {data.username}")
    print(f"Email: {data.email}")
    print(f"Password: {data.password}")
    print("=====================================")
    return {"status": "success", "message": f"User {data.username} data printed on server"}

@app.post("/auth/login")
def login(data: UserData):
    print("====== LOGIN DATA RECEIVED ======")
    print(f"Username: {data.username}")
    print(f"Password: {data.password}")
    print("===================================")
    return {
        "access_token": "dummy-token-for-now",
        "token_type": "bearer",
        "username": data.username
    }