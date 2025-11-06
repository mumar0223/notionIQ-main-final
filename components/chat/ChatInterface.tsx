"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Download, Paperclip, X, Loader2, FileText, Image as ImageIcon, Menu, Save, FolderOpen } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { useRouter } from "next/navigation";
import { exportConversationToPDF, downloadPDF, exportSingleMessageToPDF } from "@/lib/exportPDF";
import { FolderPickerDialog } from "@/components/folders/FolderPickerDialog";

interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  attachedFiles?: AttachedFile[];
}

interface UploadedFile {
  file: File;
  id: string;
  uploading: boolean;
  error?: string;
  uploadedId?: string;
  uploadedUrl?: string;
  text?: string;
  imageData?: { base64: string; mimeType: string };
}

export function ChatInterface({ userId, conversationId }: { userId: string; conversationId?: string }) {
  const [input, setInput] = useState("");
  const [currentConvId, setCurrentConvId] = useState(conversationId);
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [savingToFolder, setSavingToFolder] = useState<'conversation' | 'message' | null>(null);
  const [messageToSave, setMessageToSave] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", currentConvId || "new"],
    queryFn: async () => {
      if (!currentConvId) return [];
      const res = await fetch(`/api/messages?conversationId=${currentConvId}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!currentConvId,
  });

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload file");
      return res.json();
    },
  });

  const sendMessage = useMutation({
    mutationFn: async ({ content, files }: { content: string; files: UploadedFile[] }) => {
      const fileIds = files.map(f => f.uploadedId).filter(Boolean) as string[];
      const fileTexts = files.map(f => f.text).filter(Boolean) as string[];
      const fileImages = files.map(f => f.imageData).filter(Boolean);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          conversationId: currentConvId,
          fileIds,
          fileTexts,
          fileImages,
        }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onMutate: async ({ content, files }) => {
      const queryKey = ["messages", currentConvId || "new"];
      await queryClient.cancelQueries({ queryKey });
      
      const previousMessages = queryClient.getQueryData(queryKey);
      
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: content || "Analyze these files",
        createdAt: new Date().toISOString(),
        attachedFiles: files.filter(f => f.uploadedId).map(f => ({
          id: f.uploadedId!,
          name: f.file.name,
          type: f.file.type,
          size: f.file.size,
          url: f.uploadedUrl!,
        })),
      };
      
      queryClient.setQueryData(queryKey, (old: any) => 
        old ? [...old, optimisticMessage] : [optimisticMessage]
      );
      
      return { previousMessages, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousMessages && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousMessages);
      }
    },
    onSuccess: (data) => {
      if (!currentConvId) {
        setCurrentConvId(data.conversationId);
        queryClient.removeQueries({ queryKey: ["messages", "new"] });
        router.push(`/chat/${data.conversationId}`);
      }
      setAttachedFiles([]);
      queryClient.invalidateQueries({ queryKey: ["messages", currentConvId || data.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: UploadedFile[] = files.map((file) => ({
      file,
      id: Math.random().toString(36),
      uploading: true,
    }));
    setAttachedFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    for (const newFile of newFiles) {
      try {
        const uploadedData = await uploadFile.mutateAsync(newFile.file);
        setAttachedFiles((prev) =>
          prev.map((f) =>
            f.id === newFile.id
              ? {
                  ...f,
                  uploading: false,
                  uploadedId: uploadedData.id,
                  uploadedUrl: uploadedData.url,
                  text: uploadedData.text,
                  imageData: uploadedData.imageData,
                }
              : f
          )
        );
      } catch (error) {
        setAttachedFiles((prev) =>
          prev.map((f) =>
            f.id === newFile.id
              ? { ...f, uploading: false, error: "Upload failed" }
              : f
          )
        );
      }
    }
  };

  const removeFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasUploadingFiles = attachedFiles.some(f => f.uploading);
    const hasErrors = attachedFiles.some(f => f.error);
    
    if ((!input.trim() && attachedFiles.length === 0) || sendMessage.isPending || hasUploadingFiles || hasErrors) return;
    
    sendMessage.mutate({ content: input || "Analyze these files", files: attachedFiles });
    setInput("");
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon size={16} />;
    return <FileText size={16} />;
  };

  const handleExportPDF = async () => {
    if (messages.length === 0) return;
    const pdf = await exportConversationToPDF("Chat Conversation", messages);
    downloadPDF(pdf, `conversation-${currentConvId || Date.now()}.pdf`);
    setShowActionsMenu(false);
  };

  const handleExportSingleMessage = async (message: any, index: number) => {
    const pdf = await exportSingleMessageToPDF(message, index);
    downloadPDF(pdf, `message-${index + 1}-${Date.now()}.pdf`);
  };

  const handleSaveToFolder = async (folderId: string) => {
    if (savingToFolder === 'conversation' && currentConvId) {
      const pdf = await exportConversationToPDF("Chat Conversation", messages);
      const blob = pdf.output('blob');
      
      const file = new File([blob], `conversation-${currentConvId}.pdf`, { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderId', folderId);

      await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      queryClient.invalidateQueries({ queryKey: ['files', folderId] });
    } else if (savingToFolder === 'message' && messageToSave) {
      const messageIndex = messages.findIndex((m: any) => m.id === messageToSave.id);
      const pdf = await exportSingleMessageToPDF(messageToSave, messageIndex);
      const blob = pdf.output('blob');
      
      const file = new File([blob], `message-${messageIndex + 1}.pdf`, { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderId', folderId);

      await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      queryClient.invalidateQueries({ queryKey: ['files', folderId] });
      setMessageToSave(null);
    }

    setShowFolderPicker(false);
    setSavingToFolder(null);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Chat</h2>
        <div className="relative">
          <button
            onClick={() => setShowActionsMenu(!showActionsMenu)}
            disabled={messages.length === 0}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            title="Chat actions"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
          
          {showActionsMenu && (
            <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-100 text-sm"
              >
                <Download size={16} />
                <span>Download as PDF</span>
              </button>
              <button
                onClick={() => {
                  setSavingToFolder('conversation');
                  setShowFolderPicker(true);
                  setShowActionsMenu(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-100 text-sm"
              >
                <Save size={16} />
                <span>Save to Folder</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-2xl mb-2">Start a conversation</p>
              <p className="text-sm">Type a message below to begin</p>
            </div>
          </div>
        ) : (
          messages.map((message: Message, index: number) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              } group`}
            >
              <div className="flex flex-col gap-2 max-w-3xl">
                <div
                  className={`${
                    message.role === "user"
                      ? "bg-blue-600 text-white rounded-2xl px-4 py-3"
                      : "bg-gray-100 text-gray-800 rounded-2xl px-4 py-3"
                  }`}
                >
                  {message.attachedFiles && message.attachedFiles.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {message.attachedFiles.map((file) => (
                        <a
                          key={file.id}
                          href={file.url}
                          download={file.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 px-2 py-1 rounded hover:opacity-80 transition-opacity ${
                            message.role === "user"
                              ? "bg-blue-500"
                              : "bg-white text-gray-700"
                          }`}
                        >
                          {getFileIcon(file.type)}
                          <div className="flex flex-col">
                            <span className="text-xs truncate max-w-[120px] font-medium">
                              {file.name}
                            </span>
                            <span className="text-[10px] opacity-75">
                              {file.type.split('/')[1].toUpperCase()} • {(file.size / 1024).toFixed(0)}KB
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                  {message.role === "user" ? (
                    <p>{message.content}</p>
                  ) : (
                    <MarkdownContent content={message.content} />
                  )}
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleExportSingleMessage(message, index)}
                    className="px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-1 text-xs text-gray-700"
                    title="Download this message"
                  >
                    <Download size={12} />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      setMessageToSave(message);
                      setSavingToFolder('message');
                      setShowFolderPicker(true);
                    }}
                    className="px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-1 text-xs text-gray-700"
                    title="Save to folder"
                  >
                    <FolderOpen size={12} />
                    Save
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        {attachedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachedFiles.map((fileData) => (
              <div
                key={fileData.id}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
              >
                {fileData.uploading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : fileData.error ? (
                  <X size={16} className="text-red-500" />
                ) : (
                  getFileIcon(fileData.file.type)
                )}
                <span className={`text-sm max-w-[150px] truncate ${fileData.error ? 'text-red-500' : 'text-gray-700'}`}>
                  {fileData.file.name}
                </span>
                {fileData.error && (
                  <span className="text-xs text-red-500">Failed</span>
                )}
                <button
                  onClick={() => removeFile(fileData.id)}
                  className="text-gray-500 hover:text-red-500"
                  type="button"
                  disabled={fileData.uploading}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept="image/*,.pdf,.docx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-600 hover:bg-gray-100 rounded-lg"
            disabled={sendMessage.isPending}
            title="Attach files"
          >
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={sendMessage.isPending}
          />
          <button
            type="submit"
            disabled={
              (!input.trim() && attachedFiles.length === 0) || 
              sendMessage.isPending || 
              attachedFiles.some(f => f.uploading) ||
              attachedFiles.some(f => f.error)
            }
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sendMessage.isPending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </form>
      </div>

      <FolderPickerDialog
        isOpen={showFolderPicker}
        onClose={() => {
          setShowFolderPicker(false);
          setSavingToFolder(null);
          setMessageToSave(null);
        }}
        onSelect={handleSaveToFolder}
        title={savingToFolder === 'message' ? 'Save Message to Folder' : 'Save Conversation to Folder'}
      />
    </div>
  );
}
