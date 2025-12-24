"""
HireBuddy API - Minimal placeholder implementation
This is a simple in-memory implementation for demonstration purposes.
In production, this would connect to a real database.
"""

from typing import List, Optional, Dict
from datetime import datetime
import uuid

from ..models import User, Task, Helper
from ..models.task import TaskStatus, TaskCategory


class HireBuddyAPI:
    """
    Main API class for HireBuddy operations.
    This is a minimal implementation with in-memory storage.
    """
    
    def __init__(self):
        """Initialize the API with empty data stores"""
        self.users: Dict[str, User] = {}
        self.tasks: Dict[str, Task] = {}
        self.helpers: Dict[str, Helper] = {}
    
    # ===== USER OPERATIONS =====
    
    def create_user(self, name: str, email: str, phone: str, location: str) -> User:
        """
        Create a new user
        
        Args:
            name: User's full name
            email: User's email address
            phone: User's phone number
            location: User's location
            
        Returns:
            User: The created user object
        """
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            name=name,
            email=email,
            phone=phone,
            location=location,
            created_at=datetime.now()
        )
        self.users[user_id] = user
        return user
    
    def get_user(self, user_id: str) -> Optional[User]:
        """Get a user by ID"""
        return self.users.get(user_id)
    
    def list_users(self) -> List[User]:
        """List all users"""
        return list(self.users.values())
    
    # ===== TASK OPERATIONS =====
    
    def create_task(
        self,
        title: str,
        description: str,
        category: str,
        user_id: str,
        location: str,
        budget: float,
        scheduled_for: Optional[datetime] = None
    ) -> Task:
        """
        Create a new task
        
        Args:
            title: Task title
            description: Task description
            category: Task category (e.g., 'errands', 'household')
            user_id: ID of user creating the task
            location: Where the task should be performed
            budget: Budget for the task
            scheduled_for: Optional scheduled datetime for the task
            
        Returns:
            Task: The created task object
        """
        if user_id not in self.users:
            raise ValueError(f"User {user_id} not found")
        
        task_id = str(uuid.uuid4())
        task = Task(
            id=task_id,
            title=title,
            description=description,
            category=TaskCategory(category),
            user_id=user_id,
            location=location,
            budget=budget,
            status=TaskStatus.OPEN,
            created_at=datetime.now(),
            scheduled_for=scheduled_for
        )
        self.tasks[task_id] = task
        return task
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """Get a task by ID"""
        return self.tasks.get(task_id)
    
    def list_tasks(self, status: Optional[str] = None) -> List[Task]:
        """
        List all tasks, optionally filtered by status
        
        Args:
            status: Optional status filter ('open', 'assigned', etc.)
            
        Returns:
            List of tasks
        """
        tasks = list(self.tasks.values())
        if status:
            status_enum = TaskStatus(status)
            tasks = [t for t in tasks if t.status == status_enum]
        return tasks
    
    def assign_task(self, task_id: str, helper_id: str) -> Task:
        """
        Assign a task to a helper
        
        Args:
            task_id: ID of the task
            helper_id: ID of the helper
            
        Returns:
            Updated task object
        """
        task = self.tasks.get(task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found")
        
        if helper_id not in self.helpers:
            raise ValueError(f"Helper {helper_id} not found")
        
        task.assign_helper(helper_id)
        return task
    
    def update_task_status(self, task_id: str, status: str) -> Task:
        """
        Update task status
        
        Args:
            task_id: ID of the task
            status: New status ('in_progress', 'completed', etc.)
            
        Returns:
            Updated task object
        """
        task = self.tasks.get(task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found")
        
        status_enum = TaskStatus(status)
        
        if status_enum == TaskStatus.IN_PROGRESS:
            task.mark_in_progress()
        elif status_enum == TaskStatus.COMPLETED:
            task.mark_completed()
            # Update helper stats
            if task.helper_id:
                helper = self.helpers.get(task.helper_id)
                if helper:
                    helper.complete_task()
        else:
            task.status = status_enum
        
        return task
    
    # ===== HELPER OPERATIONS =====
    
    def create_helper(
        self,
        name: str,
        email: str,
        phone: str,
        location: str,
        skills: List[str],
        hourly_rate: float,
        bio: Optional[str] = None
    ) -> Helper:
        """
        Create a new helper
        
        Args:
            name: Helper's full name
            email: Helper's email address
            phone: Helper's phone number
            location: Helper's location
            skills: List of skills
            hourly_rate: Helper's hourly rate
            bio: Optional bio
            
        Returns:
            Helper: The created helper object
        """
        helper_id = str(uuid.uuid4())
        helper = Helper(
            id=helper_id,
            name=name,
            email=email,
            phone=phone,
            location=location,
            skills=skills,
            hourly_rate=hourly_rate,
            bio=bio,
            created_at=datetime.now()
        )
        self.helpers[helper_id] = helper
        return helper
    
    def get_helper(self, helper_id: str) -> Optional[Helper]:
        """Get a helper by ID"""
        return self.helpers.get(helper_id)
    
    def list_helpers(self, skill: Optional[str] = None) -> List[Helper]:
        """
        List all helpers, optionally filtered by skill
        
        Args:
            skill: Optional skill filter
            
        Returns:
            List of helpers
        """
        helpers = list(self.helpers.values())
        if skill:
            helpers = [h for h in helpers if skill in h.skills]
        return helpers
    
    def search_helpers(self, location: str, skill: Optional[str] = None) -> List[Helper]:
        """
        Search for helpers by location and optional skill
        
        Args:
            location: Location to search in
            skill: Optional skill requirement
            
        Returns:
            List of matching helpers
        """
        helpers = [h for h in self.helpers.values() if h.location == location]
        if skill:
            helpers = [h for h in helpers if skill in h.skills]
        return helpers
    
    def rate_helper(self, helper_id: str, rating: float) -> Helper:
        """
        Rate a helper
        
        Args:
            helper_id: ID of the helper
            rating: Rating value (0-5)
            
        Returns:
            Updated helper object
        """
        helper = self.helpers.get(helper_id)
        if not helper:
            raise ValueError(f"Helper {helper_id} not found")
        
        helper.update_rating(rating)
        return helper
