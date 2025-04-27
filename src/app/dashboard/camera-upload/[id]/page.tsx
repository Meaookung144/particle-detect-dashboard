"use client"

import { useState, useEffect, useRef } from "react"
import { use } from "react" // Add this import for React.use()
import { Camera, RefreshCw, Check, X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Database } from "@/lib/database.types"

// Type for machine data
type Machine = Database["public"]["Tables"]["machines"]["Row"]

export default function CameraUploadPage({ params }: { params: { id: string } }) {
  // Unwrap params with React.use()
  const unwrappedParams = use(params)
  const machineId = unwrappedParams.id
  
  const { toast } = useToast()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isAutoCapturing, setIsAutoCapturing] = useState(false)
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [machine, setMachine] = useState<Machine | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8080/api/upload"

  // Fetch machine data on component mount
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
          toast({
            title: "Error",
            description: "Failed to load machine data. " + error.message,
            variant: "destructive",
          })
          return
        }

        setMachine(data)
      } catch (error: any) {
        console.error("Unexpected error:", error)
        toast({
          title: "Error",
          description: "Something went wrong when fetching machine data.",
          variant: "destructive",
        })
      }
    }

    fetchMachine()

    // Cleanup function to stop camera when component unmounts
    return () => {
      stopCamera()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [machineId, toast])

  // Start camera function
  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: "environment", // Use the back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsCameraActive(true)
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      toast({
        title: "Camera Error",
        description: "Could not access the camera. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  // Stop camera function
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
    setIsAutoCapturing(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setCountdown(null)
  }

  // Capture image function
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Draw the current video frame to the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Convert canvas to data URL
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
        setLastCapturedImage(imageDataUrl)
        
        return imageDataUrl
      }
    }
    return null
  }

  // Manual capture button handler
  const handleCapture = () => {
    captureImage()
  }

  // Upload image function
  const uploadImage = async (imageDataUrl: string) => {
    if (!machine) return
    
    try {
      setUploading(true)
      setUploadProgress(0)
      
      // Convert data URL to blob
      const response = await fetch(imageDataUrl)
      const blob = await response.blob()
      
      // Create form data
      const formData = new FormData()
      formData.append('machine_id', machine.id)
      formData.append('image', blob, `image_${Date.now()}.jpg`)
      
      // Create XMLHttpRequest to track progress
      const xhr = new XMLHttpRequest()
      
      // Set up progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(percentComplete)
        }
      })
      
      // Create a promise to handle the request
      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`HTTP Error ${xhr.status}: ${xhr.statusText}`))
          }
        }
        
        xhr.onerror = function() {
          reject(new Error('Network error occurred'))
        }
      })
      
      // Open and send the request
      xhr.open('POST', apiEndpoint)
      xhr.send(formData)
      
      // Wait for the upload to complete
      await uploadPromise
      
      // Show success message
      toast({
        title: "Upload Successful",
        description: "Image uploaded successfully",
      })
      
      // Reset upload state
      setUploadProgress(0)
    } catch (error: any) {
      console.error("Error uploading image:", error)
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  // Toggle auto capture
  const toggleAutoCapture = () => {
    if (isAutoCapturing) {
      // Stop auto capture
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsAutoCapturing(false)
      setCountdown(null)
    } else {
      // Start auto capture
      startAutoCapture()
    }
  }

  // Start auto capture with the machine's upload interval
  const startAutoCapture = () => {
    if (!machine) return
    
    setIsAutoCapturing(true)
    const intervalSeconds = machine.upload_interval_seconds || 5 
    setCountdown(intervalSeconds)
    
    // Initial capture
    const imageDataUrl = captureImage()
    if (imageDataUrl) {
      uploadImage(imageDataUrl)
    }
    
    // Set up interval for countdown
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          // Time to capture and upload
          const imageDataUrl = captureImage()
          if (imageDataUrl) {
            uploadImage(imageDataUrl)
          }
          return intervalSeconds
        }
        return prev - 1
      })
    }, 1000)
    
    intervalRef.current = countdownInterval
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 text-gray-400 hover:text-white"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-blue-400">
              {machine ? `Camera Upload: ${machine.name}` : 'Camera Upload'}
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="overflow-hidden bg-gray-900 border-gray-800 text-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-white flex items-center">
              <Camera className="mr-2 h-5 w-5 text-blue-400" />
              Camera Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isCameraActive ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto max-h-[70vh] bg-black"
                />
                
                {/* Hidden canvas for capturing */}
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Countdown overlay */}
                {isAutoCapturing && countdown !== null && (
                  <div className="absolute top-4 right-4 bg-blue-600 text-white rounded-full h-12 w-12 flex items-center justify-center font-bold text-xl">
                    {countdown}
                  </div>
                )}
                
                {/* Upload progress */}
                {uploading && (
                  <div className="absolute bottom-0 left-0 right-0 bg-blue-900/80 p-2">
                    <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-center mt-1 text-blue-200">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            ) : lastCapturedImage ? (
              <div className="relative">
                <img
                  src={lastCapturedImage}
                  alt="Captured"
                  className="w-full h-auto max-h-[70vh] bg-black"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center bg-gray-800 p-12 text-center h-64">
                <Camera className="h-12 w-12 text-gray-500 mb-4" />
                <p className="text-gray-400">Camera is currently inactive</p>
                <Button
                  onClick={startCamera}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Start Camera
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between items-center border-t border-gray-800 bg-gray-900/50 p-4">
            {isCameraActive ? (
              <>
                <Button
                  variant="destructive"
                  onClick={stopCamera}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <X className="mr-2 h-4 w-4" /> Stop Camera
                </Button>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleCapture}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isAutoCapturing}
                  >
                    <Camera className="mr-2 h-4 w-4" /> Capture
                  </Button>
                  <Button
                    onClick={toggleAutoCapture}
                    className={`${
                      isAutoCapturing
                        ? "bg-yellow-600 hover:bg-yellow-700"
                        : "bg-green-600 hover:bg-green-700"
                    } text-white`}
                  >
                    {isAutoCapturing ? (
                      <>
                        <X className="mr-2 h-4 w-4" /> Stop Auto
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" /> Auto Capture
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : lastCapturedImage ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setLastCapturedImage(null)
                    startCamera()
                  }}
                  className="border-blue-800 bg-blue-950/30 text-blue-400 hover:bg-blue-900/50"
                >
                  <Camera className="mr-2 h-4 w-4" /> New Photo
                </Button>
                <Button
                  onClick={() => {
                    if (lastCapturedImage) {
                      uploadImage(lastCapturedImage)
                    }
                  }}
                  disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Upload Image
                    </>
                  )}
                </Button>
              </>
            ) : null}
          </CardFooter>
        </Card>
        
        {machine && (
          <div className="mt-4 p-4 rounded-lg bg-blue-900/20 border border-blue-800 text-sm">
            <p className="text-blue-300">
              <span className="font-semibold">Upload Interval:</span>{" "}
              {machine.upload_interval_seconds} seconds
            </p>
            <p className="text-blue-300 mt-1">
              <span className="font-semibold">Machine ID:</span> {machine.id}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}