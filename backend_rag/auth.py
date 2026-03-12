import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Dict, Optional
import os

# In-memory user storage (replace with database in production)
users_db: Dict[str, dict] = {}

SECRET_KEY = os.getenv("SECRET_KEY", "kshitij-capstone-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.InvalidTokenError:
        return None

def get_user_by_email(email: str) -> Optional[dict]:
    """Get user from in-memory database by email"""
    return users_db.get(email)

def create_user(name: str, email: str, password: str) -> dict:
    """Create a new user"""
    user_id = f"user_{len(users_db) + 1}"
    hashed_password = hash_password(password)
    
    user = {
        "id": user_id,
        "name": name,
        "email": email,
        "password": hashed_password,
        "avatar": f"https://i.pravatar.cc/150?u={email}",
        "recentActivity": [
            {
                "problemId": "1",
                "title": "Two Sum",
                "difficulty": "Easy",
                "status": "Solved",
                "timestamp": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                "timeSpent": "15m"
            }
        ],
        "skillDistribution": [
            { "name": "Arrays", "level": 90 },
            { "name": "Strings", "level": 75 },
            { "name": "Hash Tables", "level": 60 },
            { "name": "Sorting", "level": 45 }
        ]
    }
    
    users_db[email] = user
    return user
