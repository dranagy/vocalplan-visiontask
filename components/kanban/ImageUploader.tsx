"use client";

import React, { useRef } from "react";
import toast from "react-hot-toast";

interface ImageUploaderProps {
  onAnalysisComplete: (tasks: unknown[]) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
  teamId?: string | null;
}

export default function ImageUploader({
  onAnalysisComplete,
  isProcessing,
  setIsProcessing,
  teamId,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch("/api/analyze-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              base64Image: base64,
              mimeType: file.type,
              teamId: teamId || undefined,
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Analysis failed");
          }

          const data = await res.json();
          toast.success(`Extracted ${data.tasks?.length || 0} tasks from image`);
          onAnalysisComplete(data.tasks || []);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed to analyze image");
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Failed to read file");
      setIsProcessing(false);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="mb-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        capture="environment"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className={`w-full p-4 rounded-2xl border-2 border-dashed transition-all ${
          isProcessing
            ? "border-indigo-300 bg-indigo-50 cursor-wait"
            : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer"
        }`}
      >
        <div className="flex items-center justify-center space-x-3">
          {isProcessing ? (
            <>
              <svg className="animate-spin w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-indigo-600 font-semibold text-sm">Analyzing image...</span>
            </>
          ) : (
            <>
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-slate-500 font-medium text-sm">
                Upload whiteboard or handwritten notes
              </span>
            </>
          )}
        </div>
      </button>
    </div>
  );
}
