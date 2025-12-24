"""
Helper model for HireBuddy platform
"""

from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime


@dataclass
class Helper:
    """
    Represents a helper on the HireBuddy platform.
    Helpers provide services and complete tasks for users.
    """
    id: str
    name: str
    email: str
    phone: str
    location: str
    skills: List[str]
    hourly_rate: float
    created_at: datetime
    bio: Optional[str] = None
    rating: Optional[float] = None
    total_tasks_completed: int = 0
    availability: List[str] = field(default_factory=list)
    
    def __post_init__(self):
        """Validate helper data"""
        if not self.name:
            raise ValueError("Helper name is required")
        if not self.email:
            raise ValueError("Helper email is required")
        if not self.skills:
            raise ValueError("Helper must have at least one skill")
        if self.hourly_rate <= 0:
            raise ValueError("Hourly rate must be positive")
    
    def add_skill(self, skill: str):
        """Add a new skill to helper's skillset"""
        if skill not in self.skills:
            self.skills.append(skill)
    
    def update_rating(self, new_rating: float):
        """Update helper's rating"""
        if not (0 <= new_rating <= 5):
            raise ValueError("Rating must be between 0 and 5")
        if self.rating is None:
            self.rating = new_rating
        else:
            # Calculate weighted average
            total_tasks = self.total_tasks_completed
            self.rating = ((self.rating * total_tasks) + new_rating) / (total_tasks + 1)
    
    def complete_task(self):
        """Increment task completion counter"""
        self.total_tasks_completed += 1
    
    def to_dict(self):
        """Convert helper to dictionary format"""
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "location": self.location,
            "skills": self.skills,
            "hourly_rate": self.hourly_rate,
            "bio": self.bio,
            "rating": self.rating,
            "total_tasks_completed": self.total_tasks_completed,
            "availability": self.availability,
            "created_at": self.created_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create helper from dictionary"""
        data["created_at"] = datetime.fromisoformat(data["created_at"])
        return cls(**data)
