"use client";

import React from 'react';
import { VoiceNote } from '../types';

interface VoiceNoteListProps {
  voiceNotes: VoiceNote[];
  onDeleteNote: (id: string) => void;
}

const VoiceNoteList: React.FC<VoiceNoteListProps> = ({ voiceNotes, onDeleteNote }) => {
  if (voiceNotes.length === 0) return null;

  return (
    <div className="space-y-4 mb-10 px-4">
      <div className="flex items-center space-x-2 mb-4">
        <h3 className="text-lg font-bold text-slate-800">Voice Transcripts</h3>
        <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">
          {voiceNotes.length}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {voiceNotes.map((note) => (
          <div key={note.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm group hover:border-indigo-200 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{note.timestamp}</span>
                <span className="text-xs font-medium text-indigo-500">{note.duration}</span>
              </div>
              <button 
                onClick={() => onDeleteNote(note.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <audio 
              src={note.audioData} 
              controls 
              className="w-full h-10 rounded-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoiceNoteList;
