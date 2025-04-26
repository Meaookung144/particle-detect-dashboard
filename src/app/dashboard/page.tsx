"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Server, Key, Search, MoreVertical, Trash2, Edit, Copy, Clock } from "lucide-react"
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

// Type for machine data
interface Machine {
  id: string
  name: string
  apiKey: string
  createdAt: Date
  status: "online" | "offline" | "maintenance"
  uploadIntervalSeconds: number
}

export default function DashboardPage() {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentMachineId, setCurrentMachineId] = useState<string | null>(null)
  const [machineName, setMachineName] = useState("")
  const [uploadInterval, setUploadInterval] = useState("5")
  const [machines, setMachines] = useState<Machine[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Function to generate a random API key
  const generateApiKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let apiKey = ""
    for (let i = 0; i < 32; i++) {
      apiKey += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return apiKey
  }

  // Function to add a new machine
  const addMachine = () => {
    if (!machineName.trim()) return

    if (isEditMode && currentMachineId) {
      // Edit existing machine
      const updatedMachines = machines.map((machine) => {
        if (machine.id === currentMachineId) {
          return {
            ...machine,
            name: machineName,
            uploadIntervalSeconds: Number.parseInt(uploadInterval) || 5,
          }
        }
        return machine
      })

      setMachines(updatedMachines)
      toast({
        title: "Machine updated",
        description: "The machine settings have been updated successfully.",
        duration: 3000,
      })
    } else {
      // Add new machine
      const apiKey = generateApiKey()
      const newMachine: Machine = {
        id: Date.now().toString(),
        name: machineName,
        apiKey,
        createdAt: new Date(),
        status: Math.random() > 0.7 ? "offline" : "online",
        uploadIntervalSeconds: Number.parseInt(uploadInterval) || 5,
      }

      setMachines([...machines, newMachine])

      // Show success toast with API key
      toast({
        title: "Machine added successfully",
        description: (
          <div className="mt-2 flex items-center space-x-3">
            <span>API Key: </span>
            <code className="relative rounded bg-gray-800 px-[0.3rem] py-[0.2rem] font-mono text-sm text-blue-400">
              {apiKey.substring(0, 8)}...{apiKey.substring(apiKey.length - 8)}
            </code>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 bg-gray-800 border-gray-700 hover:bg-gray-700 hover:text-blue-400"
              onClick={() => {
                navigator.clipboard.writeText(apiKey)
                toast({
                  title: "API Key copied to clipboard",
                  duration: 2000,
                })
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        ),
        duration: 5000,
      })
    }

    // Reset form
    setMachineName("")
    setUploadInterval("5")
    setIsDialogOpen(false)
    setIsEditMode(false)
    setCurrentMachineId(null)
  }

  // Function to open edit dialog
  const openEditDialog = (machine: Machine) => {
    setIsEditMode(true)
    setCurrentMachineId(machine.id)
    setMachineName(machine.name)
    setUploadInterval(machine.uploadIntervalSeconds.toString())
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

  // Function to delete a machine
  const deleteMachine = (id: string) => {
    setMachines(machines.filter((machine) => machine.id !== id))
    toast({
      title: "Machine deleted",
      description: "The machine has been removed from your account.",
      variant: "destructive",
      duration: 3000,
    })
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
  const filteredMachines = machines.filter((machine) => machine.name.toLowerCase().includes(searchQuery.toLowerCase()))

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
        {machines.length === 0 ? (
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
                              machine.status === "online"
                                ? "bg-green-500"
                                : machine.status === "offline"
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
                              onClick={() => copyApiKey(machine.apiKey)}
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
                              className="flex cursor-pointer items-center bg-red-600 text-white rounded-md px-3 py-2 text-sm hover:bg-red-700 focus:bg-red-700 focus:text-white transition-colors"
                              onClick={() => deleteMachine(machine.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Machine
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription className="text-gray-400">
                        Created on {machine.createdAt.toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between space-x-2 rounded-md bg-gray-800 p-3">
                        <div className="flex items-center space-x-2">
                          <Key className="h-4 w-4 text-blue-400" />
                          <code className="text-xs text-blue-400">
                            {machine.apiKey.substring(0, 8)}...{machine.apiKey.substring(machine.apiKey.length - 8)}
                          </code>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-400 hover:bg-gray-700 hover:text-blue-400"
                          onClick={() => copyApiKey(machine.apiKey)}
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
                          {machine.uploadIntervalSeconds} seconds
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-gray-800 bg-gray-900/50 pt-3">
                      <div className="flex w-full items-center justify-between text-sm">
                        <span className="text-gray-400">Status:</span>
                        <span
                          className={`font-medium ${
                            machine.status === "online"
                              ? "text-green-400"
                              : machine.status === "offline"
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
                placeholder="5"
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
                setUploadInterval("5")
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
