'use client'

import React, { useCallback, forwardRef } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'

interface FileUploadProps {
  onFileUpload: (file: File) => void
  isUploading: boolean
}

const acceptedFileTypes = {
  'audio/mp3': ['.mp3'],
  'audio/wav': ['.wav'],
  'video/mp4': ['.mp4'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
}

const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({ onFileUpload, isUploading }, ref) => {
    const onDrop = useCallback(
      (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
          onFileUpload(acceptedFiles[0])
        }
      },
      [onFileUpload]
    )

    const { getRootProps, getInputProps } = useDropzone({
      onDrop,
      accept: acceptedFileTypes,
      multiple: false,
      maxSize: 100 * 1024 * 1024, // 100MB
      onDropRejected: (fileRejections) => {
        const rejection = fileRejections[0]
        if (rejection.errors[0]?.code === 'file-too-large') {
          toast.error('File is too large. Maximum size is 100MB.')
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          toast.error('Invalid file type. Please upload PDF, DOCX, MP3, MP4, or WAV files.')
        } else {
          toast.error('Error uploading file. Please try again.')
        }
      },
    })

    // This component is now 'headless' and is triggered by the parent.
    // We can return just the input.
    return (
      <div {...getRootProps()} style={{ display: 'none' }}>
        <input {...getInputProps()} ref={ref} />
      </div>
    )
  }
)

FileUpload.displayName = 'FileUpload'

export default FileUpload 