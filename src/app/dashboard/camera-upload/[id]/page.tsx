"use client"

import { useState, useEffect, useRef, ChangeEvent } from "react"
import { useParams, useRouter } from "next/navigation"
import { Camera, RefreshCw, Check, X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/auth"
import { Database } from "@/lib/database.types"

// Type for machine data
type Machine = Database["public"]["Tables"]["machines"]["Row"]

export default function CameraUploadPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const machineId = params?.id as string

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [machine, setMachine] = useState<Machine | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [countdown, setCountdown] = useState<number>(0)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");


  const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8080/api/upload"
  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
  }, [facingMode]); // Whenever facingMode changes
  useEffect(() => {
    const fetchMachine = async () => {
      const { data, error } = await supabase.from('machines').select('*').eq('id', machineId).single()
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" })
      } else {
        setMachine(data)
      }
    }
    fetchMachine()

    return () => {
      stopCamera()
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [machineId, toast])

  const startCamera = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      console.error("Camera not supported in this environment.");
      toast({
        title: "Camera Error",
        description: "Camera is not supported in this environment.",
        variant: "destructive",
      });
      return;
    }
  
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false
      });
  
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
  
        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current?.play();
          console.log("Video metadata loaded and playing");
        };
      }
  
      setStream(mediaStream);
      setIsCameraActive(true);
      if (machine) startCountdown();
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera Error",
        description: "Could not access camera: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };
  
  
  
  

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop())
    setStream(null)
    setIsCameraActive(false)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }

  const startCountdown = () => {
    if (!machine) return
    setCountdown(machine.upload_interval_seconds)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          captureImage()
          return machine.upload_interval_seconds
        }
        return prev - 1
      })
    }, 1000)
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      if (context) {
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        if (videoRef.current.readyState < 2) { // 2 = HAVE_CURRENT_DATA
          console.warn("Video not ready to capture");
          return;
        }
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        setLastCapturedImage(dataUrl)
        uploadCapturedImage(dataUrl)
      }
    }
  }

  function dataURLtoBlob(dataURL: string) {
    const arr = dataURL.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }

    return new Blob([u8arr], { type: mime })
  }

  const uploadCapturedImage = async (imageDataUrl: string) => {
    if (!imageDataUrl || !machine) return

    setUploading(true)
    setUploadProgress(0)

    const blob = dataURLtoBlob(imageDataUrl)

    const formData = new FormData()
    formData.append("image", blob, `camera_${Date.now()}.jpg`)
    formData.append("machine_id", machine.id)

    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        setUploadProgress(percent)
      }
    })

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status >= 200 && xhr.status < 300) {
          toast({ title: "Upload Successful", description: "Image uploaded successfully." })
        } else {
          toast({ title: "Upload Error", description: xhr.responseText, variant: "destructive" })
        }
        setUploading(false)
        setUploadProgress(0)
      }
    }

    xhr.open("POST", apiEndpoint)
    xhr.send(formData)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Button variant="ghost" size="icon" className="mr-2 text-gray-400 hover:text-white" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-blue-400">
            {machine ? `Camera Upload: ${machine.name}` : 'Camera Upload'}
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="overflow-hidden bg-gray-900 border-gray-800 text-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <Camera className="mr-2 h-5 w-5 text-blue-400" /> Camera Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {isCameraActive ? (
              <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full max-w-md bg-black rounded-lg"
            />
            
            ) : (
              <div className="flex flex-col items-center justify-center bg-gray-800 p-12 rounded-lg">
                <Camera className="h-12 w-12 text-gray-500 mb-4" />
                <p className="text-gray-400">Camera is inactive</p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />

            {lastCapturedImage && (
              <img src={lastCapturedImage} alt="Captured" className="mt-4 w-full max-w-md rounded-lg" />
            )}

            {uploading && (
              <div className="mt-4 w-full bg-gray-700 rounded-full overflow-hidden">
                <div className="h-2 bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}

            {isCameraActive && machine && (
              <div className="mt-4 text-blue-400 font-bold">
                Next capture in: {countdown} sec
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap justify-between gap-2">
            {!isCameraActive ? (
              <Button onClick={startCamera} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Camera className="mr-2 h-4 w-4" /> Start Camera
              </Button>
            ) : (
              <Button onClick={stopCamera} variant="destructive" className="bg-red-600 hover:bg-red-700">
                <X className="mr-2 h-4 w-4" /> Stop Camera
              </Button>
            )}
            {isCameraActive && (
            <Button
              onClick={() => {
                stopCamera(); // Stop old stream
                setFacingMode((prev) => (prev === "user" ? "environment" : "user")); // Switch
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Switch Camera
            </Button>
          )}
          </CardFooter>
        </Card>

        {machine && (
          <div className="mt-4 p-4 rounded-lg bg-blue-900/20 border border-blue-800 text-sm">
            <p className="text-blue-300">
              <span className="font-semibold">Upload Interval:</span> {machine.upload_interval_seconds} seconds
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
