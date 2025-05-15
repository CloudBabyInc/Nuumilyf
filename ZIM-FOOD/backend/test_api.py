#!/usr/bin/env python3
"""
Script to test the AI Meal Planner API
This script sends a test request to the API and prints the response
"""

import os
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API URL (assuming the server is running locally)
API_URL = "http://localhost:8000"

def test_root_endpoint():
    """Test the root endpoint"""
    try:
        print("Testing root endpoint...")
        response = requests.get(f"{API_URL}/")
        
        if response.status_code == 200:
            print("✅ Root endpoint is working")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"❌ Root endpoint returned status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing root endpoint: {str(e)}")
        return False

def test_api_endpoint():
    """Test the API test endpoint"""
    try:
        print("\nTesting API test endpoint...")
        response = requests.post(
            f"{API_URL}/api/test",
            json={"message": "Hello from test script!"}
        )
        
        if response.status_code == 200:
            print("✅ API test endpoint is working")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"❌ API test endpoint returned status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing API test endpoint: {str(e)}")
        return False

def test_meal_plan_endpoint():
    """Test the meal plan endpoint"""
    try:
        print("\nTesting meal plan endpoint...")
        
        # Sample preferences
        preferences = {
            "targetUser": "child",
            "childAge": 5,
            "mealType": "breakfast",
            "dietaryRestrictions": [],
            "nutritionGoals": {
                "focus": "balanced"
            },
            "preferTraditional": True
        }
        
        response = requests.post(
            f"{API_URL}/api/meal-plan",
            json=preferences
        )
        
        if response.status_code == 200:
            print("✅ Meal plan endpoint is working")
            result = response.json()
            
            # Print a summary of the meal plan
            meal_plan = result.get("mealPlan", {})
            print("\n📝 Meal Plan Summary:")
            print("-" * 50)
            
            # Print introduction
            intro = meal_plan.get("introduction", "")
            if intro:
                print(f"Introduction: {intro[:100]}...")
            
            # Print meals
            meals = meal_plan.get("meals", [])
            print(f"\nNumber of meals: {len(meals)}")
            
            for i, meal in enumerate(meals):
                print(f"\nMeal {i+1}: {meal.get('name')}")
                print(f"Emoji: {meal.get('imageEmoji', '🍽️')}")
                print(f"Ingredients: {len(meal.get('ingredients', []))} items")
                print(f"Instructions: {len(meal.get('instructions', []))} steps")
                
                nutrients = meal.get("nutrients", {})
                print(f"Nutrients: {nutrients.get('calories', 0)} kcal, {nutrients.get('protein', 0)}g protein")
            
            # Print tips
            tips = meal_plan.get("tips", [])
            print(f"\nNumber of tips: {len(tips)}")
            
            print("-" * 50)
            return True
        else:
            print(f"❌ Meal plan endpoint returned status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing meal plan endpoint: {str(e)}")
        return False

def main():
    """Main function to run all tests"""
    print("🧪 Testing AI Meal Planner API...")
    
    # Test root endpoint
    root_success = test_root_endpoint()
    
    # Test API test endpoint
    api_success = test_api_endpoint()
    
    # Test meal plan endpoint
    meal_plan_success = test_meal_plan_endpoint()
    
    # Print summary
    print("\n📊 Test Summary:")
    print(f"Root Endpoint: {'✅ Passed' if root_success else '❌ Failed'}")
    print(f"API Test Endpoint: {'✅ Passed' if api_success else '❌ Failed'}")
    print(f"Meal Plan Endpoint: {'✅ Passed' if meal_plan_success else '❌ Failed'}")
    
    # Overall result
    if root_success and api_success and meal_plan_success:
        print("\n🎉 All tests passed!")
        return True
    else:
        print("\n❌ Some tests failed.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
