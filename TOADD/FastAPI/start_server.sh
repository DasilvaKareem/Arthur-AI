#!/bin/bash

# Change to the FastAPI directory first
cd "$(dirname "$0")"

# Create a virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install required packages
pip install fastapi uvicorn python-dotenv google-generativeai

# Start the FastAPI server
echo "Starting FastAPI server..."
cd backend
uvicorn main:app --reload 