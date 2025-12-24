"""
User model for HireBuddy platform
"""

from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class User:
    """
    Represents a user on the HireBuddy platform.
    Users can post tasks and hire helpers.
    """
    id: str
    name: str
    email: str
    phone: str
    location: str
    created_at: datetime
    rating: Optional[float] = None
    
    def __post_init__(self):
        """Validate user data"""
        if not self.name:
            raise ValueError("User name is required")
        if not self.email:
            raise ValueError("User email is required")
        if not self.location:
            raise ValueError("User location is required")
    
    def to_dict(self):
        """Convert user to dictionary format"""
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "location": self.location,
            "rating": self.rating,
            "created_at": self.created_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create user from dictionary"""
        data["created_at"] = datetime.fromisoformat(data["created_at"])
        return cls(**data)
