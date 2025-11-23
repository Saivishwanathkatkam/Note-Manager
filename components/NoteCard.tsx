import React from 'react';
import { Note, NoteColor, NoteStatus } from '../types';

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: NoteStatus) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete, onUpdateStatus }) => {
  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(timestamp));
  };

  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Map enum colors to Tailwind classes
  const borderColorMap: Record<NoteColor, string> = {
    [NoteColor.White]: 'border-gray-200',
    [NoteColor.Yellow]: 'border-yellow-200',
    [NoteColor.Blue]: 'border-blue-200',
    [NoteColor.Green]: 'border-green-200',
    [NoteColor.Red]: 'border-red-200',
    [NoteColor.Purple]: 'border-purple-200',
  };

  const isDone = note.status === 'done';
  const isPending = note.status === 'pending';

  return (
    <div 
      className={`
        group relative flex flex-col justify-between
        ${note.color} ${borderColorMap[note.color]}
        border rounded-xl shadow-sm hover:shadow-md
        transition-all duration-300 ease-out hover:-translate-y-1
        p-5 min-h-[180px] break-words
        ${isDone ? 'opacity-75 grayscale-[0.5]' : ''}
      `}
    >
      <div>
        {note.endDate && (
          <div className="mb-3 flex items-center">
            <div className={`
              text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1
              ${isDone ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700'}
            `}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDeadline(note.endDate)}</span>
            </div>
          </div>
        )}
        
        <div className={`
          whitespace-pre-wrap text-gray-800 text-base leading-relaxed font-normal
          ${isDone ? 'line-through text-gray-500' : ''}
        `}>
          {note.content}
        </div>
      </div>
      
      <div className="mt-4 pt-3 flex items-end justify-between border-t border-black/5">
        <span className="text-xs font-medium text-gray-400 select-none mb-1">
          {formatDate(note.createdAt)}
        </span>
        
        <div className="flex items-center space-x-1">
          {/* Pending Button */}
          {!isDone && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(note.id, isPending ? 'active' : 'pending');
              }}
              className={`
                p-1.5 rounded-full transition-colors duration-200
                ${isPending 
                  ? 'bg-amber-100 text-amber-600' 
                  : 'text-gray-400 hover:bg-amber-100 hover:text-amber-600'}
              `}
              title={isPending ? "Mark as Active" : "Mark as Pending"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}

          {/* Done Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus(note.id, isDone ? 'active' : 'done');
            }}
            className={`
              p-1.5 rounded-full transition-colors duration-200
              ${isDone 
                ? 'bg-green-100 text-green-600' 
                : 'text-gray-400 hover:bg-green-100 hover:text-green-600'}
            `}
            title={isDone ? "Restore" : "Mark as Done"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            className="
              p-1.5 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600
              transition-colors duration-200
            "
            title="Delete Note"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;