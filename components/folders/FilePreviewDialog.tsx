"use client";

import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import Image from "next/image";

interface FilePreviewDialogProps {
  file: any;
  files: any[];
  isOpen: boolean;
  onClose: () => void;
}

export function FilePreviewDialog({ file, files, isOpen, onClose }: FilePreviewDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const index = files.findIndex(f => f.id === file?.id);
    setCurrentIndex(index !== -1 ? index : 0);
  }, [file, files]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, files]);

  if (!isOpen || !file) return null;

  const currentFile = files[currentIndex] || file;
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < files.length - 1;

  const handlePrevious = () => {
    if (canGoPrevious) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDownload = async () => {
    const res = await fetch(`/api/files/${currentFile.id}/download`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentFile.originalName;
    a.click();
  };

  const renderPreview = () => {
    if (currentFile.type.startsWith("image/")) {
      return (
        <div className="relative w-full h-full flex items-center justify-center p-8">
          <img
            src={currentFile.url}
            alt={currentFile.originalName}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      );
    } else if (currentFile.type === "application/pdf") {
      return (
        <div className="w-full h-full flex items-center justify-center p-8">
          <iframe
            src={currentFile.url}
            className="w-full h-full rounded-lg bg-white"
            title={currentFile.originalName}
          />
        </div>
      );
    } else {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-white">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold mb-2">{currentFile.originalName}</h3>
          <p className="text-gray-300 mb-6">Preview not available for this file type</p>
          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 flex items-center gap-2"
          >
            <Download size={20} />
            Download to view
          </button>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full text-white z-10"
      >
        <X size={24} />
      </button>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="absolute top-4 right-16 p-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full text-white z-10"
      >
        <Download size={24} />
      </button>

      {/* File info */}
      <div className="absolute top-4 left-4 text-white z-10">
        <h3 className="font-semibold text-lg">{currentFile.originalName}</h3>
        <p className="text-sm text-gray-300">
          {currentIndex + 1} of {files.length}
        </p>
      </div>

      {/* Previous button */}
      {canGoPrevious && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full text-white z-10"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* Next button */}
      {canGoNext && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full text-white z-10"
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* Preview content */}
      <div className="w-full h-full" onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}>
        {renderPreview()}
      </div>
    </div>
  );
}
