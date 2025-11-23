import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Note, NoteColor, NoteStatus } from './types';
import NoteForm from './components/NoteForm';
import NoteCard from './components/NoteCard';
import AuthForm from './components/AuthForm';

const mongoDbUri = process.env.MONGO_DB_URI || 'http://localhost:5000';
const API_BASE_URL = `${mongoDbUri}/api/notes`;

console.log('Using API Base URL:', process.env.MONGO_DB_URI);

type FilterType = 'general' | 'tasks' | 'pending' | 'done';

// Utility function to generate UUIDs
function generateUUID() {
  if (crypto && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (crypto?.getRandomValues?.(new Uint8Array(1))[0] ?? Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const saveToGoogleCalendar = (note: Note) => {
  if (!note.endDate) return;

  const title = encodeURIComponent(note.content.substring(0, 60));
  const details = encodeURIComponent(note.content);
  
  const [yearStr, monthStr, dayStr] = note.endDate.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const start = `${yearStr}${monthStr}${dayStr}`;

  const dateObj = new Date(year, month - 1, day, 12, 0, 0); 
  dateObj.setDate(dateObj.getDate() + 1);
  
  const nextYear = dateObj.getFullYear();
  const nextMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
  const nextDay = String(dateObj.getDate()).padStart(2, '0');
  
  const end = `${nextYear}${nextMonth}${nextDay}`;

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${start}/${end}`;
  
  window.open(url, '_blank');
};

const App: React.FC = () => {
  // Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem('userEmail'));

  // App State
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(new Set());

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  // Handle Login
  const handleLoginSuccess = (newToken: string, email: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userEmail', email);
    setToken(newToken);
    setUserEmail(email);
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setToken(null);
    setUserEmail(null);
    setNotes([]);
  };

  // Fetch Notes
  useEffect(() => {
    if (!token) return;

    const fetchNotes = async () => {
      try {
        const response = await fetch(API_BASE_URL, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setNotes(data);
        } else if (response.status === 401 || response.status === 403) {
          handleLogout(); // Session expired
        }
      } catch (error) {
        console.error('Error connecting to backend server:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [token]);

  const addNote = useCallback(async (content: string, color: NoteColor, endDate?: string) => {
    if (!token) return;

    const newNote: Note = {
      id: generateUUID(),
      content,
      createdAt: Date.now(),
      color,
      endDate,
      status: 'active'
    };
    
    setNotes((prevNotes) => [newNote, ...prevNotes]);

    try {
      await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newNote),
      });

      if (endDate) {
        saveToGoogleCalendar(newNote);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }, [token]);

  const deleteNote = useCallback(async (id: string) => {
    if (!token) return;
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));

    try {
      await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
      });
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }, [token]);

  const updateStatus = useCallback(async (id: string, status: NoteStatus) => {
    if (!token) return;
    setNotes((prevNotes) => prevNotes.map(note => 
      note.id === id ? { ...note, status } : note
    ));

    try {
      await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }, [token]);

  const toggleFilter = (filter: FilterType) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(filter)) {
        newFilters.delete(filter);
      } else {
        newFilters.add(filter);
      }
      return newFilters;
    });
  };

  const filteredNotes = useMemo(() => {
    if (activeFilters.size === 0) return notes;

    return notes.filter(note => {
      if (activeFilters.has('done') && note.status === 'done') return true;
      if (activeFilters.has('pending') && note.status === 'pending') return true;
      if (note.status === 'active') {
        if (activeFilters.has('tasks') && !!note.endDate) return true;
        if (activeFilters.has('general') && !note.endDate) return true;
      }
      return false;
    });
  }, [notes, activeFilters]);

  const counts = useMemo(() => ({
    general: notes.filter(n => n.status === 'active' && !n.endDate).length,
    tasks: notes.filter(n => n.status === 'active' && !!n.endDate).length,
    pending: notes.filter(n => n.status === 'pending').length,
    done: notes.filter(n => n.status === 'done').length
  }), [notes]);

  const FilterTab = ({ id, label, count, colorClass }: { id: FilterType, label: string, count: number, colorClass: string }) => {
    const isActive = activeFilters.has(id);
    return (
      <button
        onClick={() => toggleFilter(id)}
        className={`
          px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border flex items-center gap-2
          ${isActive 
            ? `${colorClass} text-white shadow-md border-transparent` 
            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}
        `}
      >
        {label}
        <span className={`text-xs py-0.5 px-1.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>
          {count}
        </span>
      </button>
    );
  };

  // If not logged in, show Auth Screen
  if (!token) {
    return <AuthForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 bg-opacity-90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left: Logo */}
          <div className="flex items-center space-x-2 w-1/4">
            <div className="bg-indigo-600 rounded-lg p-1.5 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">
              NoteManager
            </h1>
          </div>

          {/* Center: Date (On larger screens) */}
          <div className="hidden md:flex justify-center w-2/4">
            <div className="text-sm text-gray-500 font-medium bg-gray-100 px-4 py-1.5 rounded-full">
              {formattedDate}
            </div>
          </div>

          {/* Right: Contact & User Controls */}
          <div className="flex items-center justify-end space-x-4 w-1/4">
            <a 
              href="mailto:vishwanath.katkam99@gmail.com"
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
            >
              Contact
            </a>
            
            <div className="h-4 w-px bg-gray-300"></div>
            
            <button 
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Message Mobile */}
        <div className="md:hidden text-center text-gray-500 text-sm mb-6 font-medium">
          {formattedDate}
        </div>

        <NoteForm onAddNote={addNote} />

        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <FilterTab id="general" label="General" count={counts.general} colorClass="bg-blue-600" />
          <FilterTab id="tasks" label="Tasks" count={counts.tasks} colorClass="bg-rose-500" />
          <FilterTab id="pending" label="Pending" count={counts.pending} colorClass="bg-amber-500" />
          <FilterTab id="done" label="Done" count={counts.done} colorClass="bg-emerald-600" />
        </div>
        
        {activeFilters.size === 0 && (
          <div className="text-center text-xs text-gray-400 mb-6 -mt-4 uppercase tracking-wider font-semibold">
            Showing All Notes
          </div>
        )}

        <div className="mt-4">
          {filteredNotes.length === 0 && !loading ? (
            <div className="text-center py-20 opacity-60">
              <div className="mx-auto h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-xl font-medium text-gray-500">No notes found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
              {filteredNotes.map((note) => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  onDelete={deleteNote}
                  onUpdateStatus={updateStatus}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} NoteManager. Developed by KatkamSaiVishwanath
        </div>
      </footer>
    </div>
  );
};

export default App;