'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { isAdmin } from '@/lib/admin-auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && user.email && isAdmin(user.email)) {
                setAuthorized(true);
                setLoading(false);
            } else {
                setAuthorized(false);
                setLoading(false);
                router.replace('/estudiante');
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-white/60 mt-4 text-sm">Verificando acceso...</p>
                </div>
            </div>
        );
    }

    if (!authorized) {
        return null; // El redirect ya se disparó
    }

    return <>{children}</>;
}
