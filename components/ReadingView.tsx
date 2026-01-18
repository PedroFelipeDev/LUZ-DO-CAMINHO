import React, { useState, useEffect } from 'react';
import { toggleFavorite } from '../services/api';
import { getBible, BibleBook } from '../services/bibleService';

const ReadingView: React.FC = () => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bible, setBible] = useState<BibleBook[]>([]);
  const [currentBook, setCurrentBook] = useState<BibleBook | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const loadBible = async () => {
      try {
        const data = await getBible();
        setBible(data);
        if (data.length > 0) {
          // Default to Genesis (first book)
          setCurrentBook(data[0]);
          setCurrentChapterIndex(0);
        }
      } catch (error) {
        console.error("Failed to load Bible", error);
      }
    };
    loadBible();
  }, []);

  const handleFavorite = async () => {
    if (!currentBook) return;
    setIsLoading(true);
    try {
      const chapterNum = currentChapterIndex + 1;
      const bookName = currentBook.name || currentBook.abbrev;
      const ref = `${bookName} ${chapterNum}`;
      const preview = currentBook.chapters[currentChapterIndex][0].substring(0, 50) + "...";

      const newState = await toggleFavorite(ref, preview);
      setIsFavorite(newState);
    } catch (error) {
      console.error("Failed to toggle favorite", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookChange = (book: BibleBook) => {
    setCurrentBook(book);
    setCurrentChapterIndex(0);
    setIsMenuOpen(false);
    setIsFavorite(false); // Reset favorite state for new chapter context
  };

  const handleChapterChange = (index: number) => {
    setCurrentChapterIndex(index);
    setIsFavorite(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!currentBook) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Carregando Escrituras...
      </div>
    );
  }

  const verses = currentBook.chapters[currentChapterIndex];
  const bookName = currentBook.name || currentBook.abbrev;

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-white/10">
        <div className="flex items-center justify-between px-4 h-16 max-w-2xl mx-auto w-full relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-1 text-[#1c1a0d] dark:text-[#fcfbf8] font-bold text-lg hover:opacity-70 transition-opacity"
          >
            {bookName} {currentChapterIndex + 1}
            <span className={`material-symbols-outlined text-primary text-2xl transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}>expand_more</span>
          </button>

          {/* Quick Nav Dropdown */}
          {isMenuOpen && (
            <div className="absolute top-16 left-0 w-full max-h-[70vh] overflow-y-auto bg-white dark:bg-[#1e1e1e] shadow-xl rounded-b-2xl border-t border-gray-100 dark:border-gray-800 p-4 z-50">
              <div className="grid grid-cols-2 gap-2 mb-4">
                <h3 className="col-span-2 font-bold text-sm text-gray-500 mb-2">Livros</h3>
                {bible.map((book) => (
                  <button
                    key={book.abbrev}
                    onClick={() => handleBookChange(book)}
                    className={`text-left p-2 rounded text-sm ${currentBook.abbrev === book.abbrev ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
                  >
                    {book.name || book.abbrev}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors">
              <span className="material-symbols-outlined">text_fields</span>
            </button>
            <button className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors">
              <span className="material-symbols-outlined">bookmark</span>
            </button>
          </div>
        </div>
      </header>

      {/* Chapter Navigation Scroller */}
      <div className="bg-background-light dark:bg-background-dark border-b border-gray-100 dark:border-white/5 py-2 overflow-x-auto">
        <div className="flex px-4 gap-2 max-w-2xl mx-auto container-snap">
          {currentBook.chapters.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleChapterChange(idx)}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${currentChapterIndex === idx
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 pb-32 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* Headline Section */}
          <div className="px-6 pt-10 pb-4">
            <h1 className="font-serif text-3xl font-bold text-[#1c1a0d] dark:text-[#fcfbf8] leading-tight">
              {bookName} {currentChapterIndex + 1}
            </h1>
            <div className="h-1 w-12 bg-primary mt-4 rounded-full"></div>
          </div>

          {/* Scripture Content */}
          <article className="px-6 py-4 font-serif text-xl leading-relaxed space-y-4 text-justify text-[#1c1a0d] dark:text-[#e0e0e0]">
            {verses.map((verse, index) => (
              <p key={index}>
                <sup className="text-xs text-primary font-bold mr-1">{index + 1}</sup>
                {index === 0 && <span className="float-left text-5xl font-bold text-primary mr-2 mt-[-8px] leading-none">{verse.charAt(0)}</span>}
                {index === 0 ? verse.substring(1) : verse}
              </p>
            ))}
          </article>

          {/* Quick Actions Bar */}
          <div className="px-6 py-8">
            <div className="flex items-center justify-around bg-primary/10 dark:bg-primary/5 rounded-2xl p-4">
              <button className="flex flex-col items-center gap-1 group">
                <div className="bg-white dark:bg-[#332e18] p-3 rounded-full shadow-sm group-active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-[#1c1a0d] dark:text-[#fcfbf8]">share</span>
                </div>
                <span className="text-xs font-medium text-[#1c1a0d] dark:text-[#fcfbf8]">Compartilhar</span>
              </button>
              <button className="flex flex-col items-center gap-1 group">
                <div className="bg-white dark:bg-[#332e18] p-3 rounded-full shadow-sm group-active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-[#1c1a0d] dark:text-[#fcfbf8]">edit_note</span>
                </div>
                <span className="text-xs font-medium text-[#1c1a0d] dark:text-[#fcfbf8]">Anotar</span>
              </button>
              <button
                onClick={handleFavorite}
                disabled={isLoading}
                className={`flex flex-col items-center gap-1 group ${isLoading ? 'opacity-50' : ''}`}
              >
                <div className="bg-white dark:bg-[#332e18] p-3 rounded-full shadow-sm group-active:scale-95 transition-all">
                  <span className={`material-symbols-outlined ${isFavorite ? 'text-primary filled-icon' : 'text-[#1c1a0d] dark:text-[#fcfbf8]'}`}>
                    star
                  </span>
                </div>
                <span className="text-xs font-medium text-[#1c1a0d] dark:text-[#fcfbf8]">
                  {isFavorite ? 'Favorito' : 'Favoritar'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReadingView;
