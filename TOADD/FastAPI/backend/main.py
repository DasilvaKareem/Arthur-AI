from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the story_to_movie_shots module
from story_to_movie_shots import generate_story_to_movie

app = FastAPI()

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StoryInput(BaseModel):
    story_text: str
    video_length_minutes: float = 1.0
    style: str = "hyperrealistic"

@app.post("/generate-shots")
async def generate_shots(story_input: StoryInput = Body(...)):
    try:
        # Create a temporary directory to store the output
        os.makedirs("temp", exist_ok=True)
        
        # Generate a unique filename
        import uuid
        output_filename = f"temp/shot_output_{uuid.uuid4()}.json"
        
        # Call the generate_story_to_movie function with custom output
        from io import StringIO
        import sys
        
        # Temporarily redirect stdout to capture the output
        old_stdout = sys.stdout
        sys.stdout = mystdout = StringIO()
        
        # Call the function
        generate_story_to_movie(
            story_input.story_text,
            story_input.video_length_minutes,
            story_input.style,
            output_filename=output_filename
        )
        
        # Restore stdout
        sys.stdout = old_stdout
        
        # Read the generated JSON file
        with open(output_filename, 'r') as f:
            shots_data = json.load(f)
            
        # Clean up the temporary file
        if os.path.exists(output_filename):
            os.remove(output_filename)
            
        return {
            "message": "Shots generated successfully",
            "shots": shots_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating shots: {str(e)}")

# For testing purposes
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 