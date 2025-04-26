import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-blue-400">Welcome</h1>
            <p className="text-gray-400">Sign in to your account or create a new one to get started.</p>
          </div>
          <div className="space-y-4 pt-4">
            <Link href="/login">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 transform hover:scale-105">
                Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <div className="pt-2"></div>
            <Link href="/register">
              <Button
                variant="outline"
                className="w-full border-blue-600 text-blue-400 hover:bg-blue-900/20 transition-all duration-300 transform hover:scale-105"
              >
                Register
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-gray-500">
        <p>© {new Date().getFullYear()} Your Company. All rights reserved.</p>
      </footer>
    </div>
  )
}
