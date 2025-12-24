# Quick Start Guide

Welcome to HireBuddy! This guide will help you get started quickly.

## What is HireBuddy?

HireBuddy is a platform that connects people who need help with everyday tasks (like cleaning, errands, moving) with local helpers who can do those jobs.

## Installation

### Prerequisites
- Python 3.7 or higher (check with `python --version`)

### Get the Code

```bash
# Clone the repository
git clone https://github.com/priyanandrai/hirebuddy.git

# Navigate to the project
cd hirebuddy
```

That's it! No dependencies to install for the MVP version.

## Run the Demo

```bash
python examples/demo.py
```

This will show you a complete workflow:
- Creating users
- Registering helpers
- Posting tasks
- Assigning and completing tasks
- Rating helpers

## Run Validation Tests

```bash
python examples/validate.py
```

This runs a series of tests to ensure everything is working correctly.

## Your First Contribution

### 1. Understand the Code Structure

```
hirebuddy/
├── src/
│   ├── models/      # Data definitions (User, Task, Helper)
│   └── api/         # Business logic
├── examples/        # Example scripts
└── docs/            # Documentation
```

### 2. Try Modifying the Demo

Open `examples/demo.py` and try:
- Adding more users
- Creating different types of tasks
- Changing helper skills
- Experimenting with the workflow

### 3. Explore the Models

Look at the data models in `src/models/`:
- `user.py` - How users are represented
- `helper.py` - How helpers are represented
- `task.py` - How tasks are represented

Each model has methods like `to_dict()` that you can explore.

### 4. Understand the API

The main API is in `src/api/hirebuddy_api.py`. Key methods:

```python
# User operations
api.create_user(name, email, phone, location)
api.get_user(user_id)

# Helper operations
api.create_helper(name, email, phone, location, skills, hourly_rate)
api.search_helpers(location, skill)

# Task operations
api.create_task(title, description, category, user_id, location, budget)
api.assign_task(task_id, helper_id)
api.update_task_status(task_id, status)
```

## Simple Coding Exercise

Create a new file `examples/my_test.py`:

```python
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.api import HireBuddyAPI

# Initialize API
api = HireBuddyAPI()

# Create your own user
user = api.create_user(
    name="Your Name",
    email="your.email@example.com",
    phone="+1-555-1234",
    location="Your City"
)

print(f"Created user: {user.name}")

# Try creating a helper and task yourself!
```

Run it:
```bash
python examples/my_test.py
```

## Next Steps

### Easy Tasks (Good for Beginners)

1. **Add More Task Categories**
   - Edit `src/models/task.py`
   - Add categories like "BABYSITTING", "TUTORING", "PET_CARE"

2. **Add Validation**
   - Add email format validation in `user.py`
   - Add phone number validation

3. **Improve Error Messages**
   - Make error messages more helpful
   - Add specific error types

4. **Add More Examples**
   - Create an example for searching helpers
   - Create an example for listing tasks

### Intermediate Tasks

1. **Add Task Filtering**
   - Filter tasks by category
   - Filter tasks by budget range
   - Filter tasks by location

2. **Add Helper Availability**
   - Implement time slot checking
   - Prevent double-booking

3. **Add Statistics**
   - Helper performance metrics
   - User activity tracking
   - Popular task categories

### Advanced Tasks

1. **Database Integration**
   - Replace in-memory storage with SQLite
   - Add data persistence

2. **REST API**
   - Create Flask/FastAPI endpoints
   - Add API documentation

3. **Web Interface**
   - Build a simple web UI
   - Create user and helper dashboards

## Getting Help

- Read the [API Documentation](../docs/API.md)
- Check the [Contributing Guide](../docs/CONTRIBUTING.md)
- Open an issue on GitHub
- Look at existing code for examples

## Common Issues

### Import Error

If you see `ModuleNotFoundError: No module named 'src'`, make sure to add:

```python
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
```

at the top of your script.

### Python Version

If you have multiple Python versions, use `python3` instead of `python`:

```bash
python3 examples/demo.py
```

## Tips

1. **Start Small**: Make small changes and test them
2. **Read the Code**: The best way to learn is to read existing code
3. **Ask Questions**: Don't hesitate to open an issue
4. **Have Fun**: Experiment and try new things!

## Resources

- [Python Official Tutorial](https://docs.python.org/3/tutorial/)
- [Python Dataclasses](https://docs.python.org/3/library/dataclasses.html)
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)

---

**Happy Coding! 🚀**
