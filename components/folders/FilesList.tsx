"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileUpload } from "./FileUpload";
import { FileCard } from "./FileCard";
import { FilePreviewDialog } from "./FilePreviewDialog";

export function FilesList({ folderId }: { folderId: string | null }) {
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const { data: files = [], isLoading } = useQuery({
    queryKey: ["files", folderId],
    queryFn: async () => {
      if (!folderId) return [];
      const res = await fetch(`/api/files?folderId=${folderId}`);
      if (!res.ok) throw new Error("Failed to fetch files");
      return res.json();
    },
    enabled: !!folderId,
  });

  if (!folderId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Select a folder to view files</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <FileUpload folderId={folderId} />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <p className="text-gray-500">Loading files...</p>
        ) : files.length === 0 ? (
          <p className="text-gray-500">No files in this folder. Upload some files to get started!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file: any) => (
              <FileCard 
                key={file.id} 
                file={file} 
                onPreview={(file) => setPreviewFile(file)}
              />
            ))}
          </div>
        )}
      </div>

      <FilePreviewDialog
        file={previewFile}
        files={files}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}
