#!/bin/bash
# Simple shell script to run the Mistral API test

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 to run this test."
    exit 1
fi

# Check if requests module is installed
if ! python3 -c "import requests" &> /dev/null; then
    echo "📦 Installing required Python module: requests"
    pip3 install requests
fi

# Run the Python script
echo "🚀 Running Mistral API test..."
python3 test_mistral_api.py
