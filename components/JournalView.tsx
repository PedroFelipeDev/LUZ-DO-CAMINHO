import React, { useEffect, useState } from 'react';
import { JournalEntry } from '../types';
import { getWeeklyEntries } from '../services/journalService';
import { Tab } from '../types';

interface LocalNote {
  key: string;
  chapterKey: string;
  bookAbbrev: string;
  chapterIndex: number;
  text: string;
  date: number; // created at
}

interface JournalViewProps {
  onNavigate?: (tab: Tab) => void;
}

const JournalView: React.FC<JournalViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'DEVOTIONAL' | 'NOTES'>('DEVOTIONAL');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [localNotes, setLocalNotes] = useState<LocalNote[]>([]);

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const data = await getWeeklyEntries();
        setEntries(data);
      } catch (error) {
        console.error("Failed to load journal entries", error);
      } finally {
        setLoading(false);
      }
    };

    const loadNotes = () => {
      const notes: LocalNote[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('note-')) {
          const text = localStorage.getItem(key) || "";
          if (text.trim()) {
            const chapterKey = key.replace('note-', '');
            const [bookAbbrev, chapterIdxStr] = chapterKey.split('-');
            notes.push({
              key,
              chapterKey,
              bookAbbrev: bookAbbrev.toUpperCase(),
              chapterIndex: parseInt(chapterIdxStr, 10),
              text,
              date: Date.now() // formatting date is optional/mock as local storage doesn't store metadata in this simple version
            });
          }
        }
      }
      setLocalNotes(notes);
    };

    if (activeTab === 'DEVOTIONAL') {
      loadEntries();
    } else {
      loadNotes();
    }
  }, [activeTab]);

  const handleNoteClick = (note: LocalNote) => {
    localStorage.setItem('pending_nav_chapter', note.chapterKey);
    if (onNavigate) {
      onNavigate(Tab.READING);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      {/* Top App Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center px-4 h-16 justify-between max-w-2xl mx-auto w-full">
          <button className="w-10 h-10 flex items-center justify-start text-gray-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">menu</span>
          </button>

          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('DEVOTIONAL')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'DEVOTIONAL' ? 'bg-white dark:bg-[#1e1e1e] text-[#1c1a0d] dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Devocional
            </button>
            <button
              onClick={() => setActiveTab('NOTES')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'NOTES' ? 'bg-white dark:bg-[#1e1e1e] text-[#1c1a0d] dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Minhas Notas
            </button>
          </div>

          <div className="flex w-10 items-center justify-end">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm text-gray-500">search</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-20 pb-32 max-w-2xl mx-auto px-4 w-full overflow-y-auto">

        {activeTab === 'DEVOTIONAL' && (
          <>
            <h3 className="text-[#1c1a0d] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pt-4 pb-2">Esta Semana</h3>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              entries.map(entry => (
                <div key={entry.id} className="my-3 relative bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                  <div className="p-4 pl-6 flex items-stretch justify-between gap-4">
                    <div className="flex flex-col gap-1 flex-[2_2_0px]">
                      <p className="text-primary text-xs font-bold uppercase tracking-wider">{entry.dateDay} {entry.dateMonth}</p>
                      <p className="text-[#1c1a0d] dark:text-white text-base font-bold leading-tight">{entry.title}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-relaxed line-clamp-2">{entry.preview}</p>
                    </div>
                    {entry.imageUrl && (
                      <div
                        className="w-20 h-20 bg-center bg-no-repeat bg-cover rounded-lg flex-shrink-0"
                        style={{ backgroundImage: `url("${entry.imageUrl}")` }}
                      ></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'NOTES' && (
          <div className="space-y-4 pt-4">
            {localNotes.length === 0 ? (
              <div className="text-center py-10">
                <div className="bg-gray-100 dark:bg-white/5 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-gray-400 text-3xl">note_add</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400">Você ainda não tem anotações.</p>
                <p className="text-xs text-gray-400 mt-1">Navegue pelos capítulos e clique em "Anotar" para começar.</p>
              </div>
            ) : (
              localNotes.map(note => (
                <div
                  key={note.key}
                  onClick={() => handleNoteClick(note)}
                  className="bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-[#1c1a0d] dark:text-white text-lg">
                      {note.bookAbbrev} {note.chapterIndex + 1}
                    </h4>
                    <span className="material-symbols-outlined text-gray-400 text-sm">arrow_forward</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 italic">
                    "{note.text}"
                  </p>
                </div>
              ))
            )}
          </div>
        )}

      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <button className="bg-primary text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform hover:bg-[#d9ba0b]">
          <span className="material-symbols-outlined text-3xl font-bold">add</span>
        </button>
      </div>
    </div>
  );
};

export default JournalView;
