'use client'

import * as React from "react"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from "@/components/Header"
import { AIAssistantInterface, UploadStatus } from "@/components/ui/ai-assistant-interface"

export default function Demo() {
  const router = useRouter()
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleFileUpload = async (file: File) => {
    setUploadStatus('processing')
    setUploadedFile(file)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      router.push(`/results/${data.id}`)
      setUploadStatus('completed')
    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus('failed')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow flex items-center justify-center container mx-auto px-4">
        {/* <AIAssistantInterface 
          uploadStatus={uploadStatus}
          onFileUpload={handleFileUpload}
          uploadedFile={uploadedFile}
        /> */}
        <p className="text-center text-gray-500">
          The AI Assistant is temporarily unavailable. We are working on it!
        </p>
      </main>
    </div>
  )
} 