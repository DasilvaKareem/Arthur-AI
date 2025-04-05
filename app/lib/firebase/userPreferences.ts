import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './client';

export interface UserPreferences {
  chatColor?: string;
  sidebarCollapsed?: boolean;
  theme?: 'light' | 'dark';
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const prefsDoc = await getDoc(doc(db, 'userPreferences', userId));
    return prefsDoc.exists() ? prefsDoc.data() as UserPreferences : null;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return null;
  }
}

export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<void> {
  try {
    const prefsRef = doc(db, 'userPreferences', userId);
    const prefsDoc = await getDoc(prefsRef);

    if (prefsDoc.exists()) {
      await updateDoc(prefsRef, preferences);
    } else {
      await setDoc(prefsRef, preferences);
    }
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
} 