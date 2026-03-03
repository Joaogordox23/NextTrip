"use client";

import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { TripCard } from '@/components/features/trips/trip-card';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ClientDashboardPage() {
    const { user } = useAuthStore();
    const router = useRouter();

    // Basic guard against refresh unauth flashes
    useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router])

    const { data, isLoading, error } = useQuery({
        queryKey: ['client-trips', user?.id],
        queryFn: async () => {
            const res = await fetch('/api/v1/trips');
            if (!res.ok) throw new Error('Falha ao carregar seus roteiros');
            return res.json();
        },
        enabled: !!user?.id
    });

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-6xl pb-24">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Meus Roteiros</h1>
                <p className="text-muted-foreground mt-1">
                    Olá, {user?.name?.split(' ')[0] || 'Viajante'}! Acompanhe suas viagens planejadas.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="space-y-3">
                            <Skeleton className="h-[180px] w-full rounded-xl" />
                        </div>
                    ))
                ) : error ? (
                    <div className="col-span-full p-8 text-center text-red-500 bg-red-50 rounded-lg">
                        Ocorreu um erro ao carregar seus roteiros. Contate sua agência.
                    </div>
                ) : data?.trips.length === 0 ? (
                    <div className="col-span-full p-12 text-center border border-dashed rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
                        <h3 className="text-lg font-medium">Você ainda não possui viagens.</h3>
                        <p className="text-muted-foreground mt-2">Os roteiros preparados pela sua agência aparecerão aqui.</p>
                    </div>
                ) : (
                    data?.trips.map((trip: any) => (
                        <Link key={trip.id} href={`/client/trips/${trip.id}`}>
                            <TripCard trip={trip} />
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
