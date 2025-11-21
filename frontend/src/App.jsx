import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Heart, BookHeart, Shuffle, History, CalendarClock } from 'lucide-react';
import DateLibrary from './pages/DateLibrary';
import Randomizer from './pages/Randomizer';
import DateHistory from './pages/DateHistory';
import UpcomingDates from './pages/UpcomingDates';
import { UserContext, useUser } from './context/UserContext';

function App() {
  const [currentUser, setCurrentUser] = useState('User 1');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Header 
            mobileMenuOpen={mobileMenuOpen} 
            setMobileMenuOpen={setMobileMenuOpen}
          />
          <main className="flex-1 pb-20 md:pb-8">
            <Routes>
              <Route path="/" element={<DateLibrary />} />
              <Route path="/randomizer" element={<Randomizer />} />
              <Route path="/upcoming" element={<UpcomingDates />} />
              <Route path="/history" element={<DateHistory />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </Router>
    </UserContext.Provider>
  );
}

function Header({ mobileMenuOpen, setMobileMenuOpen }) {
  const { currentUser, setCurrentUser } = useUser();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary-600 fill-primary-600" />
            <h1 className="text-xl font-bold text-gray-900">Date Night</h1>
          </div>
          
          <div className="flex items-center gap-4">
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

function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: BookHeart, label: 'Library' },
    { path: '/randomizer', icon: Shuffle, label: 'Spin' },
    { path: '/upcoming', icon: CalendarClock, label: 'Upcoming' },
    { path: '/history', icon: History, label: 'History' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive 
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
