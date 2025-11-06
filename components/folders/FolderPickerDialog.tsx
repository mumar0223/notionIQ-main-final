"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Folder as FolderIcon, ChevronRight, ChevronDown, FolderPlus } from "lucide-react";

interface FolderPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderId: string) => void;
  title?: string;
}

export function FolderPickerDialog({ isOpen, onClose, onSelect, title = "Select Folder" }: FolderPickerDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: folders = [] } = useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const res = await fetch("/api/folders");
      if (!res.ok) throw new Error("Failed to fetch folders");
      return res.json();
    },
    enabled: isOpen,
  });

  const createFolder = useMutation({
    mutationFn: async (data: { name: string; parentId: string | null }) => {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create folder");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setNewFolderName("");
      setShowNewFolder(false);
      setSelectedFolderId(data.id);
    },
  });

  const toggleExpanded = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder.mutate({ name: newFolderName, parentId: newFolderParentId });
    }
  };

  const handleSelect = () => {
    if (selectedFolderId) {
      onSelect(selectedFolderId);
      onClose();
    }
  };

  const buildFolderTree = (parentId: string | null = null): any[] => {
    return folders
      .filter((f: any) => f.parentId === parentId)
      .sort((a: any, b: any) => a.order - b.order);
  };

  const renderFolder = (folder: any, level: number = 0) => {
    const children = buildFolderTree(folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
            isSelected ? "bg-blue-100 hover:bg-blue-200" : ""
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          <button
            onClick={() => toggleExpanded(folder.id)}
            className="p-0.5"
          >
            {children.length > 0 ? (
              isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            ) : (
              <span className="w-4" />
            )}
          </button>

          <FolderIcon size={16} className="text-blue-600" />

          <span
            className="flex-1 text-sm"
            onClick={() => setSelectedFolderId(folder.id)}
          >
            {folder.name}
          </span>

          <button
            onClick={() => {
              setNewFolderParentId(folder.id);
              setShowNewFolder(true);
            }}
            className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100"
            title="Add subfolder"
          >
            <FolderPlus size={14} />
          </button>
        </div>

        {isExpanded && children.map((child: any) => renderFolder(child, level + 1))}
      </div>
    );
  };

  if (!isOpen) return null;

  const rootFolders = buildFolderTree(null);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Folder Tree */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* New Folder Form */}
          {showNewFolder && (
            <div className="mb-4 p-3 bg-blue-50 border-2 border-dashed border-blue-400 rounded-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="New folder name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  autoFocus
                  onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
                />
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewFolder(false);
                    setNewFolderName("");
                    setNewFolderParentId(null);
                  }}
                  className="px-3 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
              {newFolderParentId && (
                <p className="text-xs text-gray-600 mt-2">
                  Creating subfolder in: {folders.find((f: any) => f.id === newFolderParentId)?.name}
                </p>
              )}
            </div>
          )}

          {/* Root level new folder button */}
          {!showNewFolder && (
            <button
              onClick={() => {
                setNewFolderParentId(null);
                setShowNewFolder(true);
              }}
              className="w-full mb-3 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <FolderPlus size={20} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-600">New Folder</span>
            </button>
          )}

          {/* Folder Tree */}
          <div className="space-y-1">
            {rootFolders.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No folders yet. Create one to get started!
              </p>
            ) : (
              rootFolders.map((folder: any) => renderFolder(folder, 0))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {selectedFolderId ? (
              <span>Selected: {folders.find((f: any) => f.id === selectedFolderId)?.name}</span>
            ) : (
              <span>No folder selected</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedFolderId}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select Folder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
