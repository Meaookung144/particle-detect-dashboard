// pages/index.tsx
"use client";
import Head from 'next/head';
import { useState, useEffect } from 'react';
import type { NextPage } from 'next';

interface LinkItem {
  title: string;
  url: string;
  icon?: string;
}

const links: LinkItem[] = [
  {
    title: "MWIT Student Committee Official Website",
    url: "https://mwit.ac.th/stc",
    icon: "🏫"
  },
  {
    title: "ติดต่อฝ่ายกิจการนักเรียน",
    url: "https://forms.gle/example1",
    icon: "📝"
  },
  {
    title: "ระบบลงทะเบียนกิจกรรมชุมนุม",
    url: "https://club.mwit.ac.th",
    icon: "🎭"
  },
  {
    title: "ปฏิทินกิจกรรมโรงเรียน",
    url: "https://calendar.mwit.ac.th",
    icon: "📅"
  },
  {
    title: "ช่องทางร้องเรียน",
    url: "https://forms.gle/example2",
    icon: "📢"
  },
  {
    title: "Instagram",
    url: "https://instagram.com/mwit_stc",
    icon: "📸"
  },
  {
    title: "Facebook",
    url: "https://facebook.com/mwitstc",
    icon: "👍"
  }
];

const Home: NextPage = () => {
  const [mounted, setMounted] = useState(false);

  // This useEffect ensures the component animations only happen client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-950 relative overflow-hidden">
      {/* Yellow glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-yellow-200 rounded-full opacity-15 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="max-w-md mx-auto relative z-10 p-6">
        <Head>
          <title>MWIT Student Committee Links</title>
          <meta name="description" content="Important links for MWIT students" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;700&display=swap" rel="stylesheet" />
        </Head>

        <main className="flex flex-col items-center justify-center py-10">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-blue-400 mb-4 shadow-lg shadow-blue-500/50">
            <img 
              src="/logo-placeholder.png" 
              alt="MWIT Student Committee" 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=MWIT&background=0D47A1&color=fff&size=100`;
              }}
            />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2 text-center">คณะกรรมการนักเรียน MWIT</h1>
          <p className="text-blue-200 text-center mb-8">Student Committee, Mahidol Wittayanusorn School</p>
          
          <div className="space-y-4 w-full">
            {links.map((link, index) => (
              <a 
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 bg-blue-800/40 backdrop-blur-sm rounded-lg border border-blue-700/50 hover:bg-blue-700/60 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-yellow-300/20 group w-full"
              >
                <span className="text-xl mr-3">{link.icon}</span>
                <span className="text-white group-hover:text-yellow-200 transition-colors font-medium">{link.title}</span>
              </a>
            ))}
          </div>
          
          <footer className="mt-10 text-blue-300 text-center text-sm">
            <p>© {new Date().getFullYear()} MWIT Student Committee</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Home;