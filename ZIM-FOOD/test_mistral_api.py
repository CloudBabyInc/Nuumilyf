#!/usr/bin/env python3
"""
Simple script to test connection to Mistral-Large API.
This script sends a basic prompt to the Mistral-Large model and prints the response.
"""

import os
import json
import requests
from datetime import datetime

# Mistral API key
MISTRAL_API_KEY = "0e5ahwrl54ofU9CC5T5n2uCiRIfWNzpo"

# Mistral API endpoint
API_URL = "https://api.mistral.ai/v1/chat/completions"

def test_mistral_api():
    """Test connection to Mistral-Large API."""
    print(f"🧪 Testing Mistral-Large API connection at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Headers for the API request
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {MISTRAL_API_KEY}"
    }
    
    # Simple prompt about meal planning
    data = {
        "model": "mistral-large-latest",
        "messages": [
            {
                "role": "system",
                "content": "You are a nutritional expert specializing in meal planning for mothers and children in Zimbabwe."
            },
            {
                "role": "user",
                "content": "Can you suggest a simple nutritious breakfast for a 9-month-old baby in Zimbabwe?"
            }
        ],
        "temperature": 0.7,
        "max_tokens": 500
    }
    
    try:
        # Make the API request
        print("Sending request to Mistral API...")
        response = requests.post(API_URL, headers=headers, json=data)
        
        # Check if the request was successful
        if response.status_code == 200:
            result = response.json()
            print("\n✅ Successfully connected to Mistral API!")
            print(f"Status Code: {response.status_code}")
            
            # Extract and print the response content
            if "choices" in result and len(result["choices"]) > 0:
                message = result["choices"][0]["message"]["content"]
                print("\n📝 Response from Mistral-Large:")
                print("-" * 50)
                print(message)
                print("-" * 50)
                
                # Print model information
                if "model" in result:
                    print(f"\nModel used: {result['model']}")
                
                # Print usage information
                if "usage" in result:
                    print("\nToken Usage:")
                    print(f"  Prompt tokens: {result['usage']['prompt_tokens']}")
                    print(f"  Completion tokens: {result['usage']['completion_tokens']}")
                    print(f"  Total tokens: {result['usage']['total_tokens']}")
            else:
                print("❌ No message content in the response")
                print("Full response:", json.dumps(result, indent=2))
        else:
            print(f"❌ Failed to connect to Mistral API. Status code: {response.status_code}")
            print("Response:", response.text)
            
    except Exception as e:
        print(f"❌ Error connecting to Mistral API: {str(e)}")
    
    print("\n🎯 Test completed!")

if __name__ == "__main__":
    test_mistral_api()
