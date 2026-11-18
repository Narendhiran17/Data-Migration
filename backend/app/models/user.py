from sqlalchemy import Column, String
from app.models.base import BaseModel

class User(BaseModel):
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    display_name = Column(String(255), nullable=False)
    status = Column(String(50), default="active", nullable=False)
