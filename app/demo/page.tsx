'use client'

import * as React from "react"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from "@/components/Header"
import { AIAssistantInterface, UploadStatus } from "@/components/ui/ai-assistant-interface"
import toast from "react-hot-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function Demo() {
  const router = useRouter()
  const [supabase] = useState(() => createClientComponentClient())
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleFileUpload = async (file: File) => {
    setUploadStatus('uploading');
    setUploadedFile(file);
    setErrorMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      const folderPath = userId || 'anonymous';
      
      const sanitizedFileName = file.name
        .replace(/[^a-zA-Z0-9.\-_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      const filePath = `${folderPath}/${Date.now()}-${sanitizedFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Storage Error: ${uploadError.message}`);
      }

      setUploadStatus('processing');
      toast.success('File uploaded! Creating summary record...');

      // Create a record in the 'summaries' table
      const { data: summaryRecord, error: insertError } = await supabase
        .from('summaries')
        .insert({
          user_id: userId,
          file_name: sanitizedFileName,
          file_path: filePath, // Storing the path for the function
          status: 'processing',
        })
        .select('id')
        .single();

      if (insertError) {
        throw new Error(`Database Error: ${insertError.message}`);
      }
      
      // Redirect to the results page
      if (summaryRecord) {
        toast.success('Processing started! Redirecting to results...');
        router.push(`/results/${summaryRecord.id}`);
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      setErrorMessage(error.message || 'An unknown error occurred.');
      toast.error(error.message || 'An unknown error occurred.');
      setUploadStatus('failed');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow flex items-center justify-center container mx-auto px-4">
        <AIAssistantInterface 
          uploadStatus={uploadStatus}
          onFileUpload={handleFileUpload}
          uploadedFile={uploadedFile}
          errorMessage={errorMessage}
        />
      </main>
    </div>
  )
} 