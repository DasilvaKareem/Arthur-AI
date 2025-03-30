#!/bin/bash

# Change to the FastAPI directory first
cd "$(dirname "$0")"

# Activate virtual environment (assuming it's already created)
echo "Activating virtual environment..."
source venv/bin/activate

# Start the FastAPI server
echo "Starting FastAPI server..."
cd backend
uvicorn main:app --reload 