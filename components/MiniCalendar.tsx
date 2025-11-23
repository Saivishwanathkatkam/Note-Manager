import React, { useState, useEffect } from 'react';

interface MiniCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  onClose: () => void;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ selectedDate, onChange, onClose }) => {
  // Initialize with selected date or current date
  const [currentDate, setCurrentDate] = useState(() => {
    return selectedDate ? new Date(selectedDate) : new Date();
  });

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    // Format: YYYY-MM-DD
    // Adjust month to be 1-based and pad with zero
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    onChange(`${year}-${m}-${d}`);
    onClose();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const [sYear, sMonth, sDay] = selectedDate.split('-').map(Number);
    return day === sDay && month === (sMonth - 1) && year === sYear;
  };

  // Generate calendar grid
  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const selected = isSelected(day);
      const today = isToday(day);
      
      days.push(
        <button
          key={day}
          onClick={(e) => {
            e.stopPropagation();
            handleDateClick(day);
          }}
          className={`
            h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
            ${selected 
              ? 'bg-indigo-600 text-white shadow-md' 
              : today 
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' 
                : 'text-gray-700 hover:bg-gray-100'}
          `}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72 select-none"
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
    >
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={(e) => { e.stopPropagation(); handlePrevMonth(); }}
          className="p-1 hover:bg-gray-100 rounded-full text-gray-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <span className="font-semibold text-gray-800">
          {monthNames[month]} {year}
        </span>
        <button 
          onClick={(e) => { e.stopPropagation(); handleNextMonth(); }}
          className="p-1 hover:bg-gray-100 rounded-full text-gray-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="h-8 w-8 flex items-center justify-center text-xs text-gray-400 font-medium">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>

      {selectedDate && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              onClose();
            }}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Clear Date
          </button>
        </div>
      )}
    </div>
  );
};

export default MiniCalendar;