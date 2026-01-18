import React, { useEffect, useState } from 'react';
import { JournalEntry } from '../types';
import { getWeeklyEntries } from '../services/journalService';

const JournalView: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
    loadEntries();
  }, []);

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      {/* Top App Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center p-4 justify-between max-w-2xl mx-auto w-full">
          <button className="w-12 h-12 flex items-center justify-start text-gray-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h2 className="text-[#1c1a0d] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Diário</h2>
          <div className="flex w-12 items-center justify-end">
            <button className="flex items-center justify-center rounded-lg h-12 bg-transparent text-[#1c1a0d] dark:text-white hover:text-primary transition-colors">
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-20 pb-32 max-w-2xl mx-auto px-4 w-full overflow-y-auto">
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
