"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Server, Key, Search, MoreVertical, Trash2, Edit, Copy, Clock, File, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Database } from "@/lib/database.types"

// Type for machine data (aligned with your database schema)
type Machine = Database["public"]["Tables"]["machines"]["Row"] & {
  api_key?: string
}

export default function DashboardPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentMachineId, setCurrentMachineId] = useState<string | null>(null)
  const [machineName, setMachineName] = useState("")
  const [uploadInterval, setUploadInterval] = useState("30")
  const [machines, setMachines] = useState<Machine[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [resultStats, setResultStats] = useState<null | {
    detected: number;
    fail: number;
    pending: number;
    total_images: number;
    total_particles: number;
    particles: {
      alpha: number;
      electron: number;
      proton: number;
    };
  }>(null);
  
  const API_ENDPOINT = process.env.API_ENDPOINT || "http://localhost:8080/api";

  useEffect(() => {
    const fetchResultStats = async () => {
      try {
        const res = await fetch(`${API_ENDPOINT}/result`);
        const data = await res.json();
        setResultStats(data);
      } catch (error) {
        console.error("Failed to fetch result stats", error);
      }
    };

    fetchResultStats();
  }, []);

  
  // Fetch machines on component mount
  useEffect(() => {
    if (user) {
      fetchMachines()
    }
  }, [user])

  // Function to fetch machines
  const fetchMachines = async () => {
    try {
      setLoading(true)
      
      if (!user) {
        return
      }
      
      const { data, error } = await supabase
        .from('machines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error("Error fetching machines:", error.message)
        toast({
          title: "Error",
          description: "Failed to load machines. " + error.message,
          variant: "destructive",
        })
        return
      }
      
      if (!data || data.length === 0) {
        setMachines([])
        setLoading(false)
        return
      }
      
      // Process the data
      const processedMachines = data.map(machine => {
        // Generate a deterministic API key based on machine id
        // In a real app, you'd store API keys securely
        const apiKey = machine.id
        
        return {
          ...machine,
          created_at: new Date(machine.created_at).toISOString(),
          api_key: apiKey
        }
      })
      
      setMachines(processedMachines)
    } catch (error: any) {
      console.error("Unexpected error:", error)
      toast({
        title: "Error",
        description: "Something went wrong when fetching machines.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Function to add a new machine
  const addMachine = async () => {
    if (!machineName.trim()) return
    
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add machines.",
          variant: "destructive",
        })
        return
      }
      
      if (isEditMode && currentMachineId) {
        // Update existing machine
        const { error } = await supabase
          .from('machines')
          .update({
            name: machineName,
            upload_interval_seconds: Number.parseInt(uploadInterval) || 30,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentMachineId)
          .eq('user_id', user.id)
        
        if (error) {
          console.error("Error updating machine:", error.message)
          toast({
            title: "Error",
            description: "Failed to update machine. " + error.message,
            variant: "destructive",
          })
          return
        }
        
        toast({
          title: "Success",
          description: "Machine updated successfully.",
        })
      } else {
        // Add new machine
        const newMachine = {
          user_id: user.id,
          name: machineName,
          description: null,
          upload_interval_seconds: Number.parseInt(uploadInterval) || 30,
          status: 'active' as const
        }
        
        const { data, error } = await supabase
          .from('machines')
          .insert([newMachine])
          .select()
        
        if (error) {
          console.error("Error adding machine:", error.message)
          toast({
            title: "Error",
            description: "Failed to add machine. " + error.message,
            variant: "destructive",
          })
          return
        }
        
        toast({
          title: "Success",
          description: (
            <div className="mt-2 flex items-center space-x-3">
              <span>Machine added! </span>
            </div>
          ),
          duration: 5000,
        })
      }
      
      // Reset form and refresh machines
      setMachineName("")
      setUploadInterval("5")
      setIsDialogOpen(false)
      setIsEditMode(false)
      setCurrentMachineId(null)
      fetchMachines()
    } catch (error: any) {
      console.error("Unexpected error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Function to delete a machine
  const deleteMachine = async (id: string) => {
    try {
      if (!user) return
      
      // Delete the machine
      const { error } = await supabase
        .from('machines')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      
      if (error) {
        console.error("Error deleting machine:", error.message)
        toast({
          title: "Error",
          description: "Failed to delete machine. " + error.message,
          variant: "destructive",
        })
        return
      }
      
      // Update local state
      setMachines(machines.filter(machine => machine.id !== id))
      
      toast({
        title: "Success",
        description: "Machine deleted successfully.",
      })
    } catch (error: any) {
      console.error("Unexpected error:", error)
      toast({
        title: "Error",
        description: "Something went wrong when deleting the machine.",
        variant: "destructive",
      })
    }
  }

  // Function to open edit dialog
  const openEditDialog = (machine: Machine) => {
    setIsEditMode(true)
    setCurrentMachineId(machine.id)
    setMachineName(machine.name)
    setUploadInterval(machine.upload_interval_seconds.toString())
    setIsDialogOpen(true)
  }

  // Function to open add dialog
  const openAddDialog = () => {
    setIsEditMode(false)
    setCurrentMachineId(null)
    setMachineName("")
    setUploadInterval("5")
    setIsDialogOpen(true)
  }

  // Function to copy API key
  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey)
    toast({
      title: "API Key copied to clipboard",
      duration: 2000,
    })
  }

  // Filter machines based on search query
  const filteredMachines = machines.filter((machine) => 
    machine.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-400">Machine Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search machines..."
                  className="w-64 bg-gray-800 border-gray-700 pl-9 text-white placeholder-gray-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                onClick={openAddDialog}
                className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Machine
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : machines.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-900 p-12 text-center"
          >
            <Server className="h-12 w-12 text-gray-500" />
            <h2 className="mt-4 text-xl font-semibold text-gray-300">No machines added yet</h2>
            <p className="mt-2 text-gray-500">Add your first machine to get started</p>
            <Button
              onClick={openAddDialog}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Machine
            </Button>
          </motion.div>
        ) : ( 
          <div>
            <AnimatePresence>
            {resultStats && (
              <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center text-sm text-white">
                <div className="rounded-lg bg-gray-800 p-4">
                  <p className="text-gray-400">Detected</p>
                  <p className="text-blue-400 font-bold text-xl">{resultStats.detected}</p>
                </div>
                <div className="rounded-lg bg-gray-800 p-4">
                  <p className="text-gray-400">Pending</p>
                  <p className="text-yellow-400 font-bold text-xl">{resultStats.pending}</p>
                </div>
                <div className="rounded-lg bg-gray-800 p-4">
                  <p className="text-gray-400">Fail</p>
                  <p className="text-red-400 font-bold text-xl">{resultStats.fail}</p>
                </div>
                <div className="rounded-lg bg-gray-800 p-4">
                  <p className="text-gray-400">Images</p>
                  <p className="text-cyan-400 font-bold text-xl">{resultStats.total_images}</p>
                </div>
                <div className="rounded-lg bg-gray-800 p-4">
                  <p className="text-gray-400">Particles</p>
                  <p className="text-green-400 font-bold text-xl">{resultStats.total_particles}</p>
                </div>
                <div className="rounded-lg bg-gray-800 p-4">
                  <p className="text-gray-400">α / e⁻ / p⁺</p>
                  <p className="text-purple-400 font-bold text-xl">
                    {resultStats.particles.alpha} / {resultStats.particles.electron} / {resultStats.particles.proton}
                  </p>
                </div>
              </div>
            )} 
            </AnimatePresence>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"> 
              <AnimatePresence>
                {filteredMachines.map((machine) => (
                  <motion.div
                    key={machine.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    layout
                  >
                    <Card className="overflow-hidden bg-gray-900 border-gray-800 text-gray-100 hover:border-gray-700 transition-colors">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`h-2.5 w-2.5 rounded-full ${
                                machine.status === "active"
                                  ? "bg-green-500"
                                  : machine.status === "inactive"
                                    ? "bg-red-500"
                                    : "bg-yellow-500"
                              }`}
                            />
                            <CardTitle className="text-lg font-medium text-white">{machine.name}</CardTitle>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                              >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-blue-900 border-blue-800 text-white rounded-lg shadow-lg shadow-blue-900/20 p-1.5 w-48"
                            >
                              <DropdownMenuItem
                                className="flex cursor-pointer items-center text-white rounded-md px-3 py-2 text-sm mb-1 focus:bg-blue-800 focus:text-white transition-colors"
                                onClick={() => copyApiKey(machine.api_key || '')}
                              >
                                <Copy className="mr-2 h-4 w-4" /> Copy API Key
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex cursor-pointer items-center text-white rounded-md px-3 py-2 text-sm mb-1 focus:bg-blue-800 focus:text-white transition-colors"
                                onClick={() => {
                                  openEditDialog(machine)
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit Machine
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex cursor-pointer items-center text-white rounded-md px-3 py-2 text-sm mb-1 focus:bg-blue-800 focus:text-white transition-colors"
                                onClick={() => router.push(`/dashboard/file-upload/${machine.id}`)}
                              >
                                <File className="mr-2 h-4 w-4" /> File Upload
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex cursor-pointer items-center text-white rounded-md px-3 py-2 text-sm mb-1 focus:bg-blue-800 focus:text-white transition-colors"
                                onClick={() => router.push(`/dashboard/camera-upload/${machine.id}`)}
                              >
                                <Camera className="mr-2 h-4 w-4" /> Camera Upload
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex cursor-pointer items-center text-white rounded-md px-3 py-2 text-sm mb-1 focus:bg-blue-800 focus:text-white transition-colors"
                                onClick={() => router.push(`/dashboard/result/${machine.id}`)}
                              >
                                <File className="mr-2 h-4 w-4" /> View Result
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex cursor-pointer items-center bg-red-600 text-white rounded-md px-3 py-2 text-sm hover:bg-red-700 focus:bg-red-700 focus:text-white transition-colors"
                                onClick={() => deleteMachine(machine.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Machine
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <CardDescription className="text-gray-400">
                          Created on {new Date(machine.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between space-x-2 rounded-md bg-gray-800 p-3">
                          <div className="flex items-center space-x-2">
                            <Key className="h-4 w-4 text-blue-400" />
                            <code className="text-xs text-blue-400">
                              {machine.api_key || 'API key not available'}
                            </code>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:bg-gray-700 hover:text-blue-400"
                            onClick={() => copyApiKey(machine.api_key || '')}
                            disabled={!machine.api_key}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span className="sr-only">Copy API key</span>
                          </Button>
                        </div>
                        <div className="flex items-center justify-between space-x-2 rounded-md bg-gray-800 p-3">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-blue-400" />
                            <span className="text-xs text-gray-300">Upload Interval:</span>
                          </div>
                          <span className="text-xs font-medium text-blue-400">
                            {machine.upload_interval_seconds} seconds
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t border-gray-800 bg-gray-900/50 pt-3">
                        <div className="flex w-full items-center justify-between text-sm">
                          <span className="text-gray-400">Status:</span>
                          <span
                            className={`font-medium ${
                              machine.status === "active"
                                ? "text-green-400"
                                : machine.status === "inactive"
                                  ? "text-red-400"
                                  : "text-yellow-400"
                            }`}
                          >
                            {machine.status.charAt(0).toUpperCase() + machine.status.slice(1)}
                          </span>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {/* Add/Edit Machine Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-blue-400">
              {isEditMode ? "Edit Machine" : "Add New Machine"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {isEditMode
                ? "Update your machine settings."
                : "Enter a name for your machine. You'll receive an API key after creation."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="machine-name" className="text-gray-300">
                Machine Name
              </Label>
              <Input
                id="machine-name"
                placeholder="Enter machine name"
                value={machineName}
                onChange={(e) => setMachineName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-interval" className="text-gray-300">
                Upload Interval (seconds)
              </Label>
              <Input
                id="upload-interval"
                type="number"
                min="1"
                placeholder="30"
                value={uploadInterval}
                onChange={(e) => setUploadInterval(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                setIsEditMode(false)
                setCurrentMachineId(null)
                setMachineName("")
                setUploadInterval("30")
              }}
              className="border-blue-800 bg-blue-950/30 text-blue-400 hover:bg-blue-900/50 hover:text-blue-300"
            >
              Cancel
            </Button>
            <Button
              onClick={addMachine}
              disabled={!machineName.trim() || Number.parseInt(uploadInterval) < 1}
              className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 disabled:opacity-50"
            >
              {isEditMode ? "Update Machine" : "Add Machine"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}