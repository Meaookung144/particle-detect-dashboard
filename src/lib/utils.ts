import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names with Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string to a readable format
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format a date string to include time
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Format a date to show time ago (e.g., "2 minutes ago")
 */
export function timeAgo(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  
  let interval = Math.floor(seconds / 31536000)
  if (interval >= 1) {
    return `${interval} year${interval === 1 ? '' : 's'} ago`
  }
  
  interval = Math.floor(seconds / 2592000)
  if (interval >= 1) {
    return `${interval} month${interval === 1 ? '' : 's'} ago`
  }
  
  interval = Math.floor(seconds / 86400)
  if (interval >= 1) {
    return `${interval} day${interval === 1 ? '' : 's'} ago`
  }
  
  interval = Math.floor(seconds / 3600)
  if (interval >= 1) {
    return `${interval} hour${interval === 1 ? '' : 's'} ago`
  }
  
  interval = Math.floor(seconds / 60)
  if (interval >= 1) {
    return `${interval} minute${interval === 1 ? '' : 's'} ago`
  }
  
  return `${Math.floor(seconds)} second${Math.floor(seconds) === 1 ? '' : 's'} ago`
}

/**
 * Generate a random string (useful for temporary IDs)
 */
export function randomId(length = 10): string {
  return Math.random().toString(36).substring(2, 2 + length)
}

/**
 * Get status color class based on status string
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'detected':
      return 'bg-green-500'
    case 'pending':
      return 'bg-yellow-500'
    case 'inactive':
    case 'failed':
      return 'bg-red-500'
    case 'maintenance':
      return 'bg-blue-500'
    default:
      return 'bg-gray-500'
  }
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Extract filename from a path
 */
export function getFilename(path: string): string {
  return path.split('/').pop() || path
}

/**
 * Convert a file to a data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Parse a filename to extract machine ID, timestamp, etc.
 * Format: machineid_timestamp_imageid.jpg or 
 * machineid_timestamp_imageid_class_particleid.jpg
 */
export function parseFilename(filename: string) {
  const parts = filename.split('_')
  
  if (parts.length < 3) {
    throw new Error('Invalid filename format')
  }
  
  const machineId = parts[0]
  const timestamp = parseInt(parts[1])
  
  // Check if this is an original image or a particle
  if (parts.length === 3) {
    // Original image: machineid_timestamp_imageid.jpg
    const imageId = parts[2].split('.')[0]
    
    return {
      type: 'original',
      machineId,
      timestamp,
      imageId,
    }
  } else if (parts.length === 5) {
    // Particle: machineid_timestamp_imageid_class_particleid.jpg
    const imageId = parts[2]
    const particleClass = parts[3]
    const particleId = parts[4].split('.')[0]
    
    return {
      type: 'particle',
      machineId,
      timestamp,
      imageId,
      particleClass,
      particleId,
    }
  }
  
  throw new Error('Invalid filename format')
}