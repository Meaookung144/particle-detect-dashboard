"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Clock, AlertCircle, ArrowLeft, RefreshCw, Filter, SortAsc } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Type definition for the result item
type ResultItem = {
  id: string
  machine_id: string
  filename: string
  thumbnail_filename: string | null
  status: "pending" | "detected" | "failed"
  detection_data: any | null
  created_at: string
  updated_at: string
}

// Type for sort option
type SortOption = "all" | "pending" | "detected" | "failed"

export default function ResultPage() {
  const { id } = useParams() as { id: string }
  const [results, setResults] = useState<ResultItem[]>([])
  const [filteredResults, setFilteredResults] = useState<ResultItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortStatus, setSortStatus] = useState<SortOption>("all")

  const fetchResults = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`http://localhost:8080/api/list/machine/image/${id}`)
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }
      
      const data = await response.json()
      setResults(data)
      filterResults(data, sortStatus)
    } catch (err: any) {
      console.error("Error fetching results:", err)
      setError(err.message || "Failed to load results")
    } finally {
      setLoading(false)
    }
  }

  // Filter results based on selected sort option
  const filterResults = (data: ResultItem[], status: SortOption) => {
    if (status === "all") {
      setFilteredResults(data)
    } else {
      setFilteredResults(data.filter(item => item.status === status))
    }
  }

  // Handle sort change
  const handleSortChange = (value: string) => {
    const sortOption = value as SortOption
    setSortStatus(sortOption)
    filterResults(results, sortOption)
  }

  useEffect(() => {
    if (id) {
      fetchResults()
    }
  }, [id])

  // Format the date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get status icon based on status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "detected":
        return <Check className="h-5 w-5 text-green-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  // Get status text color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "detected":
        return "text-green-500"
      case "pending":
        return "text-yellow-500"
      case "failed":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }
  
  // Count status totals
  const getStatusCounts = () => {
    const pending = results.filter(r => r.status === "pending").length
    const detected = results.filter(r => r.status === "detected").length
    const failed = results.filter(r => r.status === "failed").length
    
    return { pending, detected, failed, total: results.length }
  }
  
  const statusCounts = getStatusCounts()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-blue-400">Machine Results</h1>
              
              {!loading && !error && results.length > 0 && (
                <div className="ml-4 px-3 py-1 rounded-full bg-gray-800 text-sm font-medium flex items-center">
                  <span className="text-blue-400 mr-1">{statusCounts.total}</span>
                  <span className="text-gray-400">images</span>
                  <span className="mx-1.5 text-gray-600">•</span>
                  <span className="text-yellow-500 mr-1">{statusCounts.pending}</span>
                  <span className="text-gray-400">pending</span>
                  <span className="mx-1.5 text-gray-600">•</span>
                  <span className="text-green-500 mr-1">{statusCounts.detected}</span>
                  <span className="text-gray-400">detected</span>
                  <span className="mx-1.5 text-gray-600">•</span>
                  <span className="text-red-500 mr-1">{statusCounts.failed}</span>
                  <span className="text-gray-400">failed</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {!loading && !error && results.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-800 border-gray-700 text-blue-400 hover:bg-gray-700"
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Filter {sortStatus !== "all" && `(${sortStatus})`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white">
                    <DropdownMenuLabel className="text-gray-400">Filter by Status</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuRadioGroup value={sortStatus} onValueChange={handleSortChange}>
                      <DropdownMenuRadioItem value="all" className="focus:bg-gray-800 focus:text-white cursor-pointer">
                        All ({statusCounts.total})
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="pending" className="focus:bg-gray-800 focus:text-white cursor-pointer">
                        <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                        Pending ({statusCounts.pending})
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="detected" className="focus:bg-gray-800 focus:text-white cursor-pointer">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        detected ({statusCounts.detected})
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="failed" className="focus:bg-gray-800 focus:text-white cursor-pointer">
                        <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                        Failed ({statusCounts.failed})
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <Button
                onClick={fetchResults}
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-700 text-blue-400 hover:bg-gray-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
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
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-red-800 bg-red-900/20 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-semibold text-red-300">Error Loading Results</h2>
            <p className="mt-2 text-red-400">{error}</p>
            <Button
              onClick={fetchResults}
              className="mt-6 bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        ) : results.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-900 p-12 text-center"
          >
            <div className="rounded-full bg-gray-800 p-4">
              <AlertCircle className="h-8 w-8 text-gray-500" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-300">No results found</h2>
            <p className="mt-2 text-gray-500">This machine hasn't uploaded any files yet</p>
            <Link href="/dashboard">
              <Button
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <AnimatePresence>
              {filteredResults.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  layout
                >
                  <Card className="overflow-hidden bg-gray-900 border-gray-800 text-gray-100 hover:border-gray-700 transition-colors">
                    <div className="relative aspect-video bg-gray-800 overflow-hidden">
                      <img
                        src={result.filename}
                        alt="Result"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-image.jpg"
                          e.currentTarget.onerror = null
                        }}
                      />
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <div className="flex items-center">
                        {getStatusIcon(result.status)}
                        <span className={`ml-2 text-xs font-medium ${getStatusColor(result.status)}`}>
                          {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(result.created_at)}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}