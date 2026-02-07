'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/estudiante');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-white/60 mt-4 text-sm">Redirigiendo...</p>
      </div>
    </div>
  );
}
