import base64
import os
import json
import math
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()


def extract_unique_characters(shots_data):
    """
    Extract all unique characters from the JSON shot data.
    
    Args:
        shots_data (list): List of shot objects from the JSON
        
    Returns:
        list: Alphabetically sorted list of unique character names
    """
    all_characters = []
    
    # Iterate through each shot
    for shot in shots_data:
        # Get characters from the current shot
        characters = shot.get("characters", [])
        if characters:
            all_characters.extend(characters)
    
    # Remove duplicates and sort alphabetically
    unique_characters = sorted(list(set(all_characters)))
    return unique_characters


def extract_image_descriptions(shots_data):
    """
    Extract all starting image descriptions from the JSON shot data.
    
    Args:
        shots_data (list): List of shot objects from the JSON
        
    Returns:
        list: List of all image descriptions in order
    """
    descriptions = []
    
    # Iterate through each shot
    for shot in shots_data:
        # Get image description from the current shot
        image_desc = shot.get("starting_image_description", "")
        if image_desc:
            descriptions.append(image_desc)
    
    return descriptions


def calculate_shots(video_length_minutes):
    """
    Calculate the number of shots needed for a video of given length.
    
    Args:
        video_length_minutes (float): Length of the video in minutes
        
    Returns:
        int: Number of shots needed (each shot is 5 seconds)
    """
    video_length_seconds = video_length_minutes * 60
    num_shots = math.ceil(video_length_seconds / 5)  # Each shot is 5 seconds
    return num_shots


def generate_story_to_movie(story_text, video_length_minutes, style="anime", output_filename=None):
    """
    Generate movie shots based on a story text and desired video length.
    
    Args:
        story_text (str): The story text to convert to a movie
        video_length_minutes (float): Length of the video in minutes
        style (str): Visual style for the movie (e.g., "anime", "realistic")
        output_filename (str, optional): Custom filename for the output JSON
    """
    # Calculate required number of shots
    num_shots = calculate_shots(video_length_minutes)
    
    print(f"Generating {num_shots} shots for a {video_length_minutes} minute {style}-style video...")
    
    # Initialize the Google Gemini client
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )
    
    model = "gemini-2.5-pro-exp-03-25"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=f"""
Create a {style}-style movie adaptation of this story with {num_shots} shots (5 seconds per shot).
Return a JSON array where each object follows this schema:
{{
  \"scene_number\": [Scene number],
  \"shot_number\": [Shot number within the scene],
  \"camera_view\": \"[Description of the camera view, e.g., 'close-up', 'wide-angle']\",
  \"camera_motion\": \"[One of: 'Static', 'Move Left', 'Move Right', 'Move Up', 'Move Down', 'Push In', 'Pull Out', 'Zoom In', 'Zoom Out', 'Pan Left', 'Pan Right', 'Orbit Left', 'Orbit Right', 'Crane Up', 'Crane Down']\",
  \"characters\": [
    \"[Character's name]\"      
  ],
  \"dialogue\": \"[Dialogue spoken in this shot, if any]\",
  \"action\": \"[Description of the action occurring in this shot]\",
  \"setting\": \"[Description of the environment and visual elements present]\",
  \"starting_image_description\": \"[Detailed description of the starting image to be used for AI generation. Make sure to describe it in {style} style with appropriate visual aesthetics. Include character descriptions here if it differs from the norm.]\"
}}

Dialogues should be short, each shot dialogue should be shorter than 5 seconds when pronounced. 
Organize the shots into logical scenes from the story.
Keep the total number of shots to exactly {num_shots}.
Make sure every shot captures a crucial moment from the story.
Use {style}-specific visual elements in the descriptions (e.g., for anime: expressive eyes, dynamic motion lines, stylized backgrounds).

Here is the story to adapt:

{story_text}
"""),
            ],
        ),
    ]
    
    generate_content_config = types.GenerateContentConfig(
        response_mime_type="application/json",
    )

    # Store the complete response
    complete_response = ""
    
    print(f"\nGenerating {style}-style movie shots from the story. This may take a few minutes...")
    
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        chunk_text = chunk.text
        complete_response += chunk_text
        print(chunk_text, end="", flush=True)
    
    # If no output filename is provided, use the default
    if output_filename is None:
        output_filename = f"shot_output_{int(video_length_minutes)}min_{style}.json"
    
    # Save the response to a JSON file
    with open(output_filename, "w") as json_file:
        json_file.write(complete_response)
    
    print(f"\n\nJSON output has been saved to {output_filename}")
    
    # Parse the JSON data
    try:
        shots_data = json.loads(complete_response)
        
        # Extract and print unique characters
        characters = extract_unique_characters(shots_data)
        print(f"\nUnique characters in the movie ({len(characters)}):")
        for character in characters:
            print(f"- {character}")
        
        # Extract and print image descriptions
        descriptions = extract_image_descriptions(shots_data)
        print(f"\nGenerated {len(descriptions)} image descriptions")
        print(f"First 3 descriptions:")
        for i, desc in enumerate(descriptions[:3], 1):
            print(f"\n{i}. {desc}")
            
        # Save characters and descriptions to separate files
        char_filename = f"characters_{int(video_length_minutes)}min_{style}.json"
        desc_filename = f"image_descriptions_{int(video_length_minutes)}min_{style}.json"
        
        with open(char_filename, "w") as char_file:
            json.dump(characters, char_file, indent=2)
        
        with open(desc_filename, "w") as desc_file:
            json.dump(descriptions, desc_file, indent=2)
            
        print(f"\nCharacter list saved to {char_filename}")
        print(f"Image descriptions saved to {desc_filename}")
        
        # Print statistics
        total_shots = len(shots_data)
        scenes = set(shot.get("scene_number", 0) for shot in shots_data)
        num_scenes = len(scenes)
        
        print(f"\nSummary Statistics:")
        print(f"- Total video length: {video_length_minutes} minutes")
        print(f"- Expected shots: {num_shots}")
        print(f"- Generated shots: {total_shots}")
        print(f"- Number of scenes: {num_scenes}")
        print(f"- Number of unique characters: {len(characters)}")
            
    except json.JSONDecodeError:
        print("\nError: Could not parse JSON response")
    
    return shots_data


