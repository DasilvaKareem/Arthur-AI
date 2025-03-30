import React from 'react';

const GeminiResponseExample: React.FC = () => {
  const exampleResponse = [
    {
      "scene_number": 1,
      "shot_number": 1,
      "camera_view": "medium shot",
      "camera_motion": "Push In",
      "characters": [
        "Lyra",
        "Elara"
      ],
      "dialogue": "Elara: \"Look closely, my little Moonbeam. The Lunar Lily only blooms under the light of the twin moons.\"",
      "action": "Elara gently gestures towards a luminous silver flower. Young Lyra, with large curious eyes, kneels beside her, looking fascinated.",
      "setting": "A magical garden in the Umbra Forest at night, illuminated by two large, glowing moons. Strange, colorful plants pulse with soft light around them.",
      "starting_image_description": "Anime style. Elara, a graceful woman with long, flowing dark hair and kind eyes, smiles warmly at Lyra, a young girl with bright, inquisitive blue eyes and messy brown hair. They are kneeling in a fantastical garden bathed in ethereal moonlight from two moons. A stunning Lunar Lily with shimmering silver petals glows intensely between them."
    }
  ];

  return (
    <div className="p-4 rounded-lg border border-gray-200 bg-white">
      <h2 className="text-lg font-bold mb-4">Gemini Response Structure</h2>
      <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
        {JSON.stringify(exampleResponse, null, 2)}
      </pre>
      
      <div className="mt-6">
        <h3 className="font-semibold text-md mb-2">Fields Explanation:</h3>
        <ul className="space-y-2 text-sm">
          <li><strong>scene_number</strong>: The sequential scene number</li>
          <li><strong>shot_number</strong>: The shot number within the scene</li>
          <li><strong>camera_view</strong>: Description of the camera view (close-up, medium shot, etc.)</li>
          <li><strong>camera_motion</strong>: How the camera moves during the shot</li>
          <li><strong>characters</strong>: List of characters present in the shot</li>
          <li><strong>dialogue</strong>: Any dialogue spoken during the shot</li>
          <li><strong>action</strong>: Description of what happens in the shot</li>
          <li><strong>setting</strong>: Description of the environment/location</li>
          <li><strong>starting_image_description</strong>: Detailed description for image generation</li>
        </ul>
      </div>
    </div>
  );
};

export default GeminiResponseExample; 