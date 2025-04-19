import React from 'react';

interface VoiceSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const VoiceSelect: React.FC<VoiceSelectProps> = ({ value, onChange }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2 border rounded-md bg-background/50 text-foreground text-sm"
    >
      <option value="SAz9YHcvj6GT2YYXdXww">River (American, Confident)</option>
      <option value="TX3LPaxmHKxFdv7VOQHJ">Liam (American, Articulate)</option>
      <option value="XB0fDUnXU5powFXDhCwa">Charlotte (Swedish, Seductive)</option>
      <option value="Xb7hH8MSUJpSbSDYk0k2">Alice (British, Confident)</option>
      <option value="XrExE9yKIg1WjnnlVkGX">Matilda (American, Friendly)</option>
      <option value="bIHbv24MWmeRgasZH58o">Will (American, Friendly)</option>
      <option value="cgSgspJ2msm6clMCkdW9">Jessica (American, Expressive)</option>
      <option value="cjVigY5qzO86Huf0OWal">Eric (American, Friendly)</option>
      <option value="iP95p4xoKVk53GoZ742B">Chris (American, Casual)</option>
      <option value="nPczCjzI2devNBz1zQrb">Brian (American, Deep)</option>
      <option value="onwK4e9ZLuTAKqWW03F9">Daniel (British, Authoritative)</option>
      <option value="pFZP5JQG7iQjIQuC4Bku">Lily (British, Warm)</option>
      <option value="pqHfZKP75CvOlQylNhV4">Bill (American, Trustworthy)</option>
    </select>
  );
}; 