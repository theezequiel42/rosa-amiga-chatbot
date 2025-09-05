import React from 'react';
import ChatInterface from './components/ChatInterface';
import { RiFlowerFill } from 'react-icons/ri';

const App: React.FC = () => {
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

  return (
    <div className="w-full max-w-3xl mx-auto h-[95vh] bg-white rounded-2xl shadow-xl flex flex-col">
      <header className="bg-gradient-to-r from-pink-600 to-purple-500 text-white p-4 rounded-t-2xl flex-shrink-0 flex items-center space-x-4">
        <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
          <RiFlowerFill className="h-7 w-7 text-white" aria-hidden="true" />
        </div>
        <div className="flex-grow">
          <h1 className="text-xl font-bold">Rosa Amiga</h1>
          <p className="text-sm opacity-90">Apoio e conscientização contra a violência doméstica</p>
        </div>
        <nav className="hidden sm:flex items-center gap-3 mr-2">
          <a href="/help.html" className="text-white/90 hover:text-white text-sm underline-offset-2 hover:underline">Ajuda</a>
          <a href="/privacy.html" className="text-white/90 hover:text-white text-sm underline-offset-2 hover:underline">Privacidade</a>
          <a href="/terms.html" className="text-white/90 hover:text-white text-sm underline-offset-2 hover:underline">Termos</a>
        </nav>
        <button
          onClick={handleQuickExit}
          className="p-2 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Saída Rápida: fecha o site e abre o Google"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </header>
      <ChatInterface />
      <footer className="text-center p-3 text-xs text-gray-600 border-t flex-shrink-0 flex items-center justify-center space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
        <p>Este é um espaço seguro. Se você estiver em perigo imediato, **ligue para 190**.</p>
      </footer>
    </div>
  );
};

export default App;

