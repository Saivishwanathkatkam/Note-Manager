export interface Note {
  id: string;
  content: string;
  createdAt: number;
  color: NoteColor;
  endDate?: string; // ISO Date string
  status: NoteStatus;
}

export type NoteStatus = 'active' | 'pending' | 'done';

export enum NoteColor {
  White = 'bg-white',
  Yellow = 'bg-yellow-50',
  Blue = 'bg-blue-50',
  Green = 'bg-green-50',
  Red = 'bg-red-50',
  Purple = 'bg-purple-50'
}