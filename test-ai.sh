#!/bin/bash
# Simple test script for the AI Meal Planner

# Set variables
SUPABASE_URL="https://ntyrjdiwsdccayaiwbmd.supabase.co"
FUNCTION_NAME="ai-test"
ANON_KEY="0e5ahwrl54ofU9CC5T5n2uCiRIfWNzpo"

echo "🧪 Testing AI Meal Planner response..."

# Call the function using curl
response=$(curl -s -X POST \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer $ANON_KEY" \
  --data '{}' \
  "${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}")

# Print the raw response for debugging
echo "Raw response: $response"

# Check if we got a response
if [ -n "$response" ]; then
  # Check if the response contains an error
  if echo "$response" | grep -q "error"; then
    echo "❌ AI responded with an error"
    echo "Response: $response"
    echo "😞 Test failed."
    exit 1
  else
    echo "✅ AI responded successfully!"
    echo "Response: $response"
    echo "🎉 Test completed successfully!"
    exit 0
  fi
else
  echo "❌ No response from AI"
  echo "😞 Test failed."
  exit 1
fi
