# Gemini AI Storyboard Generator

This directory contains the backend code for generating storyboards using Google's Gemini AI API.

## Prerequisites

- Python 3.8 or higher
- Node.js and Next.js (for the frontend)
- Google Gemini API key

## Setup

1. Create a `.env` file in this directory with your Gemini API key:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

2. Make the start script executable:

```bash
chmod +x start_server.sh
```

3. Run the FastAPI server:

```bash
./start_server.sh
```

This will:
- Create a virtual environment
- Install the required packages
- Start the FastAPI server on http://localhost:8000

## API Endpoints

### `/generate-shots`

Generates movie shots from a story text.

**Request Body:**
```json
{
  "story_text": "Your script or story text here",
  "video_length_minutes": 1.0,
  "style": "hyperrealistic"
}
```

**Response:**
```json
{
  "message": "Shots generated successfully",
  "shots": [
    {
      "scene_number": 1,
      "shot_number": 1,
      "camera_view": "WIDE SHOT",
      "camera_motion": "Static",
      "characters": ["Character Name"],
      "dialogue": "Character dialogue here",
      "action": "Description of action",
      "setting": "Description of setting",
      "starting_image_description": "Detailed image description for AI generation"
    }
    // More shots...
  ]
}
```

## Integration with Next.js Frontend

The Next.js API endpoint in `app/api/gemini/route.ts` communicates with this FastAPI server and converts the response to the format expected by the frontend.

When a user clicks the "Generate Scenes with Gemini" button, the application will:

1. Send the script to the NextJS API endpoint
2. The NextJS endpoint will forward the request to this FastAPI server
3. Gemini AI will generate the shots
4. The shots will be converted to the format expected by the frontend
5. The scenes and shots will be displayed in the UI

## Troubleshooting

If you encounter any issues:

1. Ensure the FastAPI server is running
2. Check that your Gemini API key is valid
3. Look at the FastAPI server logs for any error messages
4. Make sure the Next.js API endpoint can communicate with the FastAPI server 