"use client"

import { useState, useEffect, useRef, ChangeEvent } from "react"
import { useParams, useRouter } from "next/navigation"
import { Camera, Upload, RefreshCw, X, Check, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/auth"
import { Database } from "@/lib/database.types"

// Type for machine
type Machine = Database["public"]["Tables"]["machines"]["Row"]

export default function FilesUploadPage() {
  const params = useParams()
  const machineId = params?.id as string
  const { toast } = useToast()
  const router = useRouter()

  const [machine, setMachine] = useState<Machine | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8080/api/upload"

  // Fetch machine info
  useEffect(() => {
    const fetchMachine = async () => {
      try {
        const { data, error } = await supabase
          .from('machines')
          .select('*')
          .eq('id', machineId)
          .single()

        if (error) {
          console.error("Error fetching machine:", error.message)
          toast({ title: "Error", description: error.message, variant: "destructive" })
          return
        }

        setMachine(data)
      } catch (error: any) {
        console.error("Unexpected error:", error)
        toast({ title: "Error", description: "Unexpected error fetching machine.", variant: "destructive" })
      }
    }

    fetchMachine()
  }, [machineId, toast])

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)])
    }
  }

  // Remove a file
  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  // Upload files
  // Upload files
  const uploadFiles = async () => {
    if (!selectedFiles.length || !machine) return

    setUploading(true)
    setUploadProgress(0)

    let successCount = 0

    for (let i = 0; i < selectedFiles.length; i++) {
      const formData = new FormData()
      formData.append("image", selectedFiles[i])
      formData.append("machine_id", machine.id)

      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const text = await response.text()
          console.error(`Upload error for ${selectedFiles[i].name}:`, text)
          toast({ title: "Upload Error", description: text, variant: "destructive" })
        } else {
          successCount++
        }
      } catch (error) {
        console.error(`Upload exception for ${selectedFiles[i].name}:`, error)
        toast({ title: "Upload Exception", description: `${error}`, variant: "destructive" })
      }

      // Update progress
      setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100))
    }

    if (successCount === selectedFiles.length) {
      toast({ title: "All Uploads Successful", description: `${successCount} files uploaded.` })
      setSelectedFiles([])
      setUploadProgress(0)
    } else {
      toast({ title: "Some Uploads Failed", description: `${successCount}/${selectedFiles.length} files uploaded.` })
    }

    setUploading(false)
  }

  
  

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Button variant="ghost" size="icon" className="mr-2 text-gray-400 hover:text-white" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-blue-400">
            {machine ? `Upload Files: ${machine.name}` : 'Upload Files'}
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="overflow-hidden bg-gray-900 border-gray-800 text-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-white flex items-center">
              <Upload className="mr-2 h-5 w-5 text-blue-400" />
              File Uploader
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-center space-y-4">
              <input type="file" id="file-upload" multiple accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
              <label htmlFor="file-upload" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded inline-block">
                {uploading ? "Uploading..." : "Select Files"}
              </label>

              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative bg-gray-800 p-3 rounded">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                      {!uploading && (
                        <button onClick={() => removeFile(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {uploading && (
                <div className="w-full bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-2 bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between items-center border-t border-gray-800 bg-gray-900/50 p-4">
            <Button
              onClick={uploadFiles}
              disabled={uploading || selectedFiles.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {uploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" /> Upload
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
