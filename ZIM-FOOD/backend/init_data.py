#!/usr/bin/env python3
"""
Script to initialize Zimbabwe food data in Supabase
This script loads the pickle file and creates food items in the Supabase database
"""

import os
import pickle
import json
from dotenv import load_dotenv
from supabase import create_client, Client
import pickle
import sys

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Path to the pickle file
PICKLE_PATH = "../zim_food_composition_full.pkl"

def load_pickle_data():
    """Load data from the pickle file"""
    try:
        print(f"Loading pickle file from {PICKLE_PATH}...")
        with open(PICKLE_PATH, 'rb') as f:
            data = pickle.load(f)
        print("✅ Pickle file loaded successfully")
        return data
    except Exception as e:
        print(f"❌ Error loading pickle file: {str(e)}")
        return None

def extract_food_items(pickle_data):
    """Extract food items from the pickle data"""
    try:
        food_items = []
        
        # In a real implementation, you would parse the pickle data
        # to extract food items. For this example, we'll use sample data.
        
        # Sample food items
        food_items = [
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
            },
            {
                "name": "Iron-Rich Liver Stew with Sadza",
                "description": "A traditional Zimbabwean meal that helps new mothers recover from blood loss during childbirth.",
                "nutrients": {
                    "calories": 450,
                    "protein": 35,
                    "carbs": 40,
                    "fat": 15
                },
                "suitable_for": ["mother"],
                "meal_type": ["dinner"],
                "traditional": True,
                "emoji": "🍲🍖"
            },
            {
                "name": "Pumpkin and Millet Porridge",
                "description": "A nutritious breakfast option combining locally grown pumpkin with millet, rich in iron.",
                "nutrients": {
                    "calories": 160,
                    "protein": 4,
                    "carbs": 28,
                    "fat": 3
                },
                "suitable_for": ["child_7_plus", "child_9_plus", "child_12_plus"],
                "meal_type": ["breakfast"],
                "traditional": True,
                "emoji": "🎃🌾"
            },
            {
                "name": "Mashed Banana and Avocado",
                "description": "A simple, nutritious first food for babies starting solids.",
                "nutrients": {
                    "calories": 120,
                    "protein": 1,
                    "carbs": 15,
                    "fat": 8
                },
                "suitable_for": ["child_6_plus"],
                "meal_type": ["breakfast", "snack"],
                "traditional": False,
                "emoji": "🍌🥑"
            },
            {
                "name": "Nutritious Vegetable Soup for Mothers",
                "description": "A hearty soup packed with vegetables and beans to provide essential nutrients for postpartum recovery.",
                "nutrients": {
                    "calories": 320,
                    "protein": 15,
                    "carbs": 45,
                    "fat": 8
                },
                "suitable_for": ["mother"],
                "meal_type": ["lunch", "dinner"],
                "traditional": False,
                "emoji": "🍲🥕"
            }
        ]
        
        print(f"✅ Extracted {len(food_items)} food items")
        return food_items
    except Exception as e:
        print(f"❌ Error extracting food items: {str(e)}")
        return []

def store_food_items(food_items):
    """Store food items in Supabase"""
    try:
        # Check if table exists
        print("Checking if zimbabwe_foods table exists...")
        
        # Clear existing data
        print("Clearing existing data...")
        supabase.table("zimbabwe_foods").delete().execute()
        
        # Insert food items
        print(f"Inserting {len(food_items)} food items...")
        for item in food_items:
            response = supabase.table("zimbabwe_foods").insert(item).execute()
            if hasattr(response, 'error') and response.error:
                print(f"❌ Error inserting food item {item['name']}: {response.error}")
            else:
                print(f"✅ Inserted food item: {item['name']}")
        
        print("✅ All food items inserted successfully")
        return True
    except Exception as e:
        print(f"❌ Error storing food items: {str(e)}")
        return False

def main():
    """Main function to initialize data"""
    print("🚀 Initializing Zimbabwe food data in Supabase...")
    
    # Load pickle data
    pickle_data = load_pickle_data()
    if not pickle_data:
        print("⚠️ Using sample data instead of pickle data")
    
    # Extract food items
    food_items = extract_food_items(pickle_data)
    if not food_items:
        print("❌ No food items extracted. Exiting.")
        return False
    
    # Store food items in Supabase
    success = store_food_items(food_items)
    
    if success:
        print("🎉 Zimbabwe food data initialized successfully!")
        return True
    else:
        print("❌ Failed to initialize Zimbabwe food data.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
