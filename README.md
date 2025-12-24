# 🤝 HireBuddy

**Connect with local helpers for everyday tasks**

HireBuddy is an open-source platform that connects people with trusted local helpers for everyday tasks like errands, household work, cleaning, delivery, and more. It makes finding help easy and accessible for everyone.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.7+-blue.svg)](https://www.python.org/)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](docs/CONTRIBUTING.md)

---

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Usage Examples](#-usage-examples)
- [Data Models](#-data-models)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## ✨ Features

### Current (MVP)

- **User Management**: Create and manage user profiles
- **Helper Registration**: Register helpers with skills and rates
- **Task Posting**: Post tasks with descriptions, budgets, and schedules
- **Task Assignment**: Assign tasks to qualified helpers
- **Status Tracking**: Track task progress from open to completion
- **Helper Search**: Find helpers by location and skills
- **Rating System**: Rate helpers based on completed tasks

### Planned

- Database integration (PostgreSQL/MongoDB)
- REST API with Flask/FastAPI
- Web frontend interface
- Mobile app support
- Payment processing
- Real-time chat
- Advanced search and filtering
- Background verification
- Admin dashboard

---

## 🚀 Quick Start

### Prerequisites

- Python 3.7 or higher

### Installation

1. Clone the repository:
```bash
git clone https://github.com/priyanandrai/hirebuddy.git
cd hirebuddy
```

2. Run the demo:
```bash
python examples/demo.py
```

That's it! The demo will show you how to:
- Create users
- Register helpers
- Post tasks
- Assign and complete tasks
- Search for helpers

---

## 📁 Project Structure

```
hirebuddy/
├── src/
│   ├── __init__.py
│   ├── models/              # Data models
│   │   ├── __init__.py
│   │   ├── user.py         # User model
│   │   ├── task.py         # Task model
│   │   └── helper.py       # Helper model
│   └── api/                 # API logic
│       ├── __init__.py
│       └── hirebuddy_api.py # Main API implementation
├── examples/
│   └── demo.py              # Usage demonstration
├── docs/
│   └── CONTRIBUTING.md      # Contribution guidelines
├── LICENSE                  # MIT License
└── README.md               # This file
```

---

## 💡 Usage Examples

### Basic Usage

```python
from src.api import HireBuddyAPI

# Initialize the API
api = HireBuddyAPI()

# Create a user
user = api.create_user(
    name="Alice Johnson",
    email="alice@example.com",
    phone="+1-555-0101",
    location="Downtown"
)

# Register a helper
helper = api.create_helper(
    name="Carlos Martinez",
    email="carlos@example.com",
    phone="+1-555-0201",
    location="Downtown",
    skills=["cleaning", "household"],
    hourly_rate=25.0
)

# Post a task
task = api.create_task(
    title="House Cleaning",
    description="Need help cleaning a 2-bedroom apartment",
    category="household",
    user_id=user.id,
    location="Downtown",
    budget=100.0
)

# Assign task to helper
api.assign_task(task.id, helper.id)

# Update task status
api.update_task_status(task.id, "in_progress")
api.update_task_status(task.id, "completed")

# Rate the helper
api.rate_helper(helper.id, 5.0)
```

For a complete working example, see [`examples/demo.py`](examples/demo.py).

---

## 📊 Data Models

### User

Represents users who post tasks and hire helpers.

**Attributes:**
- `id`: Unique identifier
- `name`: User's full name
- `email`: Email address
- `phone`: Phone number
- `location`: User's location
- `rating`: Optional user rating
- `created_at`: Account creation timestamp

### Helper

Represents service providers who complete tasks.

**Attributes:**
- `id`: Unique identifier
- `name`: Helper's full name
- `email`: Email address
- `phone`: Phone number
- `location`: Helper's location
- `skills`: List of skills
- `hourly_rate`: Hourly rate in dollars
- `bio`: Optional biography
- `rating`: Average rating
- `total_tasks_completed`: Number of completed tasks
- `availability`: List of available time slots
- `created_at`: Registration timestamp

### Task

Represents jobs posted by users.

**Attributes:**
- `id`: Unique identifier
- `title`: Task title
- `description`: Detailed description
- `category`: Task category (errands, household, cleaning, etc.)
- `user_id`: ID of user who posted the task
- `location`: Task location
- `budget`: Task budget
- `status`: Current status (open, assigned, in_progress, completed, cancelled)
- `helper_id`: ID of assigned helper
- `scheduled_for`: Optional scheduled datetime
- `created_at`: Task creation timestamp
- `completed_at`: Optional completion timestamp

---

## 🔧 API Reference

### User Operations

- `create_user(name, email, phone, location)` - Create a new user
- `get_user(user_id)` - Get user by ID
- `list_users()` - List all users

### Helper Operations

- `create_helper(name, email, phone, location, skills, hourly_rate, bio)` - Register a new helper
- `get_helper(helper_id)` - Get helper by ID
- `list_helpers(skill)` - List all helpers, optionally filtered by skill
- `search_helpers(location, skill)` - Search helpers by location and skill
- `rate_helper(helper_id, rating)` - Rate a helper (0-5)

### Task Operations

- `create_task(title, description, category, user_id, location, budget, scheduled_for)` - Post a new task
- `get_task(task_id)` - Get task by ID
- `list_tasks(status)` - List all tasks, optionally filtered by status
- `assign_task(task_id, helper_id)` - Assign a task to a helper
- `update_task_status(task_id, status)` - Update task status

---

## 🤝 Contributing

We welcome contributions from everyone! Whether you're a beginner or an experienced developer, there's a way for you to help.

### How to Contribute

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

For detailed guidelines, see [CONTRIBUTING.md](docs/CONTRIBUTING.md).

### Good First Issues

- Add input validation
- Improve error messages
- Add more documentation
- Write test cases
- Add more example scripts

---

## 🗺️ Roadmap

### Phase 1: MVP (Current)
- [x] Basic data models
- [x] In-memory API
- [x] Example usage
- [x] Documentation

### Phase 2: Backend
- [ ] Database integration
- [ ] REST API endpoints
- [ ] Authentication system
- [ ] Unit tests
- [ ] API documentation

### Phase 3: Frontend
- [ ] Web interface
- [ ] User dashboard
- [ ] Helper dashboard
- [ ] Task marketplace
- [ ] Messaging system

### Phase 4: Advanced Features
- [ ] Mobile app
- [ ] Payment integration
- [ ] Real-time notifications
- [ ] Advanced search
- [ ] Background checks
- [ ] Analytics dashboard

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌟 Support

If you find this project helpful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🤝 Contributing code

---

## 📞 Contact

For questions or suggestions, please open an issue on GitHub.

---

**Made with ❤️ by the HireBuddy community**
