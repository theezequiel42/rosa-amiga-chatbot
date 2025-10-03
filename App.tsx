import React, { useCallback, useEffect, useState } from 'react';
import ChatInterface from './components/ChatInterface';
import { HiDotsHorizontal } from 'react-icons/hi';
import { RiFlowerFill } from 'react-icons/ri';

const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleQuickExit = () => {
    // Change favicon and title to something generic
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = 'https://www.google.com/favicon.ico';
    document.title = 'Google';

    // Redirect to a neutral page. `replace` removes the current page from session history.
    window.location.replace('https://www.google.com');
  };

  const closeMobileMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMobileMenu();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen, closeMobileMenu]);

  return (
    <div className="w-full sm:max-w-3xl mx-auto min-h-[100svh] bg-white rounded-2xl max-[359px]:rounded-none shadow-xl flex flex-col">
      <header className="bg-gradient-to-r from-pink-600 to-purple-500 text-white p-4 rounded-t-2xl max-[359px]:rounded-none flex-shrink-0 flex items-center space-x-4">
        <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
          <RiFlowerFill className="h-7 w-7 text-white" aria-hidden="true" />
        </div>
        <div className="flex-grow">
          <h1 className="text-xl font-bold">Rosa Amiga</h1>
          <p className="text-sm opacity-90">Apoio e conscientizacao contra a violencia domestica</p>
        </div>
        <nav className="hidden sm:flex items-center gap-3 mr-2">
          <a href="/help.html" className="text-white/90 hover:text-white text-sm underline-offset-2 hover:underline">Ajuda</a>
          <a href="/privacy.html" className="text-white/90 hover:text-white text-sm underline-offset-2 hover:underline">Privacidade</a>
          <a href="/terms.html" className="text-white/90 hover:text-white text-sm underline-offset-2 hover:underline">Termos</a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="sm:hidden p-2 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Abrir menu de navegacao"
            aria-haspopup="dialog"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav-sheet"
          >
            <HiDotsHorizontal className="h-7 w-7 text-white" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleQuickExit}
            className="p-2 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white shrink-0"
            aria-label="Saida Rapida: fecha o site e abre o Google"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <ChatInterface />

      <footer className="text-center p-3 text-xs text-gray-600 border-t flex-shrink-0 flex items-center justify-center space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
        <p>Este e um espaco seguro. Se voce estiver em perigo imediato, **ligue para 190**.</p>
      </footer>

      {isMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" aria-hidden="true" onClick={closeMobileMenu} />
          <div
            id="mobile-nav-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-nav-title"
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0))] space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 id="mobile-nav-title" className="text-sm font-semibold text-gray-900">
                Menu
              </h2>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="text-sm font-medium text-pink-600 hover:text-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 rounded-lg px-3 py-2"
                autoFocus
              >
                Fechar
              </button>
            </div>
            <nav className="flex flex-col gap-3 text-base font-medium text-pink-600">
              <a
                href="/help.html"
                onClick={closeMobileMenu}
                className="rounded-2xl bg-pink-50 px-4 py-3 text-center shadow-sm hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                Ajuda
              </a>
              <a
                href="/privacy.html"
                onClick={closeMobileMenu}
                className="rounded-2xl bg-pink-50 px-4 py-3 text-center shadow-sm hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                Privacidade
              </a>
              <a
                href="/terms.html"
                onClick={closeMobileMenu}
                className="rounded-2xl bg-pink-50 px-4 py-3 text-center shadow-sm hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                Termos
              </a>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;