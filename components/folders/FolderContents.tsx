"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderPlus, FilePlus, Folder as FolderIcon, Loader2 } from "lucide-react";
import { FileCard } from "./FileCard";
import { FilePreviewDialog } from "./FilePreviewDialog";

interface FolderContentsProps {
  folderId: string | null;
}

export function FolderContents({ folderId }: FolderContentsProps) {
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ["files", folderId],
    queryFn: async () => {
      if (!folderId) return [];
      const res = await fetch(`/api/files?folderId=${folderId}`);
      if (!res.ok) throw new Error("Failed to fetch files");
      return res.json();
    },
    enabled: !!folderId,
  });

  const { data: folders = [] } = useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const res = await fetch("/api/folders");
      if (!res.ok) throw new Error("Failed to fetch folders");
      return res.json();
    },
  });

  const createFolder = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: folderId }),
      });
      if (!res.ok) throw new Error("Failed to create folder");
      return res.json();
    },
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: ["folders"] });
      
      const previousFolders = queryClient.getQueryData(["folders"]);
      
      const optimisticFolder = {
        id: `temp-${Date.now()}`,
        name,
        parentId: folderId,
        userId: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: [],
      };
      
      queryClient.setQueryData(["folders"], (old: any) => 
        old ? [...old, optimisticFolder] : [optimisticFolder]
      );
      
      return { previousFolders };
    },
    onError: (err, variables, context) => {
      if (context?.previousFolders) {
        queryClient.setQueryData(["folders"], context.previousFolders);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setNewFolderName("");
      setShowNewFolder(false);
    },
  });

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder.mutate(newFolderName);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !folderId) return;
    
    const filesArray = Array.from(e.target.files);
    setUploadingFiles(true);

    const optimisticFiles = filesArray.map(file => ({
      id: `temp-${file.name}-${Date.now()}`,
      name: file.name,
      originalName: file.name,
      type: file.type,
      size: file.size,
      url: "",
      userId: "",
      folderId,
      pages: null,
      createdAt: new Date().toISOString(),
      uploading: true,
    }));

    queryClient.setQueryData(["files", folderId], (old: any) => 
      old ? [...old, ...optimisticFiles] : optimisticFiles
    );

    try {
      for (const file of filesArray) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folderId", folderId);

        const res = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["files", folderId] });
    } catch (error) {
      console.error("Upload error:", error);
      queryClient.invalidateQueries({ queryKey: ["files", folderId] });
      alert("Some files failed to upload. Please try again.");
    } finally {
      setUploadingFiles(false);
      e.target.value = "";
    }
  };

  const subfolders = folders.filter((f: any) => f.parentId === folderId);

  if (!folderId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FolderIcon size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-xl text-gray-500 font-medium">Select a folder</p>
          <p className="text-sm text-gray-400 mt-2">Choose a folder from the sidebar to view its contents</p>
        </div>
      </div>
    );
  }

  if (filesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto text-blue-500 mb-4 animate-spin" />
          <p className="text-lg text-gray-600 font-medium">Loading folder contents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* New Folder Card */}
          {showNewFolder ? (
            <div className="border-2 border-dashed border-blue-400 rounded-lg p-4 bg-blue-50">
              <div className="space-y-3">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateFolder();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim() || createFolder.isPending}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createFolder.isPending ? "Creating..." : "Create"}
                  </button>
                  <button
                    onClick={() => {
                      setShowNewFolder(false);
                      setNewFolderName("");
                    }}
                    className="flex-1 px-3 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewFolder(true)}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-3 min-h-[160px]"
            >
              <FolderPlus size={32} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-600">New Folder</span>
            </button>
          )}

          {/* Add Files Card */}
          <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-green-400 hover:bg-green-50 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[160px]">
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.docx"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploadingFiles}
            />
            <FilePlus size={32} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-600">
              {uploadingFiles ? "Uploading..." : "Add Files"}
            </span>
          </label>

          {/* Subfolders */}
          {subfolders.map((subfolder: any) => (
            <div
              key={subfolder.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/folders/${subfolder.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <FolderIcon size={32} className="text-blue-500" />
              </div>
              <h3 className="font-medium text-sm mb-2 truncate">{subfolder.name}</h3>
              <div className="text-xs text-gray-500">
                <p>Subfolder</p>
              </div>
            </div>
          ))}

          {/* Files */}
          {files.map((file: any) => (
            <FileCard
              key={file.id}
              file={file}
              onPreview={(file) => setPreviewFile(file)}
            />
          ))}
        </div>

        {!filesLoading && files.length === 0 && subfolders.length === 0 && !showNewFolder && (
          <div className="text-center py-12 text-gray-500">
            <p>This folder is empty</p>
            <p className="text-sm mt-2">Create a subfolder or add files to get started</p>
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
