"""
Simple validation script to test HireBuddy core functionality
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from datetime import datetime
from src.api import HireBuddyAPI
from src.models.task import TaskStatus, TaskCategory

def test_user_operations():
    """Test user creation and retrieval"""
    api = HireBuddyAPI()
    
    user = api.create_user(
        name="Test User",
        email="test@example.com",
        phone="+1-555-0001",
        location="Test City"
    )
    
    assert user.name == "Test User"
    assert user.email == "test@example.com"
    
    retrieved = api.get_user(user.id)
    assert retrieved is not None
    assert retrieved.id == user.id
    
    print("✓ User operations working correctly")

def test_helper_operations():
    """Test helper creation and search"""
    api = HireBuddyAPI()
    
    helper = api.create_helper(
        name="Test Helper",
        email="helper@example.com",
        phone="+1-555-0002",
        location="Test City",
        skills=["cleaning", "cooking"],
        hourly_rate=20.0
    )
    
    assert helper.name == "Test Helper"
    assert "cleaning" in helper.skills
    
    # Test search
    results = api.search_helpers("Test City", "cleaning")
    assert len(results) == 1
    assert results[0].id == helper.id
    
    print("✓ Helper operations working correctly")

def test_task_workflow():
    """Test complete task workflow"""
    api = HireBuddyAPI()
    
    # Create user and helper
    user = api.create_user(
        name="Task User",
        email="taskuser@example.com",
        phone="+1-555-0003",
        location="Task City"
    )
    
    helper = api.create_helper(
        name="Task Helper",
        email="taskhelper@example.com",
        phone="+1-555-0004",
        location="Task City",
        skills=["cleaning"],
        hourly_rate=25.0
    )
    
    # Create task
    task = api.create_task(
        title="Test Task",
        description="Test description",
        category="household",
        user_id=user.id,
        location="Task City",
        budget=50.0
    )
    
    assert task.status == TaskStatus.OPEN
    
    # Assign task
    api.assign_task(task.id, helper.id)
    assert task.status == TaskStatus.ASSIGNED
    assert task.helper_id == helper.id
    
    # Update status
    api.update_task_status(task.id, "in_progress")
    assert task.status == TaskStatus.IN_PROGRESS
    
    api.update_task_status(task.id, "completed")
    assert task.status == TaskStatus.COMPLETED
    assert task.completed_at is not None
    
    # Check helper stats
    assert helper.total_tasks_completed == 1
    
    print("✓ Task workflow working correctly")

def test_rating_system():
    """Test helper rating system"""
    api = HireBuddyAPI()
    
    helper = api.create_helper(
        name="Rated Helper",
        email="rated@example.com",
        phone="+1-555-0005",
        location="Rating City",
        skills=["cleaning"],
        hourly_rate=30.0
    )
    
    # Initial rating
    api.rate_helper(helper.id, 4.5)
    assert helper.rating == 4.5
    
    # Update rating (should calculate average)
    api.rate_helper(helper.id, 5.0)
    assert helper.rating > 4.5  # Should be between 4.5 and 5.0
    
    print("✓ Rating system working correctly")

def test_data_serialization():
    """Test model serialization"""
    api = HireBuddyAPI()
    
    user = api.create_user(
        name="Serial User",
        email="serial@example.com",
        phone="+1-555-0006",
        location="Serial City"
    )
    
    # Convert to dict
    user_dict = user.to_dict()
    assert user_dict["name"] == "Serial User"
    assert user_dict["email"] == "serial@example.com"
    
    print("✓ Data serialization working correctly")

def main():
    """Run all validation tests"""
    print("=" * 60)
    print("Running HireBuddy Validation Tests")
    print("=" * 60)
    print()
    
    try:
        test_user_operations()
        test_helper_operations()
        test_task_workflow()
        test_rating_system()
        test_data_serialization()
        
        print()
        print("=" * 60)
        print("All validation tests passed! ✓")
        print("=" * 60)
        return 0
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        return 1
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
