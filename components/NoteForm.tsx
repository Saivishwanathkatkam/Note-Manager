import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NoteColor } from '../types';
import MiniCalendar from './MiniCalendar';

interface NoteFormProps {
  onAddNote: (content: string, color: NoteColor, endDate?: string) => void;
}

const NoteForm: React.FC<NoteFormProps> = ({ onAddNote }) => {
  const [content, setContent] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedColor, setSelectedColor] = useState<NoteColor>(NoteColor.White);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle outside click to collapse the form if empty, and close calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (content.trim() === '') {
          setIsExpanded(false);
        }
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [content]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleSubmit = useCallback(() => {
    if (content.trim()) {
      onAddNote(content.trim(), selectedColor, endDate || undefined);
      setContent('');
      setEndDate('');
      setSelectedColor(NoteColor.White);
      setIsExpanded(false);
      setShowCalendar(false);
    }
  }, [content, selectedColor, endDate, onAddNote]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  const colorOptions = [
    { value: NoteColor.White, class: 'bg-white border-gray-200' },
    { value: NoteColor.Red, class: 'bg-red-100 border-red-200' },
    { value: NoteColor.Yellow, class: 'bg-yellow-100 border-yellow-200' },
    { value: NoteColor.Green, class: 'bg-green-100 border-green-200' },
    { value: NoteColor.Blue, class: 'bg-blue-100 border-blue-200' },
    { value: NoteColor.Purple, class: 'bg-purple-100 border-purple-200' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4 relative z-10" ref={containerRef}>
      <div 
        className={`
          transition-all duration-300 ease-in-out
          bg-white rounded-xl shadow-lg border border-gray-100 overflow-visible
          ${isExpanded ? 'shadow-xl scale-100' : 'shadow-md hover:shadow-lg'}
        `}
      >
        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onKeyDown={handleKeyDown}
            placeholder={isExpanded ? "What's on your mind?..." : "Take a note..."}
            className={`
              w-full resize-none outline-none text-gray-700 placeholder-gray-400
              ${isExpanded ? 'min-h-[100px] text-lg' : 'min-h-[24px] text-base font-medium'}
              bg-transparent transition-all duration-200
            `}
            rows={1}
          />
        </div>

        {/* Action Bar (Only visible when expanded) */}
        <div 
          className={`
            px-4 py-3 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between border-t border-gray-100
            transition-all duration-300 ease-in-out gap-3 relative
            ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 hidden'}
          `}
        >
          <div className="flex items-center gap-4">
            <div className="flex space-x-2">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedColor(option.value)}
                  className={`
                    w-6 h-6 rounded-full border border-opacity-50 transition-transform hover:scale-110 focus:outline-none
                    ${option.class}
                    ${selectedColor === option.value ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''}
                  `}
                  title="Choose color"
                />
              ))}
            </div>
            
            <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>

            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCalendar(!showCalendar);
                }}
                className={`
                  flex items-center gap-2 text-xs font-medium px-2 py-1.5 rounded-md transition-colors
                  ${endDate 
                    ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
                    : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {endDate ? formatDisplayDate(endDate) : 'Add Task Date'}
              </button>

              {/* Calendar Popup */}
              {showCalendar && (
                <div className="absolute top-full left-0 mt-2 z-50">
                  <MiniCalendar 
                    selectedDate={endDate} 
                    onChange={setEndDate} 
                    onClose={() => setShowCalendar(false)} 
                  />
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className={`
              px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-200
              ${content.trim() 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
            `}
          >
            Add Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteForm;