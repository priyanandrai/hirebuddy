# HireBuddy API Documentation

This document provides detailed information about the HireBuddy API.

## Overview

The HireBuddy API is a minimal, in-memory implementation designed for demonstration and development purposes. In production, this would be replaced with a database-backed implementation.

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ↓
┌─────────────────────┐
│  HireBuddyAPI       │
│  (Business Logic)   │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│   Data Models       │
│ User, Task, Helper  │
└─────────────────────┘
```

## Data Models

### User Model

```python
@dataclass
class User:
    id: str                      # Unique identifier (UUID)
    name: str                    # Full name
    email: str                   # Email address
    phone: str                   # Phone number
    location: str                # Location/address
    created_at: datetime         # Registration timestamp
    rating: Optional[float]      # User rating (0-5)
```

**Methods:**
- `to_dict()` - Convert to dictionary
- `from_dict(data)` - Create from dictionary

### Task Model

```python
@dataclass
class Task:
    id: str                      # Unique identifier (UUID)
    title: str                   # Task title
    description: str             # Detailed description
    category: TaskCategory       # Category enum
    user_id: str                 # Creator's user ID
    location: str                # Task location
    budget: float                # Budget in dollars
    status: TaskStatus           # Current status
    created_at: datetime         # Creation timestamp
    helper_id: Optional[str]     # Assigned helper ID
    scheduled_for: Optional[datetime]  # Scheduled time
    completed_at: Optional[datetime]   # Completion time
```

**Task Categories:**
- `ERRANDS` - General errands
- `HOUSEHOLD` - Household work
- `DELIVERY` - Delivery services
- `CLEANING` - Cleaning services
- `MOVING` - Moving/relocation
- `GARDENING` - Garden work
- `OTHER` - Other services

**Task Status:**
- `OPEN` - Task is posted and available
- `ASSIGNED` - Task assigned to a helper
- `IN_PROGRESS` - Task is being worked on
- `COMPLETED` - Task finished
- `CANCELLED` - Task cancelled

**Methods:**
- `assign_helper(helper_id)` - Assign task to helper
- `mark_in_progress()` - Mark task as in progress
- `mark_completed()` - Mark task as completed
- `to_dict()` - Convert to dictionary
- `from_dict(data)` - Create from dictionary

### Helper Model

```python
@dataclass
class Helper:
    id: str                      # Unique identifier (UUID)
    name: str                    # Full name
    email: str                   # Email address
    phone: str                   # Phone number
    location: str                # Location/address
    skills: List[str]            # List of skills
    hourly_rate: float           # Hourly rate in dollars
    created_at: datetime         # Registration timestamp
    bio: Optional[str]           # Biography
    rating: Optional[float]      # Average rating (0-5)
    total_tasks_completed: int   # Number of completed tasks
    availability: List[str]      # Available time slots
