"""
Simplified FastAPI backend for AI Meal Planning with Mistral integration
"""

import os
import json
import requests
from typing import Dict, List, Optional, Any
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="AI Meal Planner API",
    description="API for AI-powered meal planning using Mistral",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mistral API settings
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "0e5ahwrl54ofU9CC5T5n2uCiRIfWNzpo")
MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"

# Function to call Mistral API
def call_mistral_api(system_prompt, user_prompt):
    """Call Mistral API using requests"""
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {MISTRAL_API_KEY}"
    }

    data = {
        "model": "mistral-large-latest",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 4000,
        "response_format": {"type": "json_object"}
    }

    response = requests.post(MISTRAL_API_URL, headers=headers, json=data)
    response.raise_for_status()

    result = response.json()
    return result["choices"][0]["message"]["content"]

# Define Pydantic models for request/response validation
class NutritionGoals(BaseModel):
    focus: str = Field(default="balanced", description="Nutrition focus (e.g., balanced, protein, iron)")

class MealPlanPreferences(BaseModel):
    targetUser: str = Field(..., description="Target user (mother or child)")
    childAge: Optional[int] = Field(None, description="Child age in months (if targetUser is child)")
    mealType: str = Field(..., description="Meal type (breakfast, lunch, dinner, snack)")
    dietaryRestrictions: Optional[List[str]] = Field(default=[], description="Dietary restrictions")
    nutritionGoals: Optional[NutritionGoals] = Field(default=NutritionGoals(), description="Nutrition goals")
    preferTraditional: Optional[bool] = Field(default=True, description="Prefer traditional foods")

class TestMessage(BaseModel):
    message: str = Field(..., description="Test message to check API connectivity")

class MealPlanResponse(BaseModel):
    mealPlan: Dict[str, Any] = Field(..., description="Generated meal plan")

# Sample food items data
SAMPLE_FOOD_ITEMS = [
    {
        "name": "Sadza (Maize Porridge)",
        "description": "Traditional Zimbabwean staple food made from maize meal",
        "nutrients": {
            "calories": 120,
            "protein": 2.5,
            "carbs": 25,
            "fat": 0.5
        },
        "suitable_for": ["mother", "child_9_plus"],
        "meal_type": ["lunch", "dinner"],
        "traditional": True,
        "emoji": "🌽🍚"
    },
    {
        "name": "Mashed Sweet Potato and Avocado",
        "description": "Nutritious blend for babies combining sweet potatoes and avocados",
        "nutrients": {
            "calories": 150,
            "protein": 2,
            "carbs": 20,
            "fat": 7
        },
        "suitable_for": ["child_6_plus"],
        "meal_type": ["lunch"],
        "traditional": True,
        "emoji": "🍠🥑"
    },
    {
        "name": "Enriched Maize Porridge (Hupfu)",
        "description": "A traditional Zimbabwean porridge made from maize meal, enriched with peanut butter and milk for added nutrition.",
        "nutrients": {
            "calories": 180,
            "protein": 6,
            "carbs": 30,
            "fat": 4
        },
        "suitable_for": ["child_6_plus", "child_9_plus"],
        "meal_type": ["breakfast"],
        "traditional": True,
        "emoji": "🌽🥣"
    },
    {
        "name": "Lactation-Boosting Oatmeal with Moringa",
        "description": "A nutritious breakfast for breastfeeding mothers that helps boost milk production.",
        "nutrients": {
            "calories": 350,
            "protein": 12,
            "carbs": 45,
            "fat": 14
        },
        "suitable_for": ["mother"],
        "meal_type": ["breakfast"],
        "traditional": False,
        "emoji": "🥣🌿"
    }
]

