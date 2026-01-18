import { supabase } from './supabase';



export const toggleFavorite = async (verseRef: string, text: string): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
        console.warn("User not logged in, cannot toggle favorite");
        return false;
    }

    // Check if exists
    const { data: existing, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('verse_ref', verseRef)
        .maybeSingle();

    if (error) {
        console.error("Error checking favorite:", error);
        throw error;
    }

    if (existing) {
        // Remove
        const { error: deleteError } = await supabase
            .from('favorites')
            .delete()
            .eq('id', existing.id);

        if (deleteError) throw deleteError;
        return false;
    } else {
        // Add
        const { error: insertError } = await supabase
            .from('favorites')
            .insert({
                user_id: session.user.id,
                verse_ref: verseRef,
                text: text
            });

        if (insertError) throw insertError;
        return true;
    }
};

export const checkFavorite = async (verseRef: string): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('verse_ref', verseRef)
        .maybeSingle();

    return !!data;
};

// --- NOTES ---

export interface Note {
    id?: number;
    user_id?: string;
    book_abbrev: string;
    chapter_index: number;
    text: string;
    updated_at?: string;
}

export const saveNote = async (bookAbbrev: string, chapterIndex: number, text: string): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
        console.warn("User not logged in, cannot save note");
        return false;
    }

    const { error } = await supabase
        .from('notes')
        .upsert({
            user_id: session.user.id,
            book_abbrev: bookAbbrev,
            chapter_index: chapterIndex,
            text: text,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,book_abbrev,chapter_index' });

    if (error) {
        console.error("Error saving note:", error);
        throw error;
    }
    return true;
};

export const getNote = async (bookAbbrev: string, chapterIndex: number): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return "";

    const { data } = await supabase
        .from('notes')
        .select('text')
        .eq('user_id', session.user.id)
        .eq('book_abbrev', bookAbbrev)
        .eq('chapter_index', chapterIndex)
        .maybeSingle();

    return data?.text || "";
};

export const getAllNotes = async (): Promise<Note[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error("Error fetching notes:", error);
        return [];
    }
    return data as Note[];
};

// --- CHAT ---

export interface ChatMessage {
    id?: number;
    user_id?: string;
    role: 'user' | 'model';
    text: string;
    created_at?: string;
}

export const saveChatMessage = async (role: 'user' | 'model', text: string): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const { error } = await supabase
        .from('chat_messages')
        .insert({
            user_id: session.user.id,
            role: role,
            text: text
        });

    if (error) {
        console.error("Error saving chat message:", error);
        return false;
    }
    return true;
};

export const getChatHistory = async (): Promise<ChatMessage[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true })
        .limit(50); // Limit to last 50 messages for context window management

    if (error) {
        console.error("Error fetching chat history:", error);
        return [];
    }
    return data as ChatMessage[];
};

// --- STATS ---

export const logReading = async (): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // Log reading for today (ignore duplicate error due to unique constraint)
    await supabase
        .from('reading_logs')
        .insert({ user_id: session.user.id })
        .select()
        .maybeSingle(); // We don't care about result, just fire and forget
};

export interface ProfileStats {
    favoritesCount: number;
    notesCount: number;
    streakDays: number;
}

export const getProfileStats = async (): Promise<ProfileStats> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { favoritesCount: 0, notesCount: 0, streakDays: 0 };

    // Parallel fetch
    const [favRes, noteRes, logRes] = await Promise.all([
        supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id),
        supabase.from('notes').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id),
        supabase.from('reading_logs').select('read_date').eq('user_id', session.user.id).order('read_date', { ascending: false }).limit(30)
    ]);

    // Calculate Streak
    let streak = 0;
    const logs = logRes.data || [];
    if (logs.length > 0) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        // Normalize dates to YYYY-MM-DD strings for comparison
        const toDateString = (d: Date) => d.toISOString().split('T')[0];
        const todayStr = toDateString(today);
        const yesterdayStr = toDateString(yesterday);

        const lastRead = logs[0].read_date; // string YYYY-MM-DD

        if (lastRead === todayStr || lastRead === yesterdayStr) {
            streak = 1;
            // Iterate backwards
            let currentCheck = new Date(lastRead);
            for (let i = 1; i < logs.length; i++) {
                currentCheck.setDate(currentCheck.getDate() - 1);
                const checkStr = toDateString(currentCheck);
                if (logs[i].read_date === checkStr) {
                    streak++;
                } else {
                    break;
                }
            }
        }
    }

    return {
        favoritesCount: favRes.count || 0,
        notesCount: noteRes.count || 0,
        streakDays: streak
    };
};
