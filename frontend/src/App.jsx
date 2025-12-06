import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Heart, BookHeart, Shuffle, History, CalendarClock, Sparkles } from 'lucide-react';
import * as DarkReader from 'darkreader';
import DateLibrary from './pages/DateLibrary';
import Randomizer from './pages/Randomizer';
import DateHistory from './pages/DateHistory';
import UpcomingDates from './pages/UpcomingDates';
import AISuggestionModal from './components/AISuggestionModal';
import { UserContext, useUser } from './context/UserContext';
import { ToastProvider } from './context/ToastContext';
import { api } from './utils/api';

function App() {
  const [currentUser, setCurrentUser] = useState('User 1');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadCategories();

    // Initialize dark mode based on system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (prefersDark) {
      DarkReader.enable({
        brightness: 100,
        contrast: 90,
        sepia: 0,
      });
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e) => {
      if (e.matches) {
        DarkReader.enable({
          brightness: 100,
          contrast: 90,
          sepia: 0,
        });
      } else {
        DarkReader.disable();
      }
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleDatesAdded = () => {
    // Trigger a refresh in child components
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      <ToastProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Header
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
              onOpenAI={() => setShowAIModal(true)}
            />
            <main className="flex-1 pb-20 md:pb-8">
              <Routes>
                <Route path="/" element={<DateLibrary key={refreshTrigger} />} />
                <Route path="/randomizer" element={<Randomizer />} />
                <Route path="/upcoming" element={<UpcomingDates />} />
                <Route path="/history" element={<DateHistory />} />
              </Routes>
            </main>
            <BottomNav onOpenAI={() => setShowAIModal(true)} />
          </div>

          {showAIModal && (
            <AISuggestionModal
              categories={categories}
              onClose={() => setShowAIModal(false)}
              onDatesAdded={handleDatesAdded}
            />
          )}
        </Router>
      </ToastProvider>
    </UserContext.Provider>
  );
}

function Header({ mobileMenuOpen, setMobileMenuOpen, onOpenAI }) {
  const { currentUser, setCurrentUser } = useUser();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary-600 fill-primary-600" />
            <h1 className="text-xl font-bold text-gray-900">Date Night</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAI}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary-600 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-primary-700 hover:to-pink-600 transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              AI Suggest
            </button>
            <select
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="User 1">User 1</option>
              <option value="User 2">User 2</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}

function BottomNav({ onOpenAI }) {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: BookHeart, label: 'Library' },
    { path: '/randomizer', icon: Shuffle, label: 'Spin' },
    { path: 'ai', icon: Sparkles, label: 'AI', isAction: true },
    { path: '/upcoming', icon: CalendarClock, label: 'Upcoming' },
    { path: '/history', icon: History, label: 'History' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          if (item.isAction) {
            return (
              <button
                key={item.path}
                onClick={onOpenAI}
                className="flex flex-col items-center justify-center flex-1 h-full transition-colors text-primary-600"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-pink-500 rounded-full flex items-center justify-center -mt-5 shadow-lg">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          }

          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive
                ? 'text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default App;
