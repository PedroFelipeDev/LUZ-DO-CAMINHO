import { JournalEntry } from '../types';

// Mock data generator for 7 days
export const getWeeklyEntries = async (): Promise<JournalEntry[]> => {
    // In a real app, we would fetch from Firestore here.
    // const q = query(collection(db, "journal"), where("uid", "==", uid)); ...

    const entries: JournalEntry[] = [];
    const today = new Date();

    const titles = [
        "Reflexão Diária",
        "Estudo Bíblico",
        "Gratidão",
        "Versículo do Dia",
        "Oração da Manhã",
        "Notas de Sermão",
        "Pensamentos da Noite"
    ];

    const previews = [
        "Hoje refleti sobre a paz que excede todo o entendimento...",
        "Li sobre o Sermão do Monte e como ele se aplica...",
        "Sou grato pela saúde e pela família que Deus me deu...",
        "O Senhor é o meu pastor, nada me faltará (Salmos 23)...",
        "Senhor, guia meus passos neste novo dia que se inicia...",
        "A mensagem de hoje foi sobre perseverança e fé...",
        "Ao final deste dia, entrego minhas preocupações a Ti..."
    ];

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
