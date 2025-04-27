"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation"; // ✅ fixed import
import { useState, ChangeEvent } from "react";

const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT;
interface FilesUploadPageProps {
  machine: { id: string, name: string };
  apiEndpoint: string;
}

export default function FilesUploadPage({ machine, apiEndpoint }: FilesUploadPageProps) {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(apiEndpoint, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setSelectedFiles([]);
        alert("Upload successful!");
      } else {
        alert("Upload failed. Please try again.");
        console.error("Upload failed:", await response.text());
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <main className="flex flex-col space-y-4">
        <Card className="bg-gray-900 text-white border-gray-800">
          <CardContent className="pt-6">
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*" // ✅ optional: accept only images
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded inline-block"
              >
                {uploading ? "Uploading..." : "Select Files"}
              </label>
              <p className="mt-2 text-sm text-gray-400">
                Drag and drop files here or click to browse
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="relative bg-gray-800 p-3 rounded group flex items-center"
                  >
                    <div className="flex-1 truncate">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>

                    {!uploading && (
                      <button
                        className="absolute top-2 right-2 h-8 w-8 bg-red-500/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {!uploading && selectedFiles.length > 0 && (
                <div className="flex justify-end space-x-2 mt-6">
                  <Button
                    onClick={uploadFiles}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Upload {selectedFiles.length > 1 ? 'All Files' : 'File'}
                  </Button>
                </div>
              )}

              {uploading && (
                <div className="flex justify-center mt-6">
                  <Button disabled className="bg-blue-700">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </Button>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between text-sm text-gray-500">
            <div>
              API Endpoint: <span className="text-blue-400">{apiEndpoint}</span>
            </div>
            {machine && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-xs text-gray-400 hover:text-white">
                    More Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
                  <DropdownMenuItem
                    onClick={() => router.push(`/dashboard/machine/${machine.id}`)}
                    className="hover:bg-gray-700 cursor-pointer"
                  >
                    View Machine Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard')}
                    className="hover:bg-gray-700 cursor-pointer"
                  >
                    Back to Dashboard
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
