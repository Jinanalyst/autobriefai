"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowUp,
  BookOpen,
  BrainCircuit,
  Code,
  FileText,
  Mic,
  PenTool,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { useChat } from "ai/react";

import FileUpload from "@/components/FileUpload";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';

interface AIAssistantInterfaceProps {
  uploadStatus: UploadStatus;
  onFileUpload: (file: File) => void;
  uploadedFile: File | null;
}

export function AIAssistantInterface({
  uploadStatus,
  onFileUpload,
  uploadedFile,
}: AIAssistantInterfaceProps) {
  const { messages, input, handleInputChange, handleSubmit, setInput } = useChat({
    api: "/api/chat",
  });

  const [searchEnabled, setSearchEnabled] = useState(false);
  const [deepResearchEnabled, setDeepResearchEnabled] = useState(false);
  const [reasonEnabled, setReasonEnabled] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const commandSuggestions = [
    "Summarize this document's key findings.",
    "What are the main action items from this meeting?",
    "Give me a brief overview of this file.",
  ];

  const handleCommandSelect = (command: string) => {
    setInput(command);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    if (uploadedFile) {
      setUploadedFiles([uploadedFile.name]);
    } else {
      setUploadedFiles([]);
    }
  }, [uploadedFile]);

  return (
    <div className="w-full max-w-3xl flex flex-col h-[70vh]">
      {/* Conditional Title */}
      {messages.length === 0 && !uploadedFile && (
        <div className="text-center my-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            How can AutoBrief help you today?
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload a document or start a conversation to get instant insights.
          </p>
        </div>
      )}

      {/* Chat messages display */}
      <div className={`flex-grow overflow-y-auto mb-4 p-4 ${messages.length > 0 ? 'bg-white border border-gray-200 rounded-xl shadow-sm' : ''}`}>
        {messages.map((m) => (
          <div key={m.id} className="whitespace-pre-wrap flex flex-col mb-4">
            <div
              className={`p-3 rounded-lg max-w-lg ${
                m.role === "user"
                  ? "bg-blue-500 text-white self-end"
                  : "bg-gray-100 text-gray-800 self-start"
              }`}
            >
              <span className="font-bold capitalize">
                {m.role === "user" ? "You" : "Assistant"}
              </span>
              <p>{m.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="w-full mt-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-3 p-2 rounded-full hover:bg-gray-100"
              disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
            >
              {uploadStatus === 'uploading' || uploadStatus === 'processing' ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 1,
                    ease: "linear",
                  }}
                >
                  <Plus className="w-5 h-5 text-blue-600" />
                </motion.div>
              ) : (
                <Plus className="w-5 h-5 text-gray-500" />
              )}
            </button>
            <div style={{ display: "none" }}>
              <FileUpload
                onFileUpload={onFileUpload}
                isUploading={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                ref={fileInputRef}
              />
            </div>
            
            <input
              ref={inputRef}
              type="text"
              placeholder="How can AutoBrief help you today?"
              value={input}
              onChange={handleInputChange}
              className="w-full text-gray-800 text-base outline-none placeholder:text-gray-400 pl-14 pr-14 py-4 border border-gray-200 rounded-full shadow-sm focus:ring-2 focus:ring-blue-500"
            />
            
            <button
              type="submit"
              className="absolute right-3 p-2 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={uploadStatus !== 'idle' || !input}
            >
              <ArrowUp className="w-5 h-5 text-white" />
            </button>
          </div>
        </form>

        {/* Status Messages */}
        <div className="text-center mt-2 text-sm text-gray-500 h-5">
          {uploadStatus === 'uploading' && 'Uploading file...'}
          {uploadStatus === 'processing' && 'Processing and summarizing... This may take a moment.'}
          {uploadStatus === 'failed' && <span className="text-red-500">Upload failed. Please try again.</span>}
        </div>

        {/* Suggestion buttons */}
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          {commandSuggestions.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleCommandSelect(prompt)}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SwitchWithLabelProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SwitchWithLabel({
  id,
  label,
  checked,
  onChange,
}: SwitchWithLabelProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label
        htmlFor={id}
        className="text-sm font-medium text-gray-600 cursor-pointer"
      >
        {label}
      </Label>
    </div>
  );
}