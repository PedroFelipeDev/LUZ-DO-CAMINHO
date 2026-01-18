import { db } from './firebase'; // Assuming firebase holds user state if needed, but we fetch json here

export interface BibleChapter {
    [key: number]: string; // Array of strings really, based on json structure [[v1, v2], ...]
}

export interface BibleBook {
    abbrev: string;
    chapters: string[][];
    name?: string; // We will inject this
}

export const BOOK_NAMES: { [key: string]: string } = {
    "gn": "Gênesis",
    "ex": "Êxodo",
    "lv": "Levítico",
    "nm": "Números",
    "dt": "Deuteronômio",
    "js": "Josué",
    "jz": "Juízes",
    "rt": "Rute",
    "1sm": "1 Samuel",
    "2sm": "2 Samuel",
    "1rs": "1 Reis",
    "2rs": "2 Reis",
    "1cr": "1 Crônicas",
    "2cr": "2 Crônicas",
    "ed": "Esdras",
    "ne": "Neemias",
    "et": "Ester",
    "job": "Jó",
    "sl": "Salmos",
    "pv": "Provérbios",
    "ec": "Eclesiastes",
    "ct": "Cânticos",
    "is": "Isaías",
    "jr": "Jeremias",
    "lm": "Lamentações",
    "ez": "Ezequiel",
    "dn": "Daniel",
    "os": "Oséias",
    "jl": "Joel",
    "am": "Amós",
    "ob": "Obadias",
    "jn": "Jonas",
    "mq": "Miquéias",
    "na": "Naum",
    "hc": "Habacuque",
    "sf": "Sofonias",
    "ag": "Ageu",
    "zc": "Zacarias",
    "ml": "Malaquias",
    "mt": "Mateus",
    "mc": "Marcos",
    "lc": "Lucas",
    "jo": "João",
    "at": "Atos",
    "rm": "Romanos",
    "1co": "1 Coríntios",
    "2co": "2 Coríntios",
    "gl": "Gálatas",
    "ef": "Efésios",
    "fp": "Filipenses",
    "cl": "Colossenses",
    "1ts": "1 Tessalonicenses",
    "2ts": "2 Tessalonicenses",
    "1tm": "1 Timóteo",
    "2tm": "2 Timóteo",
    "tt": "Tito",
    "fm": "Filemom",
    "hb": "Hebreus",
    "tg": "Tiago",
    "1pe": "1 Pedro",
    "2pe": "2 Pedro",
    "1jo": "1 João",
    "2jo": "2 João",
    "3jo": "3 João",
    "jd": "Judas",
    "ap": "Apocalipse"
};

let cachedBible: BibleBook[] | null = null;

export const getBible = async (): Promise<BibleBook[]> => {
    if (cachedBible) return cachedBible;

    try {
        const response = await fetch('/bible.json');
        if (!response.ok) {
            throw new Error('Failed to load Bible data');
        }
        const data = await response.json();

        // Inject names
        cachedBible = data.map((book: any) => ({
            ...book,
            name: BOOK_NAMES[book.abbrev] || book.abbrev
        }));

        return cachedBible!;
    } catch (error) {
        console.error("Error loading Bible:", error);
        throw error;
    }
};

export const getBook = async (abbrev: string): Promise<BibleBook | undefined> => {
    const bible = await getBible();
    return bible.find(b => b.abbrev === abbrev);
};