# Routes
@app.get("/")
async def root():
    """Root endpoint to check if the API is running"""
    return {
        "message": "AI Meal Planner API is running",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/test", response_model=Dict[str, Any])
async def test_api(request: TestMessage):
    """Test endpoint to check if the API is working correctly"""
    try:
        return {
            "response": "Hello! I am the AI Meal Planner. I can help you plan nutritious meals for mothers and babies in Zimbabwe.",
            "receivedMessage": request.message,
            "status": "ok",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.post("/api/meal-plan", response_model=MealPlanResponse)
async def generate_meal_plan(preferences: MealPlanPreferences):
    """Generate a meal plan based on user preferences"""
    try:
        # Filter food items based on preferences
        filtered_food_items = []

        for item in SAMPLE_FOOD_ITEMS:
            # Filter by target user
            if preferences.targetUser == "child" and preferences.childAge:
                # Convert child age to appropriate category
                age_category = None
                if preferences.childAge < 6:
                    age_category = "child_0_6"
                elif preferences.childAge < 9:
                    age_category = "child_6_plus"
                elif preferences.childAge < 12:
                    age_category = "child_9_plus"
                else:
                    age_category = "child_12_plus"

                if age_category in item["suitable_for"]:
                    filtered_food_items.append(item)
            elif preferences.targetUser == "mother" and "mother" in item["suitable_for"]:
                filtered_food_items.append(item)

        # If no food items found after filtering, use all sample data
        if not filtered_food_items:
            filtered_food_items = SAMPLE_FOOD_ITEMS

        # Construct prompt for Mistral
        system_prompt = f"""You are a nutritional expert specializing in meal planning for mothers and children in Zimbabwe.
        Your task is to create a personalized meal plan based on the user's preferences and the available food items.
        The meal plan should be nutritionally balanced, culturally appropriate, and tailored to the specific needs of the target user.

        Available food items:
        {json.dumps(filtered_food_items, indent=2)}

        User preferences:
        {json.dumps(preferences.dict(), indent=2)}

        Please generate a meal plan with the following structure:
        1. A brief introduction explaining the benefits of the meal plan
        2. A list of meals for the specified meal type (breakfast, lunch, dinner, or snack)
        3. For each meal, include:
           - Name
           - Ingredients
           - Preparation instructions
           - Nutritional information
           - Benefits for the target user
        4. Tips for preparation and storage

        Return the meal plan as a JSON object with the following structure:
        {{
          "introduction": "string",
          "meals": [
            {{
              "name": "string",
              "ingredients": ["string"],
              "instructions": ["string"],
              "nutrients": {{ "calories": number, "protein": number, "carbs": number, "fat": number }},
              "benefits": "string",
              "imageEmoji": "string" // An emoji that represents this food
            }}
          ],
          "tips": ["string"]
        }}"""

        # Call Mistral API
        try:
            meal_plan_content = call_mistral_api(
                system_prompt=system_prompt,
                user_prompt="Please generate a meal plan based on my preferences."
            )

            # Parse the meal plan
            meal_plan = json.loads(meal_plan_content)
        except Exception as e:
            print(f"Error calling Mistral API: {str(e)}")
            # Fallback to a simple meal plan if API call fails
            meal_plan = {
                "introduction": "This is a simple nutritious meal plan based on your preferences.",
                "meals": [
                    {
                        "name": "Simple Nutritious Breakfast",
                        "ingredients": ["Oatmeal", "Milk", "Honey", "Banana"],
                        "instructions": ["Mix oatmeal with milk", "Heat for 2 minutes", "Add honey and sliced banana"],
                        "nutrients": {"calories": 300, "protein": 10, "carbs": 45, "fat": 5},
                        "benefits": "Provides energy and essential nutrients to start the day.",
                        "imageEmoji": "🥣"
                    }
                ],
                "tips": ["Prepare ingredients the night before for quicker cooking."]
            }

        return {"mealPlan": meal_plan}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating meal plan: {str(e)}")

@app.get("/api/food-items")
async def get_food_items():
    """Get all food items from the sample data"""
    try:
        return {"foodItems": SAMPLE_FOOD_ITEMS}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching food items: {str(e)}")

# Run the application
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("DEBUG", "False").lower() == "true"

    uvicorn.run("main:app", host=host, port=port, reload=debug)
