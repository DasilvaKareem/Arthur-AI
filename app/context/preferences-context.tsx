"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserPreferences, updateUserPreferences, UserPreferences } from '../lib/firebase/userPreferences';
import { toast } from 'sonner';

interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreference: (key: keyof UserPreferences, value: any) => Promise<void>;
  isLoading: boolean;
}

const PreferencesContext = createContext<PreferencesContextType>({
  preferences: {},
  updatePreference: async () => {},
  isLoading: true,
});

export const PreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadPreferences = async () => {
      if (user?.uid) {
        try {
          const userPrefs = await getUserPreferences(user.uid);
          if (userPrefs) {
            setPreferences(userPrefs);
          }
        } catch (error) {
          console.error('Error loading preferences:', error);
          toast.error('Failed to load preferences');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadPreferences();
  }, [user?.uid]);

  const updatePreference = async (key: keyof UserPreferences, value: any) => {
    if (!user?.uid) {
      toast.error('You must be logged in to update preferences');
      return;
    }

    try {
      const updatedPreferences = { ...preferences, [key]: value };
      await updateUserPreferences(user.uid, { [key]: value });
      setPreferences(updatedPreferences);
      toast.success('Preferences updated');
    } catch (error) {
      console.error('Error updating preference:', error);
      toast.error('Failed to update preferences');
    }
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreference, isLoading }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext); 