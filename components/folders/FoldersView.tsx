"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderTree } from "./FolderTree";
import { FolderContents } from "./FolderContents";
import { Plus } from "lucide-react";

export function FoldersView({ userId, initialFolderId }: { userId: string; initialFolderId?: string }) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(initialFolderId || null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setSelectedFolderId(initialFolderId || null);
  }, [initialFolderId]);

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
        body: JSON.stringify({ name, parentId: selectedFolderId }),
      });
      if (!res.ok) throw new Error("Failed to create folder");
      return res.json();
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

  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Folders</h2>
            <button
              onClick={() => setShowNewFolder(true)}
              className="p-2 hover:bg-gray-200 rounded-lg"
            >
              <Plus size={20} />
            </button>
          </div>
          
          {showNewFolder && (
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                autoFocus
                onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
              />
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowNewFolder(false);
                  setNewFolderName("");
                }}
                className="px-3 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <FolderTree
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <FolderContents folderId={selectedFolderId} />
      </div>
    </div>
  );
}
