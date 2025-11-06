"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface UploadProgress {
  fileName: string;
  status: "preparing" | "uploading" | "saving" | "complete" | "error";
  progress: number;
  error?: string;
}

export function FileUpload({ folderId }: { folderId: string }) {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      const fileName = file.name;
      
      setUploadProgress((prev) => [
        ...prev,
        { fileName, status: "preparing", progress: 0 },
      ]);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderId", folderId);

      setUploadProgress((prev) =>
        prev.map((p) =>
          p.fileName === fileName ? { ...p, status: "uploading", progress: 30 } : p
        )
      );

      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to upload file");
      }

      setUploadProgress((prev) =>
        prev.map((p) =>
          p.fileName === fileName ? { ...p, status: "saving", progress: 80 } : p
        )
      );

      const result = await res.json();

      setUploadProgress((prev) =>
        prev.map((p) =>
          p.fileName === fileName ? { ...p, status: "complete", progress: 100 } : p
        )
      );

      setTimeout(() => {
        setUploadProgress((prev) =>
          prev.filter((p) => p.fileName !== fileName)
        );
      }, 3000);

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", folderId] });
    },
    onError: (error: Error, file: File) => {
      setUploadProgress((prev) =>
        prev.map((p) =>
          p.fileName === file.name
            ? { ...p, status: "error", error: error.message }
            : p
        )
      );
      setTimeout(() => {
        setUploadProgress((prev) =>
          prev.filter((p) => p.fileName !== file.name)
        );
      }, 5000);
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        uploadFile.mutate(file);
      });
    },
    [uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
  });

  const getStatusIcon = (status: UploadProgress["status"]) => {
    switch (status) {
      case "preparing":
      case "uploading":
      case "saving":
        return <Loader2 className="animate-spin" size={16} />;
      case "complete":
        return <CheckCircle className="text-green-500" size={16} />;
      case "error":
        return <AlertCircle className="text-red-500" size={16} />;
    }
  };

  const getStatusText = (status: UploadProgress["status"]) => {
    switch (status) {
      case "preparing":
        return "Preparing...";
      case "uploading":
        return "Uploading to storage...";
      case "saving":
        return "Saving to database...";
      case "complete":
        return "Complete!";
      case "error":
        return "Failed";
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-4 text-gray-400" size={48} />
        {isDragActive ? (
          <p className="text-blue-600">Drop files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag and drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports: JPG, PNG, PDF, DOCX
            </p>
          </div>
        )}
      </div>

      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          {uploadProgress.map((progress, index) => (
            <div
              key={index}
              className="flex flex-col p-3 bg-gray-50 rounded-lg gap-2"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(progress.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {progress.fileName}
                  </p>
                  <p
                    className={`text-xs ${
                      progress.status === "error"
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {progress.error || getStatusText(progress.status)} - {progress.progress}%
                  </p>
                </div>
              </div>
              {progress.status !== "error" && progress.status !== "complete" && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
