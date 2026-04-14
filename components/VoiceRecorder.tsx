"use client";

import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import { EisenhowerMatrixData } from "../types";
import { AIProvider } from "./PlannerApp";

interface VoiceRecorderProps {
  onRecordingComplete: (data: EisenhowerMatrixData, audioData: string, duration: string) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
  provider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
}

const MAX_RECORDING_SECONDS: Record<AIProvider, number> = {
  gemini: 300,
  glm: 30,
};

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  isProcessing,
  setIsProcessing,
  provider,
  onProviderChange,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const maxSeconds = MAX_RECORDING_SECONDS[provider];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const finalDuration = formatTime(recordingTime);
        await processAudio(audioBlob, finalDuration);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          if (prev + 1 >= maxSeconds) {
            stopRecording();
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast.error("Please allow microphone access to record voice notes.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processAudio = async (blob: Blob, duration: string) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const fullDataUrl = reader.result as string;
        const base64Audio = fullDataUrl.split(",")[1];

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64Audio,
            mimeType: "audio/webm",
            provider,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Analysis failed");
        }

        const matrixData: EisenhowerMatrixData = await res.json();
        onRecordingComplete(matrixData, fullDataUrl, duration);
        toast.success("Voice note analyzed!");
        setIsProcessing(false);
      };
    } catch (err) {
      console.error("Error processing audio:", err);
      toast.error("Failed to process audio. Please try again.");
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center space-y-4 py-8 bg-white border rounded-3xl shadow-sm mb-8">
      {/* Provider toggle */}
      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-full">
        <button
          onClick={() => { if (!isRecording && !isProcessing) onProviderChange("gemini"); }}
          className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            provider === "gemini"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Gemini
        </button>
        <button
          onClick={() => { if (!isRecording && !isProcessing) onProviderChange("glm"); }}
          className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            provider === "glm"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          GLM
        </button>
      </div>

      {provider === "glm" && (
        <p className="text-xs text-amber-600 font-medium">GLM mode: max 30 seconds</p>
      )}

      <div className="flex items-center space-x-6">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 animate-pulse scale-110 shadow-xl"
              : "bg-indigo-600 hover:bg-indigo-700 shadow-lg"
          } ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {isRecording ? (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
          {isRecording && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full animate-ping"></div>
          )}
        </button>

        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
            {isRecording ? "Recording..." : isProcessing ? "AI Processing..." : "Quick Record"}
          </span>
          <span className="text-3xl font-black text-slate-800 tabular-nums">
            {isRecording ? formatTime(recordingTime) : isProcessing ? "Analyzing" : "0:00"}
          </span>
        </div>
      </div>

      {isProcessing && (
        <div className="flex space-x-2">
          <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
