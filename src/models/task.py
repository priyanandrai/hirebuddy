"""
Task model for HireBuddy platform
"""

from dataclasses import dataclass
from typing import Optional
from datetime import datetime
from enum import Enum


class TaskStatus(Enum):
    """Task status enumeration"""
    OPEN = "open"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskCategory(Enum):
    """Task category enumeration"""
    ERRANDS = "errands"
    HOUSEHOLD = "household"
    DELIVERY = "delivery"
    CLEANING = "cleaning"
    MOVING = "moving"
    GARDENING = "gardening"
    OTHER = "other"


@dataclass
class Task:
    """
    Represents a task posted by a user.
    Tasks are jobs that need to be completed by helpers.
    """
    id: str
    title: str
    description: str
    category: TaskCategory
    user_id: str
    location: str
    budget: float
    status: TaskStatus
    created_at: datetime
    helper_id: Optional[str] = None
    scheduled_for: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    def __post_init__(self):
        """Validate task data"""
        if not self.title:
            raise ValueError("Task title is required")
        if not self.description:
            raise ValueError("Task description is required")
        if self.budget <= 0:
            raise ValueError("Task budget must be positive")
    
    def assign_helper(self, helper_id: str):
        """Assign a helper to this task"""
        if self.status != TaskStatus.OPEN:
            raise ValueError("Can only assign helpers to open tasks")
        self.helper_id = helper_id
        self.status = TaskStatus.ASSIGNED
    
    def mark_in_progress(self):
        """Mark task as in progress"""
        if self.status != TaskStatus.ASSIGNED:
            raise ValueError("Task must be assigned before starting")
        self.status = TaskStatus.IN_PROGRESS
    
    def mark_completed(self):
        """Mark task as completed"""
        if self.status != TaskStatus.IN_PROGRESS:
            raise ValueError("Task must be in progress before completing")
        self.status = TaskStatus.COMPLETED
        self.completed_at = datetime.now()
    
    def to_dict(self):
        """Convert task to dictionary format"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category.value,
            "user_id": self.user_id,
            "location": self.location,
            "budget": self.budget,
            "status": self.status.value,
            "helper_id": self.helper_id,
            "scheduled_for": self.scheduled_for.isoformat() if self.scheduled_for else None,
            "created_at": self.created_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create task from dictionary"""
        # Create a copy to avoid mutating the input
        data = data.copy()
        data["category"] = TaskCategory(data["category"])
        data["status"] = TaskStatus(data["status"])
        data["created_at"] = datetime.fromisoformat(data["created_at"])
        if data.get("scheduled_for"):
            data["scheduled_for"] = datetime.fromisoformat(data["scheduled_for"])
        if data.get("completed_at"):
            data["completed_at"] = datetime.fromisoformat(data["completed_at"])
        return cls(**data)