```

**Methods:**
- `add_skill(skill)` - Add a new skill
- `update_rating(rating)` - Update rating (calculates average)
- `complete_task()` - Increment completed task counter
- `to_dict()` - Convert to dictionary
- `from_dict(data)` - Create from dictionary

## API Reference

### User Operations

#### create_user(name, email, phone, location)

Create a new user account.

**Parameters:**
- `name` (str): User's full name
- `email` (str): User's email address
- `phone` (str): User's phone number
- `location` (str): User's location

**Returns:** `User` object

**Example:**
```python
user = api.create_user(
    name="Alice Johnson",
    email="alice@example.com",
    phone="+1-555-0101",
    location="Downtown"
)
```

#### get_user(user_id)

Get a user by their ID.

**Parameters:**
- `user_id` (str): User's unique identifier

**Returns:** `User` object or `None`

#### list_users()

Get all registered users.

**Returns:** List of `User` objects

---

### Helper Operations

#### create_helper(name, email, phone, location, skills, hourly_rate, bio=None)

Register a new helper.

**Parameters:**
- `name` (str): Helper's full name
- `email` (str): Helper's email address
- `phone` (str): Helper's phone number
- `location` (str): Helper's location
- `skills` (List[str]): List of skills
- `hourly_rate` (float): Hourly rate in dollars
- `bio` (str, optional): Helper's biography

**Returns:** `Helper` object

**Example:**
```python
helper = api.create_helper(
    name="Carlos Martinez",
    email="carlos@example.com",
    phone="+1-555-0201",
    location="Downtown",
    skills=["cleaning", "household"],
    hourly_rate=25.0,
    bio="Experienced cleaner"
)
```

#### get_helper(helper_id)

Get a helper by their ID.

**Parameters:**
- `helper_id` (str): Helper's unique identifier

**Returns:** `Helper` object or `None`

#### list_helpers(skill=None)

List all helpers, optionally filtered by skill.

**Parameters:**
- `skill` (str, optional): Filter by skill

**Returns:** List of `Helper` objects

#### search_helpers(location, skill=None)

Search for helpers by location and skill.

**Parameters:**
- `location` (str): Location to search in
- `skill` (str, optional): Required skill

**Returns:** List of matching `Helper` objects

#### rate_helper(helper_id, rating)

Rate a helper after task completion.

**Parameters:**
- `helper_id` (str): Helper's unique identifier
- `rating` (float): Rating value (0-5)

**Returns:** Updated `Helper` object

---

### Task Operations

#### create_task(title, description, category, user_id, location, budget, scheduled_for=None)

Post a new task.

**Parameters:**
- `title` (str): Task title
- `description` (str): Detailed description
- `category` (str): Task category
- `user_id` (str): ID of user posting the task
- `location` (str): Task location
- `budget` (float): Task budget in dollars
- `scheduled_for` (datetime, optional): Scheduled time

**Returns:** `Task` object

**Example:**
```python
task = api.create_task(
    title="House Cleaning",
    description="Clean 2-bedroom apartment",
    category="household",
    user_id=user.id,
    location="Downtown",
    budget=100.0
)
```

#### get_task(task_id)

Get a task by its ID.

**Parameters:**
- `task_id` (str): Task's unique identifier

**Returns:** `Task` object or `None`

#### list_tasks(status=None)

List all tasks, optionally filtered by status.

**Parameters:**
- `status` (str, optional): Filter by status

**Returns:** List of `Task` objects

#### assign_task(task_id, helper_id)

Assign a task to a helper.

**Parameters:**
- `task_id` (str): Task's unique identifier
- `helper_id` (str): Helper's unique identifier

**Returns:** Updated `Task` object

**Raises:**
- `ValueError`: If task or helper not found, or task not in OPEN status

#### update_task_status(task_id, status)

Update the status of a task.

**Parameters:**
- `task_id` (str): Task's unique identifier
- `status` (str): New status

**Returns:** Updated `Task` object

**Status Transitions:**
- `open` → `assigned` (via assign_task)
- `assigned` → `in_progress`
- `in_progress` → `completed`
- Any status → `cancelled`

## Error Handling

All API methods may raise exceptions:

- `ValueError`: Invalid input or business logic violations
- `KeyError`: Resource not found (for dictionary lookups)

**Example:**
```python
try:
    task = api.create_task(
        title="",  # Invalid: empty title
        description="Test",
        category="household",
        user_id=user.id,
        location="Downtown",
        budget=100.0
    )
except ValueError as e:
    print(f"Error: {e}")
```

## Usage Patterns

### Complete Workflow Example

```python
from src.api import HireBuddyAPI

# Initialize
api = HireBuddyAPI()

# 1. Create user
user = api.create_user(
    name="Alice",
    email="alice@example.com",
    phone="+1-555-0101",
    location="Downtown"
)

# 2. Register helper
helper = api.create_helper(
    name="Bob",
    email="bob@example.com",
    phone="+1-555-0201",
    location="Downtown",
    skills=["cleaning"],
    hourly_rate=25.0
)

# 3. Post task
task = api.create_task(
    title="House Cleaning",
    description="Clean apartment",
    category="household",
    user_id=user.id,
    location="Downtown",
    budget=100.0
)

# 4. Search and assign
helpers = api.search_helpers("Downtown", "cleaning")
if helpers:
    api.assign_task(task.id, helpers[0].id)

# 5. Update status
api.update_task_status(task.id, "in_progress")
api.update_task_status(task.id, "completed")

# 6. Rate helper
api.rate_helper(helper.id, 5.0)
```

## Future Enhancements

### Database Integration

Replace in-memory storage with database:
- PostgreSQL for relational data
- MongoDB for flexible schemas
- Redis for caching

### REST API

Expose functionality via HTTP endpoints:
- GET /users
- POST /tasks
- PUT /tasks/{id}/status
- etc.

### Authentication

Add user authentication:
- JWT tokens
- OAuth2 integration
- Role-based access control

### Advanced Features

- Real-time updates (WebSocket)
- Payment processing
- Geolocation-based search
- File uploads (photos, documents)
- Messaging between users and helpers
