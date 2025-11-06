"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Folder, ChevronRight, ChevronDown, MoreVertical, Edit2, Trash2 } from "lucide-react";

interface FolderItemProps {
  folder: any;
  selectedFolderId: string | null;
  onSelectFolder: (id: string) => void;
  level: number;
}

function FolderItem({ folder, selectedFolderId, onSelectFolder, level }: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const renameFolder = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/folders/${folder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to rename folder");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setIsEditing(false);
    },
  });

  const deleteFolder = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/folders/${folder.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete folder");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const handleRename = () => {
    if (newName.trim() && newName !== folder.name) {
      renameFolder.mutate(newName);
    } else {
      setIsEditing(false);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-200 ${
          selectedFolderId === folder.id ? "bg-blue-100" : ""
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => {
          if (!isEditing) {
            onSelectFolder(folder.id);
            router.push(`/folders/${folder.id}`);
          }
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-0.5"
        >
          {folder.children?.length > 0 ? (
            isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : (
            <span className="w-4" />
          )}
        </button>

        <div className="flex items-center gap-2 flex-1">
          <Folder size={16} className="text-blue-600" />

          {isEditing ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyPress={(e) => e.key === "Enter" && handleRename()}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              autoFocus
            />
          ) : (
            <span className="flex-1 text-sm">
              {folder.name}
            </span>
          )}
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-gray-300 rounded"
          >
            <MoreVertical size={14} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 text-sm"
              >
                <Edit2 size={14} />
                Rename
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this folder and all its contents?")) {
                    deleteFolder.mutate();
                  }
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 text-red-600 text-sm"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {isExpanded && folder.children?.map((child: any) => (
        <FolderItem
          key={child.id}
          folder={child}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          level={level + 1}
        />
      ))}
    </div>
  );
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
}: {
  folders: any[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string) => void;
}) {
  const rootFolders = folders.filter((f) => !f.parentId);

  return (
    <div>
      {rootFolders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          level={0}
        />
      ))}
    </div>
  );
}