def process_existing_json(json_file_path):
    """
    Process an existing JSON file to extract characters and image descriptions.
    
    Args:
        json_file_path (str): Path to the JSON file
    """
    try:
        with open(json_file_path, 'r') as file:
            shots_data = json.load(file)
            
        # Extract file name base for output files
        base_filename = os.path.splitext(json_file_path)[0]
            
        # Extract and print unique characters
        characters = extract_unique_characters(shots_data)
        print(f"\nUnique characters in the movie ({len(characters)}):")
        for character in characters:
            print(f"- {character}")
        
        # Extract and print image descriptions
        descriptions = extract_image_descriptions(shots_data)
        print(f"\nImage descriptions ({len(descriptions)}):")
        for i, desc in enumerate(descriptions[:3], 1):
            print(f"\n{i}. {desc}")
            
        # Save characters and descriptions to separate files
        char_filename = f"{base_filename}_characters.json"
        desc_filename = f"{base_filename}_descriptions.json"
        
        with open(char_filename, "w") as char_file:
            json.dump(characters, char_file, indent=2)
        
        with open(desc_filename, "w") as desc_file:
            json.dump(descriptions, desc_file, indent=2)
            
        print(f"\nCharacter list saved to {char_filename}")
        print(f"Image descriptions saved to {desc_filename}")
        
        # Print statistics
        total_shots = len(shots_data)
        scenes = set(shot.get("scene_number", 0) for shot in shots_data)
        num_scenes = len(scenes)
        
        print(f"\nSummary Statistics:")
        print(f"- Total shots: {total_shots}")
        print(f"- Number of scenes: {num_scenes}")
        print(f"- Number of unique characters: {len(characters)}")
            
    except FileNotFoundError:
        print(f"\nError: File {json_file_path} not found")
    except json.JSONDecodeError:
        print(f"\nError: Could not parse JSON in {json_file_path}")


if __name__ == "__main__":
    # Default settings
    default_story = "Once upon a time, there was a brave knight who set out to slay a dragon threatening the kingdom. After a long journey through dark forests and treacherous mountains, the knight arrived at the dragon's cave. To the knight's surprise, the dragon was not evil but merely misunderstood and lonely. Instead of fighting, they became friends and together protected the kingdom from a real threat - an army of shadow creatures approaching from the north."
    default_length = 1.0  # 1 minute
    default_style = "anime"
    
    print(f"Default settings: {default_length} minute, {default_style} style")
    print(f"Default story: \"{default_story[:50]}...\"")
    
    # Ask if user wants to use defaults
    use_defaults = input("Use default settings? (y/n): ").lower()
    
    if use_defaults == 'y':
        # Use defaults
        generate_story_to_movie(default_story, default_length, default_style)
    else:
        # Check if processing existing JSON or generating new
        option = input("Choose an option:\n1. Generate new shots from story text\n2. Process existing JSON file\nEnter choice (1 or 2): ")
        
        if option == "1":
            # Get the story text
            print("Enter your story text (press Enter twice when done):")
            story_lines = []
            while True:
                line = input()
                if not line and story_lines and not story_lines[-1]:
                    # Double empty line - end of input
                    break
                story_lines.append(line)
            
            story_text = "\n".join(story_lines)
            
            # If no text was entered, use the default
            if not story_text.strip():
                print("No story text entered. Using default story.")
                story_text = default_story
            
            # Get desired video length in minutes
            while True:
                try:
                    length_input = input(f"Enter desired video length in minutes (default: {default_length}): ") or str(default_length)
                    video_length = float(length_input)
                    if video_length > 0:
                        break
                    else:
                        print("Please enter a positive number for video length.")
                except ValueError:
                    print("Please enter a valid number for video length.")
            
            # Get desired style
            style = input(f"Enter desired style (default: {default_style}): ") or default_style
            
            # Generate shots from the story
            generate_story_to_movie(story_text, video_length, style)
            
        elif option == "2":
            # Get the JSON file path
            json_path = input("Enter the path to your JSON file: ")
            process_existing_json(json_path)
            
        else:
            print("Invalid option selected. Please restart and choose option 1 or 2.") 