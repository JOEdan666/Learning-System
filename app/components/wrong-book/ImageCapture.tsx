'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, Loader2, Image as ImageIcon, Copy, Check } from 'lucide-react'
import Tesseract from 'tesseract.js'

interface ImageCaptureProps {
  onImageCapture: (imageUrl: string, extractedText?: string) => void
  onTextExtract?: (text: string) => void
  multiple?: boolean
  maxImages?: number
  existingImages?: string[]
  onRemoveImage?: (index: number) => void
}

export default function ImageCapture({
  onImageCapture,
  onTextExtract,
  multiple = false,
  maxImages = 5,
  existingImages = [],
  onRemoveImage
}: ImageCaptureProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [extractedText, setExtractedText] = useState('')
  const [showTextPreview, setShowTextPreview] = useState(false)
  const [copiedText, setCopiedText] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Convert file to data URL
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Process image with OCR
  const processImageWithOCR = useCallback(async (imageUrl: string): Promise<string> => {
    try {
      const result = await Tesseract.recognize(
        imageUrl,
        'chi_sim+eng', // Chinese simplified + English
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100))
            }
          }
        }
      )
      return result.data.text.trim()
    } catch (error) {
      console.error('OCR failed:', error)
      return ''
    }
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const remainingSlots = maxImages - existingImages.length
    const filesToProcess = Array.from(files).slice(0, multiple ? remainingSlots : 1)

    setIsProcessing(true)
    setOcrProgress(0)

    try {
      for (const file of filesToProcess) {
        if (!file.type.startsWith('image/')) continue

        const dataUrl = await fileToDataUrl(file)

        // Run OCR
        const text = await processImageWithOCR(dataUrl)

        if (text) {
          setExtractedText(text)
          setShowTextPreview(true)
          onTextExtract?.(text)
        }

        onImageCapture(dataUrl, text)
      }
    } catch (error) {
      console.error('Error processing image:', error)
    } finally {
      setIsProcessing(false)
      setOcrProgress(0)
    }
  }, [existingImages.length, maxImages, multiple, onImageCapture, onTextExtract, processImageWithOCR])

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  // Handle paste
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          const dataTransfer = new DataTransfer()
          dataTransfer.items.add(file)
          handleFileSelect(dataTransfer.files)
        }
        break
      }
    }
  }, [handleFileSelect])

  // Listen for paste events
  React.useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  // Copy extracted text
  const copyText = async () => {
    await navigator.clipboard.writeText(extractedText)
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 2000)
  }

  const canAddMore = existingImages.length < maxImages

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-6 text-center transition-all
            ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}
            ${isProcessing ? 'pointer-events-none opacity-60' : 'cursor-pointer'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-slate-600">正在识别图片文字...</p>
              <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">{ocrProgress}%</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-blue-500" />
                </div>
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  点击上传、拖拽图片或直接粘贴
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  支持 JPG、PNG 格式，自动识别图片中的文字
                </p>
              </div>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* Action Buttons */}
      {canAddMore && !isProcessing && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            选择图片
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-green-50 hover:bg-green-100 rounded-lg text-sm font-medium text-green-700 transition-colors"
          >
            <Camera className="w-4 h-4" />
            拍照上传
          </button>
        </div>
      )}

      {/* Image Preview Grid */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {existingImages.map((url, index) => (
            <div
              key={index}
              className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 group"
            >
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {onRemoveImage && (
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/50 text-white text-xs">
                图片 {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Extracted Text Preview */}
      {showTextPreview && extractedText && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">识别文字</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyText}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700"
              >
                {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedText ? '已复制' : '复制'}
              </button>
              <button
                type="button"
                onClick={() => setShowTextPreview(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
            {extractedText}
          </p>
        </div>
      )}

      {/* Usage hint */}
      {existingImages.length === 0 && !isProcessing && (
        <p className="text-xs text-center text-slate-400">
          提示：可以直接按 Ctrl+V 粘贴截图
        </p>
      )}
    </div>
  )
}
