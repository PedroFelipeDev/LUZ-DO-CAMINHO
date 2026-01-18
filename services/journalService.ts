import { JournalEntry } from '../types';
import { supabase } from './supabase';

const FALLBACK_ENTRIES: JournalEntry[] = [
    {
        id: '1',
        dateDay: '18',
        dateMonth: 'JAN',
        title: 'A Paz que Excede',
        preview: 'Em tempos de ansiedade, a paz de Deus guarda nossos corações e mentes em Cristo Jesus.',
        imageUrl: 'https://images.unsplash.com/photo-1510936111840-65e151ad71bb?q=80&w=2690&auto=format&fit=crop'
    },
    {
        id: '2',
        dateDay: '17',
        dateMonth: 'JAN',
        title: 'Força na Fraqueza',
        preview: 'Quando nos sentimos fracos, é então que somos fortes, pois o poder de Deus se aperfeiçoa na fraqueza.',
        imageUrl: 'https://images.unsplash.com/photo-1475113548554-5a36f1f523d6?q=80&w=2564&auto=format&fit=crop'
    }
];

export const getWeeklyEntries = async (): Promise<JournalEntry[]> => {

    // Generate entries for the last 7 days (including today)
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        // Format date for display
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');

        entries.push({
            id: `entry-${i}`,
            dateDay: day,
            dateMonth: month,
            title: titles[i % titles.length],
            preview: previews[i % previews.length],
            // Add random image to some entries for variety
            imageUrl: i % 3 === 0 ? `https://source.unsplash.com/random/200x200?bible,church&sig=${i}` : undefined
        });
    }

    return entries;
};
