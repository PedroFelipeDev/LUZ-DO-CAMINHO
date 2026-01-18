import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

interface ToggleFavoriteResponse {
    favorite: boolean;
}

export const toggleFavorite = async (verseRef: string, text: string): Promise<boolean> => {
    const toggleFavoriteFn = httpsCallable<{ verseRef: string; text: string }, ToggleFavoriteResponse>(functions, 'toggleFavorite');
    try {
        const result = await toggleFavoriteFn({ verseRef, text });
        return result.data.favorite;
    } catch (error) {
        console.error("Error toggling favorite:", error);
        throw error;
    }
};
