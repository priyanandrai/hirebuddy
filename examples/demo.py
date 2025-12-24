"""
Example usage of HireBuddy API

This script demonstrates how to use the HireBuddy API to:
1. Create users
2. Register helpers
3. Post tasks
4. Assign tasks to helpers
5. Complete the task workflow
"""

import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path to import src module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.api import HireBuddyAPI


def main():
    # Initialize the API
    api = HireBuddyAPI()
    
    print("=" * 60)
    print("Welcome to HireBuddy - Connect with Local Helpers!")
    print("=" * 60)
    print()
    
    # 1. Create some users
    print("1. Creating users...")
    user1 = api.create_user(
        name="Alice Johnson",
        email="alice@example.com",
        phone="+1-555-0101",
        location="Downtown"
    )
    print(f"   ✓ Created user: {user1.name} (ID: {user1.id[:8]}...)")
    
    user2 = api.create_user(
        name="Bob Smith",
        email="bob@example.com",
        phone="+1-555-0102",
        location="Uptown"
    )
    print(f"   ✓ Created user: {user2.name} (ID: {user2.id[:8]}...)")
    print()
    
    # 2. Register some helpers
    print("2. Registering helpers...")
    helper1 = api.create_helper(
        name="Carlos Martinez",
        email="carlos@example.com",
        phone="+1-555-0201",
        location="Downtown",
        skills=["cleaning", "household", "gardening"],
        hourly_rate=25.0,
        bio="Experienced in household tasks with 5 years experience"
    )
    print(f"   ✓ Registered helper: {helper1.name}")
    print(f"     Skills: {', '.join(helper1.skills)}")
    print(f"     Rate: ${helper1.hourly_rate}/hour")
    
    helper2 = api.create_helper(
        name="Diana Lee",
        email="diana@example.com",
        phone="+1-555-0202",
        location="Downtown",
        skills=["errands", "delivery", "moving"],
        hourly_rate=20.0,
        bio="Fast and reliable delivery and errand services"
    )
    print(f"   ✓ Registered helper: {helper2.name}")
    print(f"     Skills: {', '.join(helper2.skills)}")
    print(f"     Rate: ${helper2.hourly_rate}/hour")
    print()
    
    # 3. Post some tasks
    print("3. Posting tasks...")
    task1 = api.create_task(
        title="House Cleaning",
        description="Need help cleaning a 2-bedroom apartment",
        category="household",
        user_id=user1.id,
        location="Downtown",
        budget=100.0,
        scheduled_for=datetime.now() + timedelta(days=2)
    )
    print(f"   ✓ Posted task: {task1.title}")
    print(f"     Budget: ${task1.budget}")
    print(f"     Status: {task1.status.value}")
    
    task2 = api.create_task(
        title="Grocery Shopping",
        description="Pick up groceries from the local market",
        category="errands",
        user_id=user2.id,
        location="Downtown",
        budget=30.0,
        scheduled_for=datetime.now() + timedelta(days=1)
    )
    print(f"   ✓ Posted task: {task2.title}")
    print(f"     Budget: ${task2.budget}")
    print(f"     Status: {task2.status.value}")
    print()
    
    # 4. Search for helpers
    print("4. Searching for helpers...")
    cleaning_helpers = api.search_helpers(location="Downtown", skill="cleaning")
    print(f"   Found {len(cleaning_helpers)} helper(s) with cleaning skills in Downtown")
    for helper in cleaning_helpers:
        print(f"   - {helper.name} (${helper.hourly_rate}/hour)")
    print()
    
    # 5. Assign tasks to helpers
    print("5. Assigning tasks to helpers...")
    api.assign_task(task1.id, helper1.id)
    print(f"   ✓ Assigned '{task1.title}' to {helper1.name}")
    
    api.assign_task(task2.id, helper2.id)
    print(f"   ✓ Assigned '{task2.title}' to {helper2.name}")
    print()
    
    # 6. Update task status
    print("6. Processing tasks...")
    api.update_task_status(task1.id, "in_progress")
    print(f"   ✓ Task '{task1.title}' is now in progress")
    
    api.update_task_status(task1.id, "completed")
    print(f"   ✓ Task '{task1.title}' completed!")
    
    # Rate the helper
    api.rate_helper(helper1.id, 5.0)
    print(f"   ✓ Rated {helper1.name}: {helper1.rating}/5.0 stars")
    print()
    
    # 7. View statistics
    print("7. Platform Statistics")
    print(f"   Total Users: {len(api.list_users())}")
    print(f"   Total Helpers: {len(api.list_helpers())}")
    print(f"   Total Tasks: {len(api.list_tasks())}")
    print(f"   Open Tasks: {len(api.list_tasks(status='open'))}")
    print(f"   Completed Tasks: {len(api.list_tasks(status='completed'))}")
    print()
    
    print("=" * 60)
    print("Demo completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
